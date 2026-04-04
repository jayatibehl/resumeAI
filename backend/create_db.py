import sqlite3
import os

db_path = os.path.join("database", "resumeai.db")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT
)
""")

conn.commit()
conn.close()

print("✅ Users table created successfully")