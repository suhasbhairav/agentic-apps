import os
import shutil
from typing import Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    StorageContext,
    load_index_from_storage,
    Settings
)
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding

# Initialize FastAPI app
app = FastAPI(
    title="Customer Support CoPilot API with LlamaIndex",
    description="Customized LlamaIndex-based backend to ingest reference docs and generate responses in varying service tones.",
    version="1.0.0"
)

# CORS configuration matching original setup
frontend_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001",
    ).split(",")
    if origin.strip()
]

# Ensure wildcard local host bindings are supported in development
if not any(url in frontend_origins for url in ["http://localhost:5173", "http://127.0.0.1:5173"]):
    frontend_origins.extend(["http://localhost:5173", "http://127.0.0.1:5173"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if not frontend_origins else frontend_origins, # fallback to unrestricted in debug
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration Directories
UPLOAD_DIR = "./uploaded_pdfs"
STORAGE_DIR = "./storage"

# Global placeholder for the active index
_index: Optional[VectorStoreIndex] = None

# Ensure directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(STORAGE_DIR, exist_ok=True)

# Setup LlamaIndex settings
Settings.llm = OpenAI(model="gpt-4o-mini", temperature=0.2)
Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")


def get_or_create_index() -> VectorStoreIndex:
    """
    Helper function to load an existing index from disk or create a fresh one
    if no persistence directory exists yet.
    """
    global _index
    
    # If index is cached, return it
    if _index is not None:
        return _index

    # Check for storage
    if os.path.exists(STORAGE_DIR) and os.listdir(STORAGE_DIR):
        try:
            storage_context = StorageContext.from_defaults(persist_dir=STORAGE_DIR)
            _index = load_index_from_storage(storage_context)
            return _index
        except Exception:
            # Fallback if storage fails
            pass
            
    # Build it from files in directory or instantiate empty structure
    if os.path.exists(UPLOAD_DIR) and os.listdir(UPLOAD_DIR):
        documents = SimpleDirectoryReader(UPLOAD_DIR).load_data()
        _index = VectorStoreIndex.from_documents(documents)
        _index.storage_context.persist(persist_dir=STORAGE_DIR)
    else:
        _index = VectorStoreIndex.from_documents([])
        
    return _index


@app.on_event("startup")
async def startup_event():
    """Warm up index on startup."""
    get_or_create_index()


# --- Pydantic Schemas ---
class ChatRequest(BaseModel):
    message: str
    tone: str = "empathetic"  # "empathetic" | "technical" | "formal" | "concise"
    ticket_context: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    response: str


# --- API Endpoints ---

@app.post("/upload-pdf", status_code=status.HTTP_201_CREATED)
async def upload_pdf(file: UploadFile = File(...)):
    """
    Uploads policy or service manuals to update active RAG database indices.
    """
    global _index
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents are supported."
        )

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    try:
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Parse document
        reader = SimpleDirectoryReader(input_files=[file_path])
        new_documents = reader.load_data()
        
        if not new_documents:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded PDF contains no parsable text."
            )

        # Ingest new document nodes into the global context index
        index = get_or_create_index()
        for doc in new_documents:
            index.insert(doc)
            
        # Persist update
        index.storage_context.persist(persist_dir=STORAGE_DIR)
        _index = index

        return {
            "info": f"Document '{file.filename}' processed successfully. Context updated.",
            "pages_indexed": len(new_documents)
        }

    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while indexing this support document: {str(e)}"
        )


@app.post("/chat", response_model=ChatResponse)
async def chat_with_pdf(payload: ChatRequest):
    """
    Query system database index. Uses a contextual system prompt modified by:
    1. Tone setting (Empathetic, Technical, Formal, Concise)
    2. Simulated Live Customer ticket context details.
    """
    # Safeguard against querying an empty database
    is_database_empty = not os.listdir(STORAGE_DIR) and not os.listdir(UPLOAD_DIR)
    if is_database_empty:
        return ChatResponse(
            response=(
                "Hello! I am ready to draft responses for you, but I do not have any knowledge base documents "
                "to search yet. Please upload a service policy, FAQ, or product manual PDF in the sidebar "
                "so I can provide accurate, reference-grounded replies."
            )
        )

    index = get_or_create_index()
    
    # Interpolate Active Ticket Context into prompt parameters if available
    ticket_str = ""
    if payload.ticket_context:
        ticket_str = (
            f"Active Ticket Info:\n"
            f"- Customer Name: {payload.ticket_context.get('customer', 'N/A')}\n"
            f"- Account Tier: {payload.ticket_context.get('tier', 'Standard')}\n"
            f"- Current Issue: {payload.ticket_context.get('summary', 'Unknown')}\n"
            f"- Ticket Reference ID: {payload.ticket_context.get('id', 'N/A')}\n\n"
        )

    # Dynamic system prompt instructing the agent's tone constraints
    tone_instructions = {
        "empathetic": "empathetic, warm, apologizing for any inconvenience, and focusing heavily on patient conflict resolution.",
        "technical": "analytical, precise, logical, providing clear hardware or software technical step-by-step instructions.",
        "formal": "polished, highly professional, business-structured, and compliant with enterprise grammar rules.",
        "concise": "short, straight-to-the-point, using minimal wording, and presenting details in clear bullet points where appropriate."
    }
    
    selected_tone_instruction = tone_instructions.get(payload.tone.lower(), tone_instructions["empathetic"])

    system_prompt = (
        "You are an expert Customer Support AI CoPilot assisting human customer service agents.\n"
        "Your goal is to draft responses based strictly on the uploaded reference documents (policies, manuals, SLAs).\n"
        "Always prioritize compliance with company rules mentioned in the documents. "
        "Do not invent facts, warranty timelines, refund percentages, or shipping timeframes not present in the docs.\n\n"
        f"{ticket_str}"
        f"IMPORTANT: The response draft MUST be written in a {selected_tone_instruction} tone. "
        "Do not write conversational filler to the agent. Provide a response that the agent can immediately "
        "copy, paste, and send directly to the customer."
    )

    try:
        # Use Context Mode chat engine to dynamically consult index documents while respecting our tone instructions
        chat_engine = index.as_chat_engine(
            chat_mode="context",
            system_prompt=system_prompt,
            verbose=False
        )
        
        response = chat_engine.chat(payload.message)
        return ChatResponse(response=str(response))
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing your draft query: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)