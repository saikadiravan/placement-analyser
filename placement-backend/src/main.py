from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import json
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parent))

from src.utils.db import fetch_schedule, fetch_insights, get_all_scheduled_companies
from integration.build_schedule import run_pipeline
from coversational.conversation_agent import chat_with_insights
from recommendation.agents.gemini_agent import generate_study_plan
from recommendation.core.rescheduler import reschedule_by_completed_days


app = FastAPI(
    title="Placement Navigator API",
    description="FastAPI backend for multi-agent ETL and Recommendation Engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# PYDANTIC MODELS
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
    print(f"Starting extraction for {request.company} - {request.role}...")
    try:
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
    try:
        plan = generate_study_plan(
            company=request.company,
            role=request.role,
            duration_days=request.duration_days
        )
        if "error" in plan:
            raise HTTPException(status_code=400, detail=plan)
        return {"status": "success", "data": plan}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plan generation failed: {str(e)}")

@app.post("/reschedule")
async def reschedule(request: RescheduleRequest):
    """
    Free route — no API calls, pure SQLite read/mutate/write.
    Returns the rescheduler result directly (no "data" wrapper)
    so the frontend can access res.updated_plan, res.completion_rate etc. directly.
    """
    try:
        result = reschedule_by_completed_days(
            company=request.company,
            completed_task_ids=request.completed_task_ids
        )
        # ✅ No "data" wrapper — api.ts accesses fields directly (res.updated_plan)
        return result
    except HTTPException:
        raise  # Let FastAPI handle 404s from rescheduler as-is
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rescheduling failed: {str(e)}")

# ─────────────────────────────────────────────
# CONVERSATIONAL AI ROUTE
# ─────────────────────────────────────────────
@app.post("/chat")
async def chat_with_ai(request: ChatRequest):
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
    plan = fetch_schedule(_company_slug(company))
    if not plan:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return plan

@app.get("/schedule")
async def list_schedules():
    companies = get_all_scheduled_companies()
    return {
        "schedules": [
            {"company": c, "file": f"{c}_schedule (DB)"}
            for c in companies
        ]
    }

@app.get("/insights/{company}")
async def get_insights(company: str):
    # ✅ Removed dead code block that appeared after the return and would
    #    have caused a NameError (verified_path, raw_path were never defined)
    insights_data = fetch_insights(_company_slug(company))
    if not insights_data:
        raise HTTPException(status_code=404, detail="Insights not found. Run ETL first.")
    return insights_data