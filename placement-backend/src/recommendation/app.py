import json
from flask import Flask, jsonify, request
from src.recommendation.agents.gemini_agent import generate_study_plan
from src.recommendation.core.rescheduler    import reschedule_by_completed_days
from flask_cors import CORS # Add this
from src.utils.paths import OUTPUTS_DIR
from src.integration.build_schedule import run_pipeline


app = Flask(__name__)
CORS(app)


def _company_slug(company: str) -> str:
    return company.lower().replace(" ", "_").replace(".", "")


# ─────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────
@app.route("/extract", methods=["POST"])
def extract_company_data():
    """
    Online Mode route — Triggers the multi-agent ETL pipeline to scrape, 
    filter, and cache real company insights.
    """
    data = request.json
    company = data.get("company")
    role = data.get("role", "SDE")
    
    if not company:
        return jsonify({"error": "Company name is required"}), 400
        
    try:
        # Runs GitHub/Reddit/Web extraction -> Great Filter -> Saves to JSON
        result = run_pipeline(company, role)
        return jsonify({
            "message": f"Successfully extracted and filtered data for {company}", 
            "data": result
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    
@app.route("/generate-plan", methods=["POST"])
def generate():
    """
    Expensive route — calls Gemini to generate the study schedule.

    Expected JSON body:
    {
        "company":       "Google",
        "role":          "SDE",
        "duration_days": 30        (optional, default 30)
    }

    Pre-flight: returns 400 if ETL insights don't exist for this company.
    """
    data     = request.json or {}
    company  = data.get("company", "Amazon").strip()
    role     = data.get("role",    "SDE").strip()
    days     = int(data.get("duration_days", 30))

    if not company:
        return jsonify({"status": "error", "message": "Field 'company' is required."}), 400

    # Pre-flight: ETL insights must exist before we spend an API call
    slug          = _company_slug(company)
    insights_file = OUTPUTS_DIR / f"{slug}_insights.json"

    if not insights_file.exists():
        return jsonify({
            "status":  "error",
            "message": (
                f"No ETL insights found for '{company}'. "
                "Run the ETL pipeline first to extract interview data."
            ),
        }), 400

    try:
        plan = generate_study_plan(company, role, days)

        if "error" in plan:
            return jsonify({"status": "error", "message": plan["error"]}), 500

        return jsonify({"status": "success", "plan": plan})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/reschedule", methods=["POST"])
def reschedule():
    """
    Free route — no API calls, modifies local JSON only.
    Safe to call on every frontend sync or page load.

    Expected JSON body:
    {
        "company":         "Google",
        "completed_tasks": ["d1_t1", "d2_t3", "d3_t1"]
    }
    """
    data                = request.json or {}
    company             = data.get("company", "").strip()
    completed_task_ids  = data.get("completed_tasks", [])

    if not company:
        return jsonify({"status": "error", "message": "Field 'company' is required."}), 400

    try:
        plan = reschedule_by_completed_days(company, completed_task_ids)
        return jsonify({"status": "success", "plan": plan})

    except FileNotFoundError as e:
        return jsonify({"status": "error", "message": str(e)}), 404

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/schedule/<company>", methods=["GET"])
def get_schedule(company: str):
    """ Free route — reads current schedule from disk for the given company. Used by the frontend to load or refresh the active plan. """
    # Match the file naming convention exactly
    safe_company = company.lower().replace(" ", "_").replace(".", "")
    file_path = OUTPUTS_DIR / f"{safe_company}_schedule.json"
    
    if file_path.exists():
        with open(file_path, "r", encoding="utf-8") as f:
            return jsonify(json.load(f))
            
    # Return 404 ONLY if the file genuinely does not exist yet
    return jsonify({"error": f"No schedule found for {company}"}), 404

@app.route("/schedule", methods=["GET"])
def list_schedules():
    """
    Free route — lists all companies that have a generated schedule.
    Useful for the frontend to show available plans.
    """
    schedules = []
    for file in OUTPUTS_DIR.glob("*_schedule.json"):
        company_slug = file.stem.replace("_schedule", "")
        schedules.append({
            "company": company_slug,
            "file":    file.name,
        })

    return jsonify({"schedules": schedules})

@app.route("/insights/<company>", methods=["GET"])
def get_insights(company: str):
    """
    Online Mode route — Fetches the extracted JSON insights from disk.
    """
    safe_company = company.lower().replace(" ", "_")
    verified_path = OUTPUTS_DIR / f"{safe_company}_verified_insights.json"
    raw_path = OUTPUTS_DIR / f"{safe_company}_insights.json"
    
    # Serve verified insights if available, else raw insights
    if verified_path.exists():
        with open(verified_path, "r", encoding="utf-8") as f:
            return jsonify(json.load(f))
    elif raw_path.exists():
        with open(raw_path, "r", encoding="utf-8") as f:
            return jsonify(json.load(f))
    else:
        return jsonify({"error": f"No insights found for {company}"}), 404


# ─────────────────────────────────────────────
# ENTRYPOINT
# ─────────────────────────────────────────────

if __name__ == "__main__":
    print("Recommendation API running on http://localhost:5000")
    print("Routes:")
    print("  POST /generate-plan          — generate study plan (calls Gemini)")
    print("  POST /reschedule             — mark tasks complete + shift overdue (free)")
    print("  GET  /schedule/<company>     — fetch active plan for a company")
    print("  GET  /schedule               — list all available plans")
    app.run(debug=True, port=5000)