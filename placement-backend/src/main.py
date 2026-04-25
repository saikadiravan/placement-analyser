from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import json
from pathlib import Path
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent))

# --- Core Business Logic Imports ---
from integration.build_schedule import run_pipeline
from coversational.conversation_agent import chat_with_insights
from recommendation.agents.gemini_agent import generate_study_plan
from recommendation.core.rescheduler import reschedule_by_completed_days
from utils.paths import OUTPUTS_DIR

app = FastAPI(
    title="Placement Navigator API",
    description="FastAPI backend for multi-agent ETL and Recommendation Engine",
    version="1.0.0"
)

# Enable CORS (Replaces Flask-CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# PYDANTIC MODELS (Strict Data Validation)
# ─────────────────────────────────────────────
class ExtractRequest(BaseModel):
    company: str
    role: str = "SDE"

class GeneratePlanRequest(BaseModel):
    company: str
    role: str = "SDE"
    duration_days: int = 30

class RescheduleRequest(BaseModel):
    company: str
    completed_task_ids: List[str]
    
class ChatRequest(BaseModel):
    company: str
    user_query: str

# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────
def _company_slug(company: str) -> str:
    return company.lower().replace(" ", "_").replace(".", "")

# ─────────────────────────────────────────────
# ETL PIPELINE ROUTES
# ─────────────────────────────────────────────
@app.post("/extract")
async def extract_company_data(request: ExtractRequest):
    """
    Online Mode route — Triggers the multi-agent ETL pipeline to scrape, 
    filter, and cache real company insights.
    """
    print(f"Starting extraction for {request.company} - {request.role}...")
    try:
        # run_pipeline handles both extraction and the Great Filter
        result = run_pipeline(company=request.company, role=request.role)
        return {
            "status": "success", 
            "message": f"Extraction and filtering complete for {request.company}",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ETL Pipeline failed: {str(e)}")

# ─────────────────────────────────────────────
# RECOMMENDATION ROUTES
# ─────────────────────────────────────────────
@app.post("/generate-plan")
async def generate_plan(request: GeneratePlanRequest):
    """
    Expensive route — calls Gemini to generate a personalized study schedule.
    """
    try:
        plan = generate_study_plan(
            company=request.company, 
            role=request.role, 
            duration_days=request.duration_days
        )
        
        # Check if the Recommendation agent threw an insights_not_found error
        if "error" in plan:
            raise HTTPException(status_code=400, detail=plan)
            
        return {"status": "success", "data": plan}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plan generation failed: {str(e)}")

@app.post("/reschedule")
async def reschedule(request: RescheduleRequest):
    """
    Free route — no API calls, modifies local JSON only. 
    Safe to call on every frontend sync.
    """
    try:
        result = reschedule_by_completed_days(
            company=request.company, 
            completed_task_ids=request.completed_task_ids
        )
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rescheduling failed: {str(e)}")
    
# ─────────────────────────────────────────────
# CONVERSATIONAL AI ROUTE
# ─────────────────────────────────────────────
@app.post("/chat")
async def chat_with_ai(request: ChatRequest):
    """
    RAG-based route — Uses local Ollama to answer specific user queries 
    based on the extracted company insights.
    """
    try:
        response = chat_with_insights(
            company=request.company, 
            user_query=request.user_query
        )
        return {"status": "success", "data": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot failed: {str(e)}")

# ─────────────────────────────────────────────
# DATA FETCHING ROUTES
# ─────────────────────────────────────────────
@app.get("/schedule/{company}")
async def get_schedule(company: str):
    """Free route — reads current schedule from disk for the given company."""
    safe_company = _company_slug(company)
    file_path = OUTPUTS_DIR / f"{safe_company}_schedule.json"
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"No schedule found for {company}")
        
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

@app.get("/schedule")
async def list_schedules():
    """Free route — lists all companies that have a generated schedule."""
    schedules = []
    for file in OUTPUTS_DIR.glob("*_schedule.json"):
        company_slug = file.stem.replace("_schedule", "")
        schedules.append({
            "company": company_slug,
            "file": file.name,
        })
    return {"schedules": schedules}

@app.get("/insights/{company}")
async def get_insights(company: str):
    """Online Mode route — Fetches the extracted JSON insights from disk."""
    safe_company = _company_slug(company)
    verified_path = OUTPUTS_DIR / f"{safe_company}_verified_insights.json"
    raw_path = OUTPUTS_DIR / f"{safe_company}_insights.json"
    
    # Prefer verified insights if they exist, otherwise fall back to raw ETL output
    target_path = verified_path if verified_path.exists() else raw_path
    
    if not target_path.exists():
        raise HTTPException(status_code=404, detail=f"No insights found for {company}. Run ETL first.")
        
    with open(target_path, "r", encoding="utf-8") as f:
        return json.load(f)