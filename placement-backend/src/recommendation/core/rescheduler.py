import json
from datetime import datetime
# Import your database helper instead
from src.utils.db import fetch_schedule, update_schedule


def reschedule_by_completed_days(
    company: str,
    completed_task_ids: list,
) -> dict:
    slug = company.lower().replace(" ", "_").replace(".", "")
    
    # Fetch from DB instead of disk
    plan = fetch_schedule(slug)
    if not plan:
        raise HTTPException(
            status_code=404,
            detail=f"No schedule found for '{company}' in database. Generate a plan first.",
        )

    today_str = datetime.now().strftime("%Y-%m-%d")
    completed_set = set(completed_task_ids)

    tasks_completed = 0
    tasks_rescheduled = 0

    for block in plan.get("schedule", []):
        block_date = block.get("date", "")
        for task in block.get("tasks", []):
            task_id = task.get("id", "")

            # 1. Mark completed
            if task_id in completed_set:
                if not task.get("completed", False):
                    task["completed"] = True
                    tasks_completed += 1

            # 2. Reschedule overdue tasks
            if (
                block_date
                and block_date < today_str
                and not task.get("completed", False)
            ):
                task["date"] = today_str
                task["priority"] = "high"
                tasks_rescheduled += 1

    # Save updated plan to DB
    update_schedule(slug, plan)

    return {
        "message": "Rescheduling complete",
        "tasks_completed": tasks_completed,
        "tasks_rescheduled": tasks_rescheduled,
        "updated_plan": plan,
    }