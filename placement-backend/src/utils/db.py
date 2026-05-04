import sqlite3
import json
from contextlib import contextmanager
from src.utils.paths import DATA_DIR

DB_PATH = DATA_DIR / "placement.db"


# ─────────────────────────────────────────────
# DB CONNECTION (CLEAN + SAFE)
# ─────────────────────────────────────────────
@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS insights (
            company_slug TEXT PRIMARY KEY,
            data TEXT
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS schedules (
            company_slug TEXT PRIMARY KEY,
            data TEXT
        )
        """)


# ─────────────────────────────────────────────
# INSIGHTS
# ─────────────────────────────────────────────
def insert_insights(company_slug: str, data: dict):
    with get_db() as conn:
        conn.execute("""
        INSERT INTO insights (company_slug, data)
        VALUES (?, ?)
        ON CONFLICT(company_slug)
        DO UPDATE SET data = excluded.data
        """, (company_slug, json.dumps(data)))


def fetch_insights(company_slug: str) -> dict:
    with get_db() as conn:
        cursor = conn.execute(
            "SELECT data FROM insights WHERE company_slug = ?",
            (company_slug,)
        )
        row = cursor.fetchone()

    return json.loads(row[0]) if row else None


# ─────────────────────────────────────────────
# SCHEDULE
# ─────────────────────────────────────────────
def insert_schedule(company_slug: str, data: dict):
    with get_db() as conn:
        conn.execute("""
        INSERT INTO schedules (company_slug, data)
        VALUES (?, ?)
        ON CONFLICT(company_slug)
        DO UPDATE SET data = excluded.data
        """, (company_slug, json.dumps(data)))


def fetch_schedule(company_slug: str) -> dict:
    with get_db() as conn:
        cursor = conn.execute(
            "SELECT data FROM schedules WHERE company_slug = ?",
            (company_slug,)
        )
        row = cursor.fetchone()

    return json.loads(row[0]) if row else None


def update_schedule(company_slug: str, data: dict):
    insert_schedule(company_slug, data)


def get_all_scheduled_companies() -> list:
    with get_db() as conn:
        cursor = conn.execute("SELECT company_slug FROM schedules")
        rows = cursor.fetchall()

    return [row[0] for row in rows]


# Auto init
init_db()