import os
import sys
from pathlib import Path

from src.etl.extractor    import run_multi_agent_extraction
from src.etl.great_filter import run_great_filter
from src.utils.db         import insert_insights  # NEW: Import DB logic

# ── Future agents — uncomment when built ────────────────────
# from src.etl.confidence_agent import run_confidence_agent
# from src.etl.trend_agent      import run_trend_agent

# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────
def _banner(phase: str, message: str):
    print(f"\n{'━'*60}")
    print(f"  {phase}")
    print(f"  {message}")
    print(f"{'━'*60}")

def _company_slug(company: str) -> str:
    return company.lower().replace(" ", "_").replace(".", "")

# ─────────────────────────────────────────────
# PIPELINE
# ─────────────────────────────────────────────
def run_pipeline(company: str, role: str) -> dict:
    """ ETL pipeline with explicit gate checks at every phase. """
    slug = _company_slug(company)

    # 1. Extraction Phase
    _banner("PHASE 1", f"Starting extraction for {company} ({role})")
    raw_data = run_multi_agent_extraction(company, role)

    # 2. Great Filter Phase
    _banner("PHASE 2", "Running Great Filter to structure data")
    final_insights = run_great_filter(raw_data)

    # 3. Database Insertion Phase (Replaces _save_json)
    _banner("PHASE 3", "Saving insights to SQLite Database")
    insert_insights(slug, final_insights)

    _banner("SUCCESS", f"Pipeline complete for {company}. Data securely saved to DB.")
    return final_insights

# ─────────────────────────────────────────────
# ENTRYPOINT
# ─────────────────────────────────────────────
if __name__ == "__main__":
    # Allows you to test the pipeline directly from the terminal
    test_company = input("Enter company (default: Amazon): ").strip() or "Amazon"
    test_role    = input("Enter role    (default: SDE):    ").strip() or "SDE"
    run_pipeline(test_company, test_role)