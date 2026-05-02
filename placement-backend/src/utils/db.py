import sqlite3
import json
from src.utils.paths import DATA_DIR

# Define the path for your new SQLite database file
DB_PATH = DATA_DIR / "placement.db"

def init_db():
    """Initializes the SQLite database and creates necessary tables."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Table to store the extracted insights JSON
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS insights (
            company_slug TEXT PRIMARY KEY,
            data TEXT
        )
    ''')
    
    # Table to store the generated study schedules JSON
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS schedules (
            company_slug TEXT PRIMARY KEY,
            data TEXT
        )
    ''')
    
    conn.commit()
    conn.close()

# ─────────────────────────────────────────────
# INSIGHTS LOGIC (Replaces Great Filter File I/O)
# ─────────────────────────────────────────────
def insert_insights(company_slug: str, data: dict):
    """Saves or updates the extracted JSON insights into the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # UPSERT logic: If company exists, update the data. Otherwise, insert.
    cursor.execute('''
        INSERT INTO insights (company_slug, data)
        VALUES (?, ?)
        ON CONFLICT(company_slug) DO UPDATE SET data=excluded.data
    ''', (company_slug, json.dumps(data)))
    
    conn.commit()
    conn.close()

def fetch_insights(company_slug: str) -> dict:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT data FROM insights WHERE company_slug = ?', (company_slug,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        # Get the first element of the tuple
        return json.loads(row[ 0 ])  
    return None

# ─────────────────────────────────────────────
# SCHEDULE LOGIC (Replaces Recommendation File I/O)
# ─────────────────────────────────────────────
def insert_schedule(company_slug: str, data: dict):
    """Saves a newly generated study plan into the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO schedules (company_slug, data)
        VALUES (?, ?)
        ON CONFLICT(company_slug) DO UPDATE SET data=excluded.data
    ''', (company_slug, json.dumps(data)))
    
    conn.commit()
    conn.close()

def fetch_schedule(company_slug: str) -> dict:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT data FROM schedules WHERE company_slug = ?', (company_slug,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        # Get the first element of the tuple
        return json.loads(row[ 0 ])  
    return None

def update_schedule(company_slug: str, data: dict):
    """Updates an existing schedule (used by the Rescheduler)."""
    # Since our insertion query uses UPSERT (ON CONFLICT REPLACE), 
    # we can safely reuse the insert_schedule function here.
    insert_schedule(company_slug, data)

def get_all_scheduled_companies() -> list:
    """Returns a list of all companies that currently have a study plan."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT company_slug FROM schedules')
    rows = cursor.fetchall()
    conn.close()
    
    return [row for row in rows]

# Automatically initialize tables when this file is imported anywhere in your app
init_db()