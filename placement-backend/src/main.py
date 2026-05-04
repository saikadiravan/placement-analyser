import os
import sys
import requests
import traceback
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any

# ─────────────────────────────────────────────
# DEBUG & INITIALIZATION
# ─────────────────────────────────────────────
# Explicitly force load the .env file and print its status
env_path = os.path.join(os.getcwd(), '.env')
print(f"[DEBUG] Attempting to load .env from: {env_path}")
print(f"[DEBUG] Does .env file exist? {os.path.exists(env_path)}")
load_dotenv(dotenv_path=env_path)

sys.path.append(str(Path(__file__).resolve().parent))

from src.utils.db import fetch_schedule, fetch_insights, get_all_scheduled_companies
from integration.build_schedule import run_pipeline
from coversational.conversation_agent import chat_with_insights
from recommendation.agents.gemini_agent import generate_study_plan
from recommendation.core.rescheduler import reschedule_by_completed_days
from analytics.analytics_agent import generate_analytics


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

class SmartPrioritizeRequest(BaseModel):
    company: str
    gaps: List[Dict[str, Any]]

class PrioritizeRequest(BaseModel):
    company: str
    insights: dict = {}
    gaps: dict = {}


# ─────────────────────────────────────────────
# APP CONFIGURATION
# ─────────────────────────────────────────────
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
# HELPERS
# ─────────────────────────────────────────────
def _company_slug(company: str) -> str:
    return company.lower().replace(" ", "_").replace(".", "_")


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
        if isinstance(plan, dict) and "error" in plan:
            raise HTTPException(status_code=400, detail=plan)
        return {"status": "success", "data": plan}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plan generation failed: {str(e)}")


@app.post("/reschedule")
async def reschedule(request: RescheduleRequest):
    try:
        result = reschedule_by_completed_days(
            company=request.company,
            completed_task_ids=request.completed_task_ids
        )
        return result
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
# GROQ POWERED SMART PRIORITIZATION
# ─────────────────────────────────────────────
@app.post("/prioritize")
async def prioritize_gaps(request: PrioritizeRequest):
    print(f"\n[DEBUG] --- STARTING /prioritize REQUEST ---")
    print(f"[DEBUG] Incoming Company: {request.company}")
    print(f"[DEBUG] Incoming Insights: {request.insights}")
    print(f"[DEBUG] Incoming Gaps: {request.gaps}")

    try:
        # Check if the API key is actually loading
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            print("[DEBUG] ERROR: GROQ_API_KEY is None! The .env file was not loaded or the key is missing.")
            raise HTTPException(status_code=500, detail="GROQ_API_KEY not found in backend .env")
        
        print(f"[DEBUG] API Key successfully loaded (starts with): {api_key[:4]}...")

        # Parse payload data safely
        print("[DEBUG] Parsing payload data...")
        dsa_gaps = ", ".join(request.gaps.get('dsa', [])) if request.gaps.get('dsa') else "None"
        sd_gaps = ", ".join(request.gaps.get('systemDesign', [])) if request.gaps.get('systemDesign') else "None"
        beh_gaps = ", ".join(request.gaps.get('behavioral', [])) if request.gaps.get('behavioral') else "None"
        
        interview_process = " | ".join(request.insights.get('interviewProcess', [])) if request.insights.get('interviewProcess') else "Standard"

        system_prompt = f"""You are an expert technical recruiter at {request.company}.
        The candidate has the following topics left to study:
        - DSA Gaps: {dsa_gaps}
        - System Design Gaps: {sd_gaps}
        - Behavioral Gaps: {beh_gaps}

        Live interview data for {request.company}:
        - Difficulty: {request.insights.get('difficulty', 'Unknown')}
        - Average Rounds: {request.insights.get('avgRounds', 'Unknown')}
        - Interview Process: {interview_process}

        Task:
        Based ONLY on the candidate's gaps and the live company data provided, group the missing topics into "High Priority", "Medium Priority", and "Low Priority". 
        Provide a brief 1-2 sentence explanation for the High Priority items based on the company's interview process. Format the response clearly using markdown."""

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [{"role": "user", "content": system_prompt}],
            "temperature": 0.4,
            "max_tokens": 1024
        }

        # Send request to Groq API
        print("[DEBUG] Sending request to Groq API...")
        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions", 
            headers=headers, 
            json=payload,
            timeout=30
        )
        print(f"[DEBUG] Groq API Response Status: {resp.status_code}")
        
        if not resp.ok:
            print(f"[DEBUG] Groq API Error Text: {resp.text}")
            raise HTTPException(status_code=resp.status_code, detail=f"Groq API failed: {resp.text}")
            
        data = resp.json()
        print("[DEBUG] Successfully received response from Groq!")
        content = data["choices"][0]["message"]["content"]

        return {
            "status": "success", 
            "company": request.company,
            "data": content
        }

    except requests.exceptions.RequestException as e:
        print(f"\n[DEBUG] Network Error connecting to Groq:")
        traceback.print_exc()
        raise HTTPException(status_code=502, detail=f"Failed to reach Groq API: {str(e)}")
    except Exception as e:
        # Catch any unhandled Python crashes and print the exact line number
        print(f"\n[DEBUG] FATAL ERROR inside /prioritize route:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


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
    return {"schedules": [{"company": c, "file": f"{c}_schedule (DB)"} for c in companies]}


@app.get("/insights/{company}")
async def get_insights(company: str):
    insights_data = fetch_insights(_company_slug(company))
    if not insights_data:
        raise HTTPException(status_code=404, detail="Insights not found. Run ETL first.")
    return insights_data

@app.get("/analytics/{company}")
async def get_analytics(company: str):
    result = generate_analytics(company)
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
        
    return result


# ─────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)