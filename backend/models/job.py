import sqlite3

DB_PATH = "database/resumeai.db"

def create_job_table():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company TEXT,
        role TEXT,
        description TEXT
    )
    """)

    conn.commit()
    conn.close()