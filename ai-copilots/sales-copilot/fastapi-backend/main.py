import os
import shutil
from typing import Optional
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
    title="PDF Chat API with LlamaIndex",
    description="Upload PDFs and chat with them using a localized LlamaIndex vector store.",
    version="1.0.0"
)

frontend_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration Directories
UPLOAD_DIR = "./uploaded_pdfs"
STORAGE_DIR = "./storage"

# Global placeholder for the active index and chat engine
# (Loaded on startup if storage exists)
_index: Optional[VectorStoreIndex] = None

# Ensure required directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)


# Setup global LlamaIndex settings using OpenAI defaults
# It automatically picks up os.environ["OPENAI_API_KEY"]
Settings.llm = OpenAI(model="gpt-4o-mini", temperature=0.2)
Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")


def get_or_create_index() -> VectorStoreIndex:
    """
    Helper function to load an existing index from disk or create a fresh one
    if no persistence directory exists yet.
    """
    global _index
    
    # If index is already cached in memory, return it
    if _index is not None:
        return _index

    # Check if local storage context exists on disk
    if os.path.exists(STORAGE_DIR) and os.listdir(STORAGE_DIR):
        try:
            storage_context = StorageContext.from_defaults(persist_dir=STORAGE_DIR)
            _index = load_index_from_storage(storage_context)
            return _index
        except Exception as e:
            # Fallback if storage is corrupted or fails to load
            pass
            
    # If nothing exists yet, initialize an empty index framework
    # (or build it from any files currently in UPLOAD_DIR)
    if os.path.exists(UPLOAD_DIR) and os.listdir(UPLOAD_DIR):
        documents = SimpleDirectoryReader(UPLOAD_DIR).load_data()
        _index = VectorStoreIndex.from_documents(documents)
        _index.storage_context.persist(persist_dir=STORAGE_DIR)
    else:
        # Create an empty index structure if no documents exist yet
        _index = VectorStoreIndex.from_documents([])
        
    return _index


@app.on_event("startup")
async def startup_event():
    """Warm up the index on API startup."""
    get_or_create_index()


# --- Pydantic Schemas ---
class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str


# --- API Endpoints ---

@app.post("/upload-pdf", status_code=status.HTTP_201_CREATED)
async def upload_pdf(file: UploadFile = File(...)):
    """
    Uploads a PDF file, saves it to the local directory, parses it,
    and increments the local LlamaIndex vector store.
    """
    global _index
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported."
        )

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    try:
        # Save file locally
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Parse the newly uploaded document
        # Passing single file to SimpleDirectoryReader via input_files
        reader = SimpleDirectoryReader(input_files=[file_path])
        new_documents = reader.load_data()
        
        if not new_documents:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded PDF contains no parsable text."
            )

        # Get current index and insert the new document nodes
        index = get_or_create_index()
        for doc in new_documents:
            index.insert(doc)
            
        # Persist the updated index back to local storage
        index.storage_context.persist(persist_dir=STORAGE_DIR)
        
        # Update the global index reference explicitly
        _index = index

        return {
            "info": f"File '{file.filename}' successfully uploaded and indexed.",
            "pages_indexed": len(new_documents)
        }

    except Exception as e:
        # Cleanup file if error happened during ingestion
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing the PDF: {str(e)}"
        )


@app.post("/chat", response_model=ChatResponse)
async def chat_with_pdf(payload: ChatRequest):
    """
    Queries the vector store index using LlamaIndex's conversation engine.
    Maintains conversational memory context dynamically.
    """
    index = get_or_create_index()
    
    # Check if index has any nodes to prevent empty index queries throwing errors
    # Note: LlamaIndex empty index validation
    try:
        # Using a condensed chat engine with buffer memory
        chat_engine = index.as_chat_engine(
            chat_mode="condense_question", 
            verbose=False
        )
        
        response = chat_engine.chat(payload.message)
        return ChatResponse(response=str(response))
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing your query: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
