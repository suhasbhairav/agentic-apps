import os
import shutil
import json
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    StorageContext,
    load_index_from_storage,
    Settings,
)
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding


# ---------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------

app = FastAPI(
    title="Sales Knowledge Engine API",
    description=(
        "A workflow-first AI knowledge engine for sales teams. "
        "Upload sales PDFs, proposals, customer notes, case studies, product docs, "
        "and run 10 guided sales workflows instead of a blank RAG chatbot."
    ),
    version="1.0.0",
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


# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

UPLOAD_DIR = "./uploaded_sales_docs"
STORAGE_DIR = "./storage_sales_knowledge_engine"

os.makedirs(UPLOAD_DIR, exist_ok=True)

_index: Optional[VectorStoreIndex] = None

Settings.llm = OpenAI(
    model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
    temperature=0.2,
)

Settings.embed_model = OpenAIEmbedding(
    model=os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
)


# ---------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------

class ChatRequest(BaseModel):
    message: str = Field(..., description="Free-form question for the sales knowledge base.")


class ChatResponse(BaseModel):
    response: str
    sources: List[Dict[str, Any]] = []


class WorkflowRunRequest(BaseModel):
    account_name: Optional[str] = Field(
        None,
        description="Customer, prospect, account, or company name if available."
    )
    contact_name: Optional[str] = Field(
        None,
        description="Specific contact or stakeholder name if available."
    )
    product_or_service: Optional[str] = Field(
        None,
        description="Product, solution, service, module, or offering."
    )
    deal_stage: Optional[str] = Field(
        None,
        description="Example: discovery, demo, proposal, negotiation, renewal, expansion."
    )
    sales_context: Optional[str] = Field(
        None,
        description="Any notes from CRM, call, email, ticket, proposal, meeting, or opportunity."
    )
    user_question: Optional[str] = Field(
        None,
        description="Optional custom instruction for this workflow."
    )


class WorkflowRunResponse(BaseModel):
    workflow_id: str
    workflow_name: str
    output: str
    suggested_next_actions: List[str]
    sources: List[Dict[str, Any]] = []


class UploadResponse(BaseModel):
    info: str
    pages_indexed: int


class WorkflowInfo(BaseModel):
    workflow_id: str
    workflow_name: str
    description: str
    button_label: str
    best_for: str


# ---------------------------------------------------------
# Sales Workflow Definitions
# ---------------------------------------------------------

SALES_WORKFLOWS: Dict[str, Dict[str, str]] = {
    "account_briefing": {
        "workflow_name": "Account Briefing",
        "button_label": "Generate account brief",
        "description": "Creates a sales-ready account brief from uploaded knowledge.",
        "best_for": "Before discovery calls, demos, QBRs, and customer meetings.",
        "prompt": """
You are a senior B2B sales enablement analyst.

Create a concise but useful ACCOUNT BRIEFING for the sales team.

Use only the retrieved knowledge base context where possible.
If information is missing, say clearly: "Not found in uploaded documents."

Structure the answer as:

1. Account snapshot
2. Known business context
3. Possible pain points
4. Current relationship or opportunity context
5. Relevant products or services
6. Stakeholders mentioned
7. Risks or blockers
8. Recommended sales angle
9. Questions the sales rep should ask next
10. Confidence and missing information

Keep it practical for a salesperson preparing for a call.
"""
    },

    "pain_point_finder": {
        "workflow_name": "Customer Pain Point Finder",
        "button_label": "Find customer pain points",
        "description": "Finds pains, bottlenecks, complaints, needs, and business problems.",
        "best_for": "Discovery calls, consultative selling, and qualification.",
        "prompt": """
You are a consultative B2B sales strategist.

Analyze the knowledge base and identify CUSTOMER PAIN POINTS.

Use only retrieved context where possible.
If the documents do not provide enough evidence, say so.

Structure the answer as:

1. Explicit pain points mentioned
2. Implied pain points
3. Operational bottlenecks
4. Financial or commercial impact
5. Technical or process friction
6. Urgency signals
7. Buying triggers
8. How our solution may connect to the pain
9. Discovery questions to validate the pain
10. What evidence is missing

Do not overhype. Be realistic.
"""
    },

    "objection_handling": {
        "workflow_name": "Objection Handling",
        "button_label": "Prepare objection handling",
        "description": "Generates likely objections and suggested responses.",
        "best_for": "Negotiation, pricing concerns, security concerns, and competitor pushback.",
        "prompt": """
You are a senior sales coach.

Prepare an OBJECTION HANDLING brief for the sales team.

Use retrieved context from the knowledge base.
Where evidence is unavailable, mark it as unknown.

Structure the answer as:

1. Likely objections
2. Why the customer may raise each objection
3. Suggested response
4. Proof points from available documents
5. Questions to ask before responding
6. Risky claims to avoid
7. Follow-up material to send
8. Suggested tone for the salesperson
9. Best next step
10. Missing information

Make the responses natural and business-friendly.
"""
    },

    "proposal_draft": {
        "workflow_name": "Proposal Draft",
        "button_label": "Draft proposal section",
        "description": "Creates a proposal draft using available sales and product knowledge.",
        "best_for": "Proposal writing, solution summaries, and commercial documents.",
        "prompt": """
You are a B2B proposal writer.

Draft a PROPOSAL SECTION based on the retrieved knowledge base context.

Use only available information. Do not invent guarantees, prices, timelines, or legal claims.

Structure the answer as:

1. Executive summary
2. Customer situation
3. Proposed solution
4. Key capabilities
5. Expected business value
6. Implementation considerations
7. Assumptions
8. Risks and dependencies
9. Suggested next step
10. Missing details needed before final proposal

Write in a professional sales proposal style.
"""
    },

    "follow_up_email": {
        "workflow_name": "Follow Up Email",
        "button_label": "Draft follow-up email",
        "description": "Drafts a practical sales follow-up email from context.",
        "best_for": "After discovery calls, demos, proposal reviews, or stakeholder meetings.",
        "prompt": """
You are a B2B account executive.

Draft a FOLLOW-UP EMAIL based on the retrieved knowledge and provided sales context.

Do not invent meeting details.
If something is unclear, keep it generic or mark it as a placeholder.

Structure the answer as:

Subject:
Email body:

The email should:
- Be concise
- Mention the customer context
- Refer to the likely pain or need
- Suggest a clear next step
- Avoid pushy language
- Avoid exaggerated AI or software claims

Also include:
1. Why this email works
2. Optional shorter version
3. Missing information that would improve the email
"""
    },

    "competitor_comparison": {
        "workflow_name": "Competitor Comparison",
        "button_label": "Compare against competitors",
        "description": "Summarizes competitive positioning based on uploaded materials.",
        "best_for": "Competitive deals, vendor comparisons, and positioning discussions.",
        "prompt": """
You are a competitive intelligence analyst for a B2B sales team.

Create a COMPETITOR COMPARISON brief.

Use only retrieved context.
If competitors are not mentioned in the documents, say that clearly and provide a general comparison framework without inventing competitor facts.

Structure the answer as:

1. Competitors or alternatives mentioned
2. Customer comparison criteria
3. Our likely strengths
4. Our likely weaknesses
5. Competitor strengths
6. Competitor weaknesses
7. Differentiation points supported by documents
8. Claims the salesperson should avoid
9. Questions to ask the customer
10. Suggested positioning summary

Be careful, evidence-based, and useful for a sales call.
"""
    },

    "renewal_risk_review": {
        "workflow_name": "Renewal Risk Review",
        "button_label": "Review renewal risk",
        "description": "Identifies renewal risks, churn signals, and retention actions.",
        "best_for": "Customer success, account management, renewals, and QBRs.",
        "prompt": """
You are a customer success and renewal risk analyst.

Create a RENEWAL RISK REVIEW based on the retrieved knowledge.

Use available context such as complaints, support issues, delays, usage concerns, pricing concerns, contract notes, or relationship signals.

Structure the answer as:

1. Renewal risk summary
2. Positive retention signals
3. Negative churn signals
4. Open issues
5. Stakeholder concerns
6. Commercial risks
7. Product or service risks
8. Recommended retention actions
9. Suggested executive talking points
10. Missing information

Do not exaggerate risk. Be practical.
"""
    },

    "upsell_opportunity_finder": {
        "workflow_name": "Upsell Opportunity Finder",
        "button_label": "Find upsell opportunities",
        "description": "Finds possible expansion, cross-sell, or upsell opportunities.",
        "best_for": "Account expansion, customer success, and strategic account planning.",
        "prompt": """
You are a strategic account growth analyst.

Identify UPSELL OR CROSS-SELL OPPORTUNITIES from the retrieved knowledge base.

Use evidence from documents where available.
If evidence is weak, clearly label the opportunity as speculative.

Structure the answer as:

1. Current known customer need
2. Possible upsell or expansion opportunity
3. Evidence from documents
4. Business reason this may matter
5. Suggested product or service angle
6. Stakeholders to involve
7. Timing signals
8. Risks or reasons not to pitch yet
9. Discovery questions
10. Recommended next action

Keep it realistic and non-pushy.
"""
    },

    "meeting_preparation": {
        "workflow_name": "Meeting Preparation",
        "button_label": "Prepare for meeting",
        "description": "Creates a structured sales meeting preparation brief.",
        "best_for": "Before customer calls, demos, discovery, QBRs, or negotiation meetings.",
        "prompt": """
You are a sales meeting preparation assistant.

Create a MEETING PREPARATION BRIEF using the retrieved knowledge base context.

Structure the answer as:

1. Meeting objective
2. Account context
3. Known customer needs
4. Likely stakeholder priorities
5. Suggested agenda
6. Key talking points
7. Questions to ask
8. Possible objections
9. Documents or proof points to reference
10. Recommended next step after meeting

If the meeting objective is unclear, infer the most likely objective from the provided context and state your assumption.
"""
    },

    "crm_note_generator": {
        "workflow_name": "CRM Note Generator",
        "button_label": "Generate CRM note",
        "description": "Creates structured CRM notes from messy sales context.",
        "best_for": "After calls, demos, account reviews, and customer emails.",
        "prompt": """
You are a CRM hygiene assistant for a B2B sales team.

Generate a STRUCTURED CRM NOTE from the retrieved knowledge and provided sales context.

Do not invent details.
If something is missing, write "Not provided."

Structure the CRM note as:

1. Account
2. Contact
3. Date or timing context
4. Conversation summary
5. Customer pain points
6. Products or services discussed
7. Objections or concerns
8. Buying signals
9. Next steps
10. Follow-up owner
11. Suggested CRM tags
12. Missing fields

Make it clean enough to paste into HubSpot, Salesforce, Pipedrive, or Airtable.
"""
    },
}


SUGGESTED_NEXT_ACTIONS: Dict[str, List[str]] = {
    "account_briefing": [
        "Open the account in CRM",
        "Check if stakeholder information is missing",
        "Prepare three discovery questions",
        "Attach relevant case study or product document",
    ],
    "pain_point_finder": [
        "Validate the top pain point with the customer",
        "Map each pain point to a business impact",
        "Prepare proof points",
        "Create discovery questions",
    ],
    "objection_handling": [
        "Prepare evidence for the top objection",
        "Avoid unsupported claims",
        "Ask the customer what success criteria matter most",
        "Send a relevant proof document after the call",
    ],
    "proposal_draft": [
        "Review assumptions",
        "Add pricing and timeline manually",
        "Send draft to internal reviewer",
        "Check legal and compliance language",
    ],
    "follow_up_email": [
        "Personalize the first line",
        "Add a concrete meeting date or next step",
        "Attach relevant document",
        "Log the email in CRM",
    ],
    "competitor_comparison": [
        "Validate competitor names with the customer",
        "Prepare differentiation proof points",
        "Avoid attacking competitors",
        "Ask what comparison criteria matter most",
    ],
    "renewal_risk_review": [
        "Review open support issues",
        "Schedule stakeholder check-in",
        "Prepare retention plan",
        "Escalate high-risk accounts internally",
    ],
    "upsell_opportunity_finder": [
        "Validate whether the customer has the need",
        "Check current contract scope",
        "Prepare a soft expansion question",
        "Avoid pitching before confirming pain",
    ],
    "meeting_preparation": [
        "Confirm meeting objective",
        "Prepare agenda",
        "Assign note taker",
        "Define desired next step",
    ],
    "crm_note_generator": [
        "Paste note into CRM",
        "Add missing fields",
        "Assign follow-up owner",
        "Create next task",
    ],
}


# ---------------------------------------------------------
# Index Helpers
# ---------------------------------------------------------

def get_or_create_index() -> VectorStoreIndex:
    global _index

    if _index is not None:
        return _index

    if os.path.exists(STORAGE_DIR) and os.listdir(STORAGE_DIR):
        try:
            storage_context = StorageContext.from_defaults(persist_dir=STORAGE_DIR)
            _index = load_index_from_storage(storage_context)
            return _index
        except Exception:
            pass

    if os.path.exists(UPLOAD_DIR) and os.listdir(UPLOAD_DIR):
        documents = SimpleDirectoryReader(UPLOAD_DIR).load_data()
        _index = VectorStoreIndex.from_documents(documents)
        _index.storage_context.persist(persist_dir=STORAGE_DIR)
    else:
        _index = VectorStoreIndex.from_documents([])

    return _index


def reset_index_from_upload_dir() -> VectorStoreIndex:
    global _index

    if not os.path.exists(UPLOAD_DIR) or not os.listdir(UPLOAD_DIR):
        _index = VectorStoreIndex.from_documents([])
        return _index

    documents = SimpleDirectoryReader(UPLOAD_DIR).load_data()

    if not documents:
        _index = VectorStoreIndex.from_documents([])
        return _index

    _index = VectorStoreIndex.from_documents(documents)
    _index.storage_context.persist(persist_dir=STORAGE_DIR)
    return _index


def extract_sources(response_obj: Any, max_sources: int = 5) -> List[Dict[str, Any]]:
    sources = []

    source_nodes = getattr(response_obj, "source_nodes", []) or []

    for node_with_score in source_nodes[:max_sources]:
        node = getattr(node_with_score, "node", None)
        score = getattr(node_with_score, "score", None)

        if node is None:
            continue

        metadata = getattr(node, "metadata", {}) or {}
        text = getattr(node, "text", "") or ""

        source_item = {
            "score": score,
            "file_name": metadata.get("file_name") or metadata.get("filename") or metadata.get("source") or "Unknown source",
            "page_label": metadata.get("page_label") or metadata.get("page_number") or metadata.get("page") or None,
            "text_preview": text[:500],
            "metadata": metadata,
        }
        sources.append(source_item)

    return sources


def build_sales_context(payload: WorkflowRunRequest) -> str:
    return f"""
User provided sales context:

Account name: {payload.account_name or "Not provided"}
Contact name: {payload.contact_name or "Not provided"}
Product or service: {payload.product_or_service or "Not provided"}
Deal stage: {payload.deal_stage or "Not provided"}
Sales context: {payload.sales_context or "Not provided"}
User question or extra instruction: {payload.user_question or "Not provided"}
"""


def run_rag_prompt(prompt: str, similarity_top_k: int = 8) -> Any:
    index = get_or_create_index()

    query_engine = index.as_query_engine(
        similarity_top_k=similarity_top_k,
        response_mode="compact",
    )

    return query_engine.query(prompt)


# ---------------------------------------------------------
# Startup
# ---------------------------------------------------------

@app.on_event("startup")
async def startup_event():
    get_or_create_index()


# ---------------------------------------------------------
# Health and Workflow Discovery
# ---------------------------------------------------------

@app.get("/")
async def root():
    return {
        "message": "Sales Knowledge Engine API is running.",
        "available_workflows": len(SALES_WORKFLOWS),
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "upload_dir": UPLOAD_DIR,
        "storage_dir": STORAGE_DIR,
        "openai_model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        "embedding_model": os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"),
    }


@app.get("/workflows", response_model=List[WorkflowInfo])
async def list_workflows():
    return [
        WorkflowInfo(
            workflow_id=workflow_id,
            workflow_name=config["workflow_name"],
            description=config["description"],
            button_label=config["button_label"],
            best_for=config["best_for"],
        )
        for workflow_id, config in SALES_WORKFLOWS.items()
    ]


@app.get("/workflows/{workflow_id}", response_model=WorkflowInfo)
async def get_workflow(workflow_id: str):
    if workflow_id not in SALES_WORKFLOWS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow '{workflow_id}' not found.",
        )

    config = SALES_WORKFLOWS[workflow_id]

    return WorkflowInfo(
        workflow_id=workflow_id,
        workflow_name=config["workflow_name"],
        description=config["description"],
        button_label=config["button_label"],
        best_for=config["best_for"],
    )


# ---------------------------------------------------------
# Upload and Indexing
# ---------------------------------------------------------

@app.post("/upload-pdf", status_code=status.HTTP_201_CREATED, response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    global _index

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported.",
        )

    safe_filename = file.filename.replace("/", "_").replace("\\", "_")
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        reader = SimpleDirectoryReader(input_files=[file_path])
        new_documents = reader.load_data()

        if not new_documents:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded PDF contains no parsable text.",
            )

        index = get_or_create_index()

        for doc in new_documents:
            index.insert(doc)

        index.storage_context.persist(persist_dir=STORAGE_DIR)
        _index = index

        return UploadResponse(
            info=f"File '{safe_filename}' successfully uploaded and indexed.",
            pages_indexed=len(new_documents),
        )

    except HTTPException:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise

    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing the PDF: {str(e)}",
        )


@app.post("/upload-multiple-pdfs", status_code=status.HTTP_201_CREATED)
async def upload_multiple_pdfs(files: List[UploadFile] = File(...)):
    global _index

    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files uploaded.",
        )

    saved_files = []
    total_pages = 0

    try:
        for file in files:
            if not file.filename.lower().endswith(".pdf"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Only PDF files are supported. Invalid file: {file.filename}",
                )

            safe_filename = file.filename.replace("/", "_").replace("\\", "_")
            file_path = os.path.join(UPLOAD_DIR, safe_filename)

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            saved_files.append(file_path)

        reader = SimpleDirectoryReader(input_files=saved_files)
        documents = reader.load_data()

        if not documents:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded PDFs contain no parsable text.",
            )

        index = get_or_create_index()

        for doc in documents:
            index.insert(doc)

        index.storage_context.persist(persist_dir=STORAGE_DIR)
        _index = index
        total_pages = len(documents)

        return {
            "info": f"{len(saved_files)} files uploaded and indexed.",
            "files": [os.path.basename(path) for path in saved_files],
            "pages_indexed": total_pages,
        }

    except HTTPException:
        for path in saved_files:
            if os.path.exists(path):
                os.remove(path)
        raise

    except Exception as e:
        for path in saved_files:
            if os.path.exists(path):
                os.remove(path)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing PDFs: {str(e)}",
        )


@app.post("/rebuild-index")
async def rebuild_index():
    try:
        index = reset_index_from_upload_dir()
        return {
            "info": "Index rebuilt from uploaded files.",
            "storage_dir": STORAGE_DIR,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not rebuild index: {str(e)}",
        )


@app.delete("/reset")
async def reset_everything():
    global _index

    try:
        _index = None

        if os.path.exists(UPLOAD_DIR):
            shutil.rmtree(UPLOAD_DIR)

        if os.path.exists(STORAGE_DIR):
            shutil.rmtree(STORAGE_DIR)

        os.makedirs(UPLOAD_DIR, exist_ok=True)

        _index = VectorStoreIndex.from_documents([])

        return {
            "info": "Uploaded files, storage, and in-memory index have been reset."
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not reset system: {str(e)}",
        )


@app.get("/documents")
async def list_uploaded_documents():
    if not os.path.exists(UPLOAD_DIR):
        return {"documents": []}

    documents = [
        file_name
        for file_name in os.listdir(UPLOAD_DIR)
        if file_name.lower().endswith(".pdf")
    ]

    return {
        "count": len(documents),
        "documents": documents,
    }


# ---------------------------------------------------------
# Generic Chat Endpoint
# ---------------------------------------------------------

@app.post("/chat", response_model=ChatResponse)
async def chat_with_sales_docs(payload: ChatRequest):
    try:
        prompt = f"""
You are a sales knowledge assistant.

Answer the user's question using the uploaded sales knowledge base.

Rules:
- Use retrieved context where possible.
- If the answer is not found, say "I could not find this in the uploaded documents."
- Be concise.
- Mention useful source context if available.
- Do not invent customer facts, pricing, legal terms, or guarantees.

User question:
{payload.message}
"""

        response_obj = run_rag_prompt(prompt, similarity_top_k=8)

        return ChatResponse(
            response=str(response_obj),
            sources=extract_sources(response_obj),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat query: {str(e)}",
        )


# ---------------------------------------------------------
# Workflow Runner
# ---------------------------------------------------------

@app.post("/workflows/{workflow_id}/run", response_model=WorkflowRunResponse)
async def run_sales_workflow(workflow_id: str, payload: WorkflowRunRequest):
    if workflow_id not in SALES_WORKFLOWS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow '{workflow_id}' not found.",
        )

    workflow = SALES_WORKFLOWS[workflow_id]
    user_context = build_sales_context(payload)

    final_prompt = f"""
{workflow["prompt"]}

{user_context}

Important response rules:
- Use uploaded knowledge base context when available.
- Do not hallucinate customer-specific facts.
- If information is missing, explicitly say what is missing.
- Make the output useful enough for a real sales team member to copy, edit, or use in a workflow.
- Keep the structure clean with headings and bullet points.
"""

    try:
        response_obj = run_rag_prompt(final_prompt, similarity_top_k=10)

        return WorkflowRunResponse(
            workflow_id=workflow_id,
            workflow_name=workflow["workflow_name"],
            output=str(response_obj),
            suggested_next_actions=SUGGESTED_NEXT_ACTIONS.get(workflow_id, []),
            sources=extract_sources(response_obj),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error running workflow '{workflow_id}': {str(e)}",
        )


# ---------------------------------------------------------
# Convenience Endpoints for Frontend Buttons
# These make frontend integration easier.
# Each endpoint maps to one workflow.
# ---------------------------------------------------------

@app.post("/sales/account-briefing", response_model=WorkflowRunResponse)
async def account_briefing(payload: WorkflowRunRequest):
    return await run_sales_workflow("account_briefing", payload)


@app.post("/sales/pain-point-finder", response_model=WorkflowRunResponse)
async def pain_point_finder(payload: WorkflowRunRequest):
    return await run_sales_workflow("pain_point_finder", payload)


@app.post("/sales/objection-handling", response_model=WorkflowRunResponse)
async def objection_handling(payload: WorkflowRunRequest):
    return await run_sales_workflow("objection_handling", payload)


@app.post("/sales/proposal-draft", response_model=WorkflowRunResponse)
async def proposal_draft(payload: WorkflowRunRequest):
    return await run_sales_workflow("proposal_draft", payload)


@app.post("/sales/follow-up-email", response_model=WorkflowRunResponse)
async def follow_up_email(payload: WorkflowRunRequest):
    return await run_sales_workflow("follow_up_email", payload)


@app.post("/sales/competitor-comparison", response_model=WorkflowRunResponse)
async def competitor_comparison(payload: WorkflowRunRequest):
    return await run_sales_workflow("competitor_comparison", payload)


@app.post("/sales/renewal-risk-review", response_model=WorkflowRunResponse)
async def renewal_risk_review(payload: WorkflowRunRequest):
    return await run_sales_workflow("renewal_risk_review", payload)


@app.post("/sales/upsell-opportunity-finder", response_model=WorkflowRunResponse)
async def upsell_opportunity_finder(payload: WorkflowRunRequest):
    return await run_sales_workflow("upsell_opportunity_finder", payload)


@app.post("/sales/meeting-preparation", response_model=WorkflowRunResponse)
async def meeting_preparation(payload: WorkflowRunRequest):
    return await run_sales_workflow("meeting_preparation", payload)


@app.post("/sales/crm-note-generator", response_model=WorkflowRunResponse)
async def crm_note_generator(payload: WorkflowRunRequest):
    return await run_sales_workflow("crm_note_generator", payload)


# ---------------------------------------------------------
# Demo Payload Generator
# Useful for frontend screenshots.
# ---------------------------------------------------------

@app.get("/demo/sample-payload")
async def get_sample_payload():
    return {
        "account_name": "Mittelstand Manufacturing GmbH",
        "contact_name": "Head of Sales Operations",
        "product_or_service": "Sales knowledge engine and workflow assistant",
        "deal_stage": "Discovery",
        "sales_context": (
            "The sales team spends too much time searching old proposals, "
            "case studies, pricing notes, product documents, customer emails, "
            "and CRM notes before calls. Management wants AI, but the team does "
            "not want a blank chatbot."
        ),
        "user_question": "Prepare this for a realistic B2B sales workflow demo.",
    }


@app.get("/demo/frontend-buttons")
async def get_frontend_button_config():
    return {
        "title": "Sales Knowledge Engine",
        "subtitle": "10 workflow buttons for sales teams. No blank chatbot required.",
        "buttons": [
            {
                "label": config["button_label"],
                "workflow_id": workflow_id,
                "endpoint": f"/sales/{workflow_id.replace('_', '-')}",
                "description": config["description"],
            }
            for workflow_id, config in SALES_WORKFLOWS.items()
        ],
    }


# ---------------------------------------------------------
# Local Runner
# ---------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )