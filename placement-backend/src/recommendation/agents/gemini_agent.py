import json
import os
from datetime import datetime, timedelta
import google.generativeai as genai
from dotenv import load_dotenv

# ✅ DB IMPORTS (IMPORTANT)
from src.utils.db import fetch_insights, insert_schedule


# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


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
# MAIN AGENT
# ─────────────────────────────────────────────
def generate_study_plan(
    company: str = "Amazon",
    role: str = "SDE",
    duration_days: int = 30,
) -> dict:

    print(f"\n[RecommendationAgent] Generating {duration_days}-day plan for {company} | {role}...")

    slug = _company_slug(company)

    # ✅ FETCH FROM DB INSTEAD OF FILE
    insights = fetch_insights(slug)

    if not insights:
        msg = f"No insights found in DB for '{company}'. Run ETL first."
        print(f"[RecommendationAgent] ❌ {msg}")
        return {
            "error": "insights_not_found",
            "message": msg,
        }

    # ── Extract fields ─────────────────────────
    dsa_topics    = insights.get("dsaTopics", [])
    system_topics = insights.get("systemDesignTopics", [])
    behavioral_qs = insights.get("behavioralQuestions", [])
    process_steps = insights.get("interviewProcess", [])
    difficulty    = insights.get("difficulty", "Medium")
    avg_rounds    = insights.get("avgRounds", 4)
    enriched      = insights.get("enrichedInsights", "")

    # ── Prompt Construction ────────────────────
    phase1_end = duration_days // 3
    phase2_end = (2 * duration_days) // 3

    prompt = f"""
You are an elite Technical Career Coach building a personalised {duration_days}-day
interview preparation schedule for a candidate targeting {company} {role}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFIED INTERVIEW DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Interview Process:
{json.dumps(process_steps, indent=2)}

DSA Topics:
{json.dumps(dsa_topics, indent=2)}

System Design Topics:
{json.dumps(system_topics, indent=2)}

Behavioral Questions:
{json.dumps(behavioral_qs, indent=2)}

Difficulty : {difficulty}
Avg Rounds : {avg_rounds}

Company Insight:
\"\"\"{enriched}\"\"\"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Use ONLY the topics listed above.
2. Distribute ALL DSA topics across {duration_days} days.
3. 3–5 tasks/day (max 6)
4. Phase-based planning:
   - Phase 1: Basics
   - Phase 2: Depth
   - Phase 3: Mock + revision
5. Include:
   - 2 mock days
   - 1 behavioral day
   - 1 revision day
6. Tips MUST reference company insight

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT JSON ONLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{
    "company": "{company}",
    "role": "{role}",
    "total_days": {duration_days},
    "difficulty": "{difficulty}",
    "schedule": [
        {{
            "day": 1,
            "focus": "Topic",
            "tasks": [
                {{
                    "title": "Problem",
                    "category": "dsa"
                }}
            ],
            "tip": "Specific company insight tip"
        }}
    ]
}}
"""

    # ── Gemini Call ───────────────────────────
    model = genai.GenerativeModel("gemini-2.5-flash-lite")

    try:
        response = model.generate_content(prompt)

        if not response or not hasattr(response, "text") or not response.text:
            raise ValueError("Empty response from Gemini")

        raw_text = response.text.strip()

        import re

        # ✅ Extract pure JSON safely
        match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if match:
            raw_text = match.group(0)

        raw_text = raw_text.strip()

        plan = json.loads(raw_text)

    except Exception as e:
        print(f"[RecommendationAgent] ❌ Gemini Parsing Error: {e}")
        print("\n[FULL RAW RESPONSE]\n", response.text if response else "NO RESPONSE")

        return {
            "error": "gemini_parse_failed",
            "details": str(e),
            "raw_preview": response.text[:300] if response and response.text else None
        }

    # ── Post-process ──────────────────────────
    start_date = _compute_start_date()
    plan["start_date"] = start_date
    plan["schedule"] = _inject_ids_and_dates(plan.get("schedule", []), start_date)

    total_tasks = sum(len(d.get("tasks", [])) for d in plan.get("schedule", []))

    # ✅ SAVE TO DB
    insert_schedule(slug, plan)

    print(f"[RecommendationAgent] ✅ {total_tasks} tasks generated")
    print(f"[RecommendationAgent] ✅ Stored in DB for '{slug}'")

    return plan


# ─────────────────────────────────────────────
# ENTRYPOINT
# ─────────────────────────────────────────────
if __name__ == "__main__":
    company  = input("Company (default: Google): ").strip() or "Google"
    role     = input("Role    (default: SDE):    ").strip() or "SDE"
    days_str = input("Days    (default: 30):     ").strip() or "30"

    result = generate_study_plan(company, role, int(days_str))

    if "error" not in result:
        total = sum(len(d.get("tasks", [])) for d in result.get("schedule", []))
        print(f"\n✅ Plan ready: {total} tasks over {result['total_days']} days")
        print(f"Start date : {result.get('start_date')}")



# recommendation/agents/gemini_agent.py

# import json
# import os
# from datetime import datetime, timedelta
# from typing import Dict, Any
# from fastapi import HTTPException
# import google.generativeai as genai
# from dotenv import load_dotenv

# from src.utils.db import fetch_insights, insert_schedule

# load_dotenv()
# genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
# model = genai.GenerativeModel("gemini-2.5-flash-lite")


# class AgentState(dict):
#     pass


# # ─────────────────────────────────────────────
# # HELPERS
# # ─────────────────────────────────────────────
# def _company_slug(company: str) -> str:
#     return company.lower().replace(" ", "_").replace(".", "")


# def _compute_start_date() -> str:
#     # FIX: Start from TODAY, not tomorrow.
#     # Starting tomorrow meant day 1 was always in the future, so the
#     # rescheduler's `block_date < today_str` check could never fire on day 1,
#     # and "Auto-Reschedule" always reported "on track" even with missed tasks.
#     return datetime.now().strftime("%Y-%m-%d")


# def _date_for_day(start_date: str, day_number: int) -> str:
#     start = datetime.strptime(start_date, "%Y-%m-%d")
#     return (start + timedelta(days=day_number - 1)).strftime("%Y-%m-%d")


# def _inject_ids_and_dates(schedule: list, start_date: str) -> list:
#     for block in schedule:
#         day_num = block.get("day", 1)
#         block["date"] = _date_for_day(start_date, day_num)
#         for idx, task in enumerate(block.get("tasks", []), start=1):
#             task["id"] = f"d{day_num}_t{idx}"
#             task["completed"] = False
#     return schedule


# # ─────────────────────────────────────────────
# # NODE 1: LOAD INSIGHTS
# # ─────────────────────────────────────────────
# def load_insights_node(state: AgentState) -> AgentState:
#     slug = _company_slug(state["company"])
#     insights_data = fetch_insights(slug)
#     if not insights_data:
#         raise HTTPException(
#             status_code=404,
#             detail="Insights not found in database. Run ETL first."
#         )
#     state["insights"] = insights_data
#     return state


# # ─────────────────────────────────────────────
# # NODE 2: INTELLIGENT PLANNER
# # ─────────────────────────────────────────────
# def planner_node(state: AgentState) -> AgentState:
#     insights = state["insights"]
#     days = state["duration_days"]
#     dsa = insights.get("dsaTopics", [])
#     behavioral = insights.get("behavioralQuestions", ["Tell me about yourself"])
#     quant = insights.get("quantTopics", ["Aptitude Basics"])

#     def tag_difficulty(topic):
#         t = topic.lower()
#         if any(x in t for x in ["graph", "dp", "dynamic", "hard", "tree"]):
#             return "hard"
#         elif any(x in t for x in ["heap", "medium", "matrix", "sort"]):
#             return "medium"
#         return "easy"

#     dsa_tagged = [
#         {"title": t, "category": "dsa", "difficulty": tag_difficulty(t)}
#         for t in dsa
#     ]
#     easy = [t for t in dsa_tagged if t["difficulty"] == "easy"]
#     medium = [t for t in dsa_tagged if t["difficulty"] == "medium"]
#     hard = [t for t in dsa_tagged if t["difficulty"] == "hard"]

#     schedule = []
#     for day in range(days):
#         tasks = []

#         if day < days * 0.3:
#             pool = easy + medium
#         elif day < days * 0.7:
#             pool = medium + hard
#         else:
#             pool = hard

#         if not pool and dsa_tagged:
#             pool = dsa_tagged

#         if pool:
#             tasks.append(pool[day % len(pool)])

#         if behavioral:
#             tasks.append({
#                 "title": behavioral[day % len(behavioral)],
#                 "category": "behavioral",
#                 "difficulty": "easy"
#             })
#         if quant:
#             tasks.append({
#                 "title": quant[day % len(quant)],
#                 "category": "quant",
#                 "difficulty": "medium"
#             })

#         schedule.append({
#             "day": day + 1,
#             "focus": "Mixed Prep (DSA + Behavioral + Quant)",
#             "tasks": tasks,
#             "tip": ""
#         })

#     state["draft_schedule"] = schedule
#     return state


# # ─────────────────────────────────────────────
# # NODE 3: ADAPTIVE HOOK
# # ─────────────────────────────────────────────
# def apply_adaptive_adjustment(state: AgentState) -> AgentState:
#     perf = state.get("performance", {})
#     if not perf:
#         return state

#     completion_rate = perf.get("completion_rate", 0.7)
#     schedule = state["draft_schedule"]

#     for day in schedule:
#         for task in day["tasks"]:
#             if task["category"] == "dsa":
#                 if completion_rate < 0.5:
#                     task["difficulty"] = "easy"
#                 elif completion_rate > 0.8:
#                     task["difficulty"] = "hard"

#     state["draft_schedule"] = schedule
#     return state


# # ─────────────────────────────────────────────
# # SAFE LLM RESPONSE PARSER
# # ─────────────────────────────────────────────
# def _safe_parse_llm_json(text: str, fallback):
#     try:
#         return json.loads(text)
#     except Exception:
#         try:
#             start = text.find("{")
#             end = text.rfind("}") + 1
#             return json.loads(text[start:end])
#         except Exception:
#             try:
#                 start = text.find("[")
#                 end = text.rfind("]") + 1
#                 return json.loads(text[start:end])
#             except Exception:
#                 return fallback


# # ─────────────────────────────────────────────
# # NODE 4: LLM ENHANCER
# # ─────────────────────────────────────────────
# def llm_enhancer_node(state: AgentState) -> AgentState:
#     insights = state["insights"]
#     draft = state["draft_schedule"]
#     enriched = insights.get("enrichedInsights", "")

#     prompt = f"""
# Enhance the following study plan by:
# - Improving the 'focus' title for each day
# - Adding a strong 'tip' for each day referencing the company insight below.

# Company Insight:
# \"\"\"{enriched}\"\"\"

# Draft Plan:
# {json.dumps(draft, indent=2)}

# Return a pure JSON Array containing the updated schedule blocks.
# Each block must preserve all original fields (day, tasks, focus, tip).
# Do NOT add or remove tasks. Do NOT rename task categories.
# """

#     response = model.generate_content(prompt)
#     raw_text = getattr(response, "text", "")
#     enhanced = _safe_parse_llm_json(raw_text, draft)

#     if isinstance(enhanced, dict) and "schedule" in enhanced:
#         enhanced = enhanced["schedule"]
#     elif not isinstance(enhanced, list):
#         enhanced = draft

#     state["final_schedule"] = enhanced
#     return state


# # ─────────────────────────────────────────────
# # NODE 5: VALIDATOR
# # ─────────────────────────────────────────────
# def validator_node(state: AgentState) -> AgentState:
#     schedule = state["final_schedule"]
#     days = state["duration_days"]

#     if not isinstance(schedule, list) or len(schedule) != days:
#         print("[Validator] Schedule length mismatch. Reverting to draft.")
#         state["final_schedule"] = state["draft_schedule"]
#         schedule = state["final_schedule"]

#     for day in schedule:
#         # Ensure tasks preserved correctly after LLM enhancement
#         if len(day.get("tasks", [])) > 6:
#             day["tasks"] = day["tasks"][:6]

#         # FIX: Normalise task categories so the pie chart doesn't double-count.
#         # Gemini sometimes renames categories during enhancement (e.g. adds
#         # spaces, changes case). Lock them back to the original planner values.
#         for task in day.get("tasks", []):
#             cat = task.get("category", "").lower().strip()
#             if cat in ("dsa", "data structures", "coding"):
#                 task["category"] = "dsa"
#             elif cat in ("behavioral", "behaviour", "hr"):
#                 task["category"] = "behavioral"
#             elif cat in ("quant", "aptitude", "quantitative"):
#                 task["category"] = "quant"
#             elif cat in ("system design", "system-design"):
#                 task["category"] = "system-design"

#     return state


# # ─────────────────────────────────────────────
# # NODE 6: SAVE TO DATABASE
# # ─────────────────────────────────────────────
# def save_node(state: AgentState) -> AgentState:
#     start_date = _compute_start_date()
#     schedule = _inject_ids_and_dates(state["final_schedule"], start_date)

#     plan = {
#         "company": state["company"],
#         "role": state["role"],
#         "total_days": state["duration_days"],
#         "start_date": start_date,
#         "schedule": schedule,
#     }

#     slug = _company_slug(state["company"])
#     insert_schedule(slug, plan)

#     state["result"] = plan
#     return state


# # ─────────────────────────────────────────────
# # AGENT ORCHESTRATOR
# # ─────────────────────────────────────────────
# def run_agent(state: AgentState) -> Dict[str, Any]:
#     state = load_insights_node(state)
#     state = planner_node(state)
#     state = apply_adaptive_adjustment(state)
#     state = llm_enhancer_node(state)
#     state = validator_node(state)
#     state = save_node(state)
#     return state["result"]


# # ─────────────────────────────────────────────
# # MAIN EXPORTED FUNCTION
# # ─────────────────────────────────────────────
# def generate_study_plan(
#     company: str = "Amazon",
#     role: str = "SDE",
#     duration_days: int = 30,
#     performance: dict = None
# ) -> dict:
#     state = AgentState({
#         "company": company,
#         "role": role,
#         "duration_days": duration_days,
#         "performance": performance or {}
#     })
#     return run_agent(state)