# from fastapi import HTTPException
# from src.utils.db import fetch_schedule, update_schedule


# def reschedule_by_completed_days(company: str, completed_task_ids: list) -> dict:
#     slug = company.lower().replace(" ", "_").replace(".", "")
#     plan = fetch_schedule(slug)

#     if not plan:
#         raise HTTPException(
#             status_code=404,
#             detail=f"No schedule found for '{company}'. Generate a plan first.",
#         )

#     completed_set = set(filter(None, completed_task_ids))
#     pending_tasks = []
#     tasks_completed = 0

#     schedule = plan.get("schedule", [])

#     # STEP 1: Find current working day
#     current_day_index = None
#     for i, block in enumerate(schedule):
#         tasks = block.get("tasks", [])
#         if tasks and not all(t.get("completed", False) for t in tasks):
#             current_day_index = i
#             break

#     if current_day_index is None:
#         return {
#             "message": "All tasks already completed",
#             "tasks_completed": len(completed_set),
#             "tasks_rescheduled": 0,
#             "updated_plan": plan,
#         }

#     current_block = schedule[current_day_index]
#     kept_tasks = []

#     # STEP 2: Process tasks
#     # STEP 2: Check if FULL DAY is completed
#     tasks = current_block.get("tasks", [])

#     completed_today = 0

#     for task in tasks:
#         if task.get("id") in completed_set:
#             task["completed"] = True
#             completed_today += 1

#     # 🔥 NEW LOGIC
#     if completed_today == 0:
#         # User skipped entire day → reschedule ALL
#         pending_tasks = tasks
#         current_block["tasks"] = []
#     else:
#         # User worked → DO NOT reschedule remaining tasks
#         pending_tasks = []
#         current_block["tasks"] = tasks

#     # STEP 3: PRIORITIZE pending tasks
#     pending_tasks.sort(key=lambda x: x.get("value", 1), reverse=True)

#     tasks_rescheduled = len(pending_tasks)

#     # STEP 4: Distribute across future days (not just next day)
#     next_day = current_day_index + 1

#     for task in pending_tasks:
#         if next_day >= len(schedule):
#             break

#         schedule[next_day]["tasks"].append(task)

#         # Prevent overload (max 5 tasks per day)
#         if len(schedule[next_day]["tasks"]) >= 5:
#             next_day += 1

#     update_schedule(slug, plan)

#     return {
#         "message": "Rescheduling complete",
#         "tasks_completed": tasks_completed,
#         "tasks_rescheduled": tasks_rescheduled,
#         "updated_plan": plan,
#     }


# # 🔥 Value assignment logic
# def _assign_value(task):
#     category = task.get("category", "").lower()

#     if category == "dsa":
#         return 5
#     elif category == "system_design":
#         return 4
#     elif category == "behavioral":
#         return 3
#     elif category == "revision":
#         return 2
#     else:
#         return 1

# placement-backend/src/recommendation/core/rescheduler.py

from datetime import datetime, timedelta
from fastapi import HTTPException
from src.utils.db import fetch_schedule, update_schedule

MAX_TASKS_PER_DAY = 5


def _extract_full_order(task_id: str):
    """
    Extracts (day, task_index) from id like 'd12_t3'
    Ensures correct FIFO ordering
    """
    try:
        d, t = task_id.split("_")
        return (int(d[1:]), int(t[1:]))
    except:
        return (9999, 9999)


def reschedule_by_completed_days(
    company: str,
    completed_task_ids: list,
    manual_moves: dict = None
) -> dict:

    slug = company.lower().replace(" ", "_").replace(".", "")
    plan = fetch_schedule(slug)

    if not plan:
        raise HTTPException(
            status_code=404,
            detail=f"No schedule found for '{company}'"
        )

    # ✅ FOR TESTING (simulate missed days)
    today = datetime.now().date() + timedelta(days=5)

    completed_set = set(completed_task_ids)
    manual_moves = manual_moves or {}

    pending_tasks = []
    future_schedule = {}
    day_metadata = {}

    tasks_completed = 0
    total_tasks = 0

    print("\n========== RESCHEDULER DEBUG START ==========")
    print("TODAY:", today)

    # ─────────────────────────────
    # 1. CLASSIFY TASKS (FIXED)
    # ─────────────────────────────
    for block in plan.get("schedule", []):
        block_date_str = block.get("date")

        # Preserve UI metadata
        if block_date_str:
            day_metadata[block_date_str] = {
                "focus": block.get("focus", "Study Day"),
                "tip": block.get("tip", "Stay consistent!")
            }

        for task in block.get("tasks", []):
            total_tasks += 1

            task_id = task.get("id")

            # ✅ FIX 1: ALWAYS use block date (consistent)
            task_date_str = block_date_str

            if task_date_str:
                task_date = datetime.strptime(task_date_str, "%Y-%m-%d").date()
            else:
                task_date = today
                task_date_str = today.strftime("%Y-%m-%d")

            # ✅ Mark completed
            if task_id in completed_set:
                task["completed"] = True
                tasks_completed += 1
                future_schedule.setdefault(task_date_str, []).append(task)
                continue

            # ✅ Manual override
            if task_id in manual_moves:
                new_date = manual_moves[task_id]
                task["date"] = new_date
                future_schedule.setdefault(new_date, []).append(task)
                continue

            # ✅ FIX 2: Detect missed tasks properly
            if task_date < today and not task.get("completed", False):
                pending_tasks.append(task)
            else:
                future_schedule.setdefault(task_date_str, []).append(task)

    # ✅ FIX 3: Proper FIFO sorting
    pending_tasks.sort(key=lambda x: _extract_full_order(x.get("id", "")))

    tasks_rescheduled = len(pending_tasks)

    print("Pending tasks:", tasks_rescheduled)

    # ─────────────────────────────
    # 2. SMART REDISTRIBUTION
    # ─────────────────────────────
    current_day = today

    while pending_tasks:
        day_str = current_day.strftime("%Y-%m-%d")

        existing_tasks = future_schedule.get(day_str, [])
        capacity = MAX_TASKS_PER_DAY - len(existing_tasks)

        if capacity > 0:
            to_add = pending_tasks[:capacity]

            print(f"\nAssigning → {day_str}")
            print("Existing:", len(existing_tasks))
            print("Adding:", len(to_add))

            for task in to_add:
                task["date"] = day_str

            existing_tasks.extend(to_add)
            future_schedule[day_str] = existing_tasks

            pending_tasks = pending_tasks[capacity:]

        current_day += timedelta(days=1)

    # ─────────────────────────────
    # 3. REBUILD SCHEDULE
    # ─────────────────────────────
    new_schedule = []
    sorted_dates = sorted(future_schedule.keys())

    for idx, date_str in enumerate(sorted_dates, start=1):

        meta = day_metadata.get(
            date_str,
            {
                "focus": "Catch-up & Revision",
                "tip": "You're covering missed tasks. Stay focused!"
            }
        )

        new_schedule.append({
            "day": idx,
            "date": date_str,
            "focus": meta["focus"],
            "tip": meta["tip"],
            "tasks": future_schedule[date_str]
        })

    # ─────────────────────────────
    # 4. PERFORMANCE METRICS
    # ─────────────────────────────
    completion_rate = tasks_completed / max(1, total_tasks)

    plan["schedule"] = new_schedule
    plan["performance"] = {
        "completion_rate": completion_rate
    }

    print("\nFINAL DISTRIBUTION:")
    for d in new_schedule:
        print(d["date"], "->", len(d["tasks"]), "tasks")

    print("========== RESCHEDULER DEBUG END ==========\n")

    update_schedule(slug, plan)

    return {
        "message": "Smart rescheduling complete",
        "tasks_completed": tasks_completed,
        "tasks_rescheduled": tasks_rescheduled,
        "completion_rate": completion_rate,
        "updated_plan": plan
    }