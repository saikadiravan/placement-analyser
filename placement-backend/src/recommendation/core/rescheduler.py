from fastapi import HTTPException
from src.utils.db import fetch_schedule, update_schedule


def reschedule_by_completed_days(company: str, completed_task_ids: list) -> dict:
    slug = company.lower().replace(" ", "_").replace(".", "")
    plan = fetch_schedule(slug)

    if not plan:
        raise HTTPException(
            status_code=404,
            detail=f"No schedule found for '{company}'. Generate a plan first.",
        )

    completed_set = set(filter(None, completed_task_ids))
    pending_tasks = []
    tasks_completed = 0

    schedule = plan.get("schedule", [])

    # STEP 1: Find current working day
    current_day_index = None
    for i, block in enumerate(schedule):
        tasks = block.get("tasks", [])
        if tasks and not all(t.get("completed", False) for t in tasks):
            current_day_index = i
            break

    if current_day_index is None:
        return {
            "message": "All tasks already completed",
            "tasks_completed": len(completed_set),
            "tasks_rescheduled": 0,
            "updated_plan": plan,
        }

    current_block = schedule[current_day_index]
    kept_tasks = []

    # STEP 2: Process tasks
    # STEP 2: Check if FULL DAY is completed
    tasks = current_block.get("tasks", [])

    completed_today = 0

    for task in tasks:
        if task.get("id") in completed_set:
            task["completed"] = True
            completed_today += 1

    # 🔥 NEW LOGIC
    if completed_today == 0:
        # User skipped entire day → reschedule ALL
        pending_tasks = tasks
        current_block["tasks"] = []
    else:
        # User worked → DO NOT reschedule remaining tasks
        pending_tasks = []
        current_block["tasks"] = tasks

    # STEP 3: PRIORITIZE pending tasks
    pending_tasks.sort(key=lambda x: x.get("value", 1), reverse=True)

    tasks_rescheduled = len(pending_tasks)

    # STEP 4: Distribute across future days (not just next day)
    next_day = current_day_index + 1

    for task in pending_tasks:
        if next_day >= len(schedule):
            break

        schedule[next_day]["tasks"].append(task)

        # Prevent overload (max 5 tasks per day)
        if len(schedule[next_day]["tasks"]) >= 5:
            next_day += 1

    update_schedule(slug, plan)

    return {
        "message": "Rescheduling complete",
        "tasks_completed": tasks_completed,
        "tasks_rescheduled": tasks_rescheduled,
        "updated_plan": plan,
    }


# 🔥 Value assignment logic
def _assign_value(task):
    category = task.get("category", "").lower()

    if category == "dsa":
        return 5
    elif category == "system_design":
        return 4
    elif category == "behavioral":
        return 3
    elif category == "revision":
        return 2
    else:
        return 1