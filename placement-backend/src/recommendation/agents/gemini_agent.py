# import json
# import os
# from datetime import datetime, timedelta
# import google.generativeai as genai
# from dotenv import load_dotenv
# # Import your database helper instead
# # from src.utils.db import fetch_insights, insert_schedule


# load_dotenv()
# genai.configure(api_key=os.getenv("GEMINI_API_KEY"))




# # ─────────────────────────────────────────────
# # HELPERS
# # ─────────────────────────────────────────────

# def _company_slug(company: str) -> str:
#     return company.lower().replace(" ", "_").replace(".", "")


# def _compute_start_date() -> str:
#     """Study plan starts from tomorrow."""
#     return (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")


# def _date_for_day(start_date: str, day_number: int) -> str:
#     """Returns the calendar date for a given 1-indexed day number."""
#     start = datetime.strptime(start_date, "%Y-%m-%d")
#     return (start + timedelta(days=day_number - 1)).strftime("%Y-%m-%d")


# def _inject_ids_and_dates(schedule: list, start_date: str) -> list:
#     """
#     Post-processes Gemini's schedule to inject fields the rescheduler needs:
#       - 'date'      : actual calendar date for the day block
#       - 'id'        : deterministic task ID  e.g. 'd3_t2'
#       - 'completed' : False for all tasks on first generation

#     Doing this in Python (not in the prompt) guarantees correctness.
#     Gemini cannot be trusted to produce 30 unique sequential dates reliably.
#     """
#     for block in schedule:
#         day_num      = block.get("day", 1)
#         block["date"] = _date_for_day(start_date, day_num)

#         for idx, task in enumerate(block.get("tasks", []), start=1):
#             task["id"]        = f"d{day_num}_t{idx}"
#             task["completed"] = False

#     return schedule


# # ─────────────────────────────────────────────
# # RECOMMENDATION AGENT
# # ─────────────────────────────────────────────

# def generate_study_plan(
#     company: str = "Amazon",
#     role: str = "SDE",
#     duration_days: int = 30,
# ) -> dict:
#     """
#     Reads {company}_insights.json from the ETL pipeline output
#     and generates a personalised day-by-day study schedule.

#     Output saved as {company}_schedule.json — one file per company
#     so plans for different companies never overwrite each other.
#     """
#     print(f"\n[RecommendationAgent] Generating {duration_days}-day plan for {company} | {role}...")

#     slug          = _company_slug(company)
#     insights_file = OUTPUTS_DIR / f"{slug}_insights.json"

#     # ── Pre-flight check ──────────────────────────────────────
#     if not insights_file.exists():
#         msg = f"No ETL insights found for '{company}'. Run the pipeline first."
#         print(f"[RecommendationAgent] ❌ {msg}")
#         return {
#             "error":    "insights_not_found",
#             "message":  msg,
#             "expected": str(insights_file),
#         }

#     with open(insights_file, "r", encoding="utf-8") as f:
#         insights = json.load(f)

#     # ── Pull fields from insights ─────────────────────────────
#     dsa_topics    = insights.get("dsaTopics",           [])
#     system_topics = insights.get("systemDesignTopics",  [])
#     behavioral_qs = insights.get("behavioralQuestions", [])
#     process_steps = insights.get("interviewProcess",    [])
#     difficulty    = insights.get("difficulty",          "Medium")
#     avg_rounds    = insights.get("avgRounds",           4)
#     enriched      = insights.get("enrichedInsights",    "")

#     # ── Build prompt ──────────────────────────────────────────
#     phase1_end = duration_days // 3
#     phase2_end = (2 * duration_days) // 3

#     prompt = f"""
# You are an elite Technical Career Coach building a personalised {duration_days}-day
# interview preparation schedule for a candidate targeting {company} {role}.

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# VERIFIED INTERVIEW DATA FOR {company.upper()} {role.upper()}
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Interview Process:
# {json.dumps(process_steps, indent=2)}

# DSA Problems to cover — {len(dsa_topics)} total (use ALL of them, distribute across days):
# {json.dumps(dsa_topics, indent=2)}

# System Design Topics:
# {json.dumps(system_topics, indent=2) if system_topics else "None"}

# Behavioral Questions:
# {json.dumps(behavioral_qs, indent=2)}

# Difficulty : {difficulty}
# Avg Rounds : {avg_rounds}

# Company Insight (READ THIS — every day's tip must reference something specific from here):
# \"\"\"{enriched}\"\"\"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RULES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 1. Use ONLY the topics listed above. Do not invent problems or questions.

# 2. Distribute ALL {len(dsa_topics)} DSA problems across the {duration_days} days.
#    Aim for 3–5 tasks per day. Never more than 6.

# 3. Group problems that share a pattern on the same day:
#    - Sliding window problems together
#    - Graph problems together (BFS/DFS/Union-Find)
#    - Tree problems together
#    - DP problems together
#    - etc.

# 4. Three-phase pacing:
#    - Phase 1 (days 1–{phase1_end})    : Foundation — easier/medium problems first
#    - Phase 2 (days {phase1_end+1}–{phase2_end}) : Depth — harder problems + system design
#    - Phase 3 (days {phase2_end+1}–{duration_days}) : Polish — mocks, behavioral, revision

# 5. Mandatory days (add these in Phase 3):
#    - At least 2 mock interview days        (category: "mock")
#    - 1 behavioral day covering all behavioral questions (category: "behavioral")
#    - 1 final revision day                  (category: "revision")
#    - 1 day per system design topic if any exist (category: "system-design")

# 6. Tips: every single tip must reference something SPECIFIC from the company insight above.
#    For example: reference {company}'s interview style, what interviewers look for,
#    specific red flags mentioned, the round structure, culture signals, etc.
#    Generic tips like "practice makes perfect" are NOT acceptable.

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# OUTPUT — RAW JSON ONLY. NO MARKDOWN. NO EXPLANATION.
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# {{
#     "company": "{company}",
#     "role": "{role}",
#     "total_days": {duration_days},
#     "difficulty": "{difficulty}",
#     "schedule": [
#         {{
#             "day": 1,
#             "focus": "Short theme e.g. 'DSA: Sliding Window'",
#             "tasks": [
#                 {{
#                     "title": "Exact problem or question title from the lists above",
#                     "category": "dsa | system-design | behavioral | mock | revision"
#                 }}
#             ],
#             "tip": "One specific sentence referencing {company}'s interview culture or process"
#         }}
#     ]
# }}
# """

#     # ── Call Gemini (full flash — this is the expensive call) ─
#     model = genai.GenerativeModel("gemini-2.5-flash-lite")

#     try:
#         response = model.generate_content(prompt)
#         raw_text = response.text.strip()

#         for fence in ("```json", "```"):
#             if raw_text.startswith(fence):
#                 raw_text = raw_text[len(fence):]
#         if raw_text.endswith("```"):
#             raw_text = raw_text[:-3]
#         raw_text = raw_text.strip()

#         plan = json.loads(raw_text)

#     except json.JSONDecodeError:
#         print("[RecommendationAgent] ❌ Gemini returned invalid JSON")
#         print("Preview:\n", response.text[:400])
#         return {"error": "invalid_json", "preview": response.text[:400]}

#     except Exception as e:
#         print(f"[RecommendationAgent] ❌ {e}")
#         return {"error": str(e)}

#     # ── Post-process: inject dates, ids, completed flags ─────
#     # Done in Python — never trust Gemini to produce 30 sequential dates correctly
#     start_date         = _compute_start_date()
#     plan["start_date"] = start_date
#     plan["schedule"]   = _inject_ids_and_dates(plan.get("schedule", []), start_date)

#     total_tasks = sum(len(d.get("tasks", [])) for d in plan.get("schedule", []))

#     # ── Save — per-company filename ───────────────────────────
#     output_file = OUTPUTS_DIR / f"{slug}_schedule.json"
#     with open(output_file, "w", encoding="utf-8") as f:
#         json.dump(plan, f, indent=4)

#     print(f"[RecommendationAgent] ✅ {total_tasks} tasks across {plan.get('total_days')} days")
#     print(f"[RecommendationAgent] ✅ Saved → {output_file.name}")

#     return plan


# # ─────────────────────────────────────────────
# # ENTRYPOINT
# # ─────────────────────────────────────────────

# if __name__ == "__main__":
#     company  = input("Company (default: Google): ").strip() or "Google"
#     role     = input("Role    (default: SDE):    ").strip() or "SDE"
#     days_str = input("Days    (default: 30):     ").strip() or "30"

#     result = generate_study_plan(company, role, int(days_str))

#     if "error" not in result:
#         total = sum(len(d.get("tasks", [])) for d in result.get("schedule", []))
#         print(f"\n✅ Plan ready: {total} tasks over {result['total_days']} days")
#         print(f"   Start date : {result.get('start_date')}")
#         print(f"   Difficulty : {result.get('difficulty')}")



import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv
# Import your database helper instead
from src.utils.db import fetch_insights, insert_schedule



# ─────────────────────────────────────────────
# INIT
# ─────────────────────────────────────────────
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

router = APIRouter()
model = genai.GenerativeModel("gemini-2.5-flash-lite")

# ─────────────────────────────────────────────
# REQUEST MODEL
# ─────────────────────────────────────────────
class StudyPlanRequest(BaseModel):
    company: str = "Amazon"
    role: str = "SDE"
    duration_days: int = 30


# ─────────────────────────────────────────────
# STATE
# ─────────────────────────────────────────────
class AgentState(dict):
    pass


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────
def _company_slug(company: str) -> str:
    return company.lower().replace(" ", "_").replace(".", "")

def _compute_start_date() -> str:
    return (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")

def _date_for_day(start_date: str, day_number: int) -> str:
    start = datetime.strptime(start_date, "%Y-%m-%d")
    return (start + timedelta(days=day_number - 1)).strftime("%Y-%m-%d")

def _inject_ids_and_dates(schedule: list, start_date: str) -> list:
    for block in schedule:
        day_num = block.get("day", 1)
        block["date"] = _date_for_day(start_date, day_num)
        for idx, task in enumerate(block.get("tasks", []), start=1):
            task["id"] = f"d{day_num}_t{idx}"
            task["completed"] = False
    return schedule


# ─────────────────────────────────────────────
# NODE 1: LOAD INSIGHTS
# ─────────────────────────────────────────────
def load_insights_node(state: AgentState) -> AgentState:
    slug = _company_slug(state["company"])
    
    insights_data = fetch_insights(slug)
    if not insights_data:
        raise HTTPException(status_code=404, detail="Insights not found in database. Run ETL first.")
        
    state["insights"] = insights_data
    return state


# ─────────────────────────────────────────────
# NODE 2: PLANNER
# ─────────────────────────────────────────────
def planner_node(state: AgentState) -> AgentState:
    insights = state["insights"]
    days = state["duration_days"]

    dsa = insights.get("dsaTopics", [])

    chunk_size = max(1, len(dsa) // days)
    chunks = [dsa[i:i + chunk_size] for i in range(0, len(dsa), chunk_size)]

    schedule = []
    for i in range(days):
        tasks = []

        if i < len(chunks):
            for t in chunks[i]:
                tasks.append({"title": t, "category": "dsa"})

        schedule.append({
            "day": i + 1,
            "focus": "DSA Practice",
            "tasks": tasks,
            "tip": ""
        })

    state["draft_schedule"] = schedule
    return state


# ─────────────────────────────────────────────
# SAFE LLM RESPONSE PARSER
# ─────────────────────────────────────────────
def _safe_parse_llm_json(text: str, fallback):
    try:
        return json.loads(text)
    except:
        try:
            start = text.find("{")
            end = text.rfind("}") + 1
            return json.loads(text[start:end])
        except:
            return fallback


# ─────────────────────────────────────────────
# NODE 3: LLM ENHANCER
# ─────────────────────────────────────────────
def llm_enhancer_node(state: AgentState) -> AgentState:
    insights = state["insights"]
    draft = state["draft_schedule"]

    enriched = insights.get("enrichedInsights", "")

    prompt = f"""
Enhance the following study plan:
- Improve 'focus'
- Add meaningful 'tip'

Return ONLY valid JSON.

Draft:
{json.dumps(draft)}
"""

    response = model.generate_content(prompt)

    # safer extraction
    raw_text = getattr(response, "text", "")

    enhanced = _safe_parse_llm_json(raw_text, draft)

    state["final_schedule"] = enhanced
    return state


# ─────────────────────────────────────────────
# NODE 4: VALIDATOR
# ─────────────────────────────────────────────
def validator_node(state: AgentState) -> AgentState:
    schedule = state["final_schedule"]
    days = state["duration_days"]

    if not isinstance(schedule, list) or len(schedule) != days:
        raise HTTPException(status_code=500, detail="Invalid schedule")

    for day in schedule:
        if len(day.get("tasks", [])) > 6:
            raise HTTPException(status_code=500, detail="Too many tasks")

    return state


# ─────────────────────────────────────────────
# NODE 5: SAVE
# ─────────────────────────────────────────────
def save_node(state: AgentState) -> AgentState:
    start_date = _compute_start_date()
    schedule = _inject_ids_and_dates(state["final_schedule"], start_date)

    plan = {
        "company": state["company"],
        "role": state["role"],
        "total_days": state["duration_days"],
        "start_date": start_date,
        "schedule": schedule,
    }

    slug = _company_slug(state["company"])
    
    # Save directly to SQLite
    insert_schedule(slug, plan)

    state["result"] = plan
    return state


# ─────────────────────────────────────────────
# ORCHESTRATOR
# ─────────────────────────────────────────────
def run_agent(state: AgentState) -> Dict[str, Any]:
    state = load_insights_node(state)
    state = planner_node(state)
    state = llm_enhancer_node(state)
    state = validator_node(state)
    state = save_node(state)
    return state["result"]

def generate_study_plan(company: str, role: str, duration_days: int):
    state = {
        "company": company,
        "role": role,
        "duration_days": duration_days
    }

    return run_agent(state)   # or whatever your main function is


# ─────────────────────────────────────────────
# API ROUTE
# ─────────────────────────────────────────────
@router.post("/generate-plan")
def generate_plan(req: StudyPlanRequest):
    state = AgentState({
        "company": req.company,
        "role": req.role,
        "duration_days": req.duration_days
    })

    return run_agent(state)