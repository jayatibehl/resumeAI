import sqlite3
import os
from werkzeug.security import generate_password_hash


def init_db():

    # Ensure database folder exists
    os.makedirs("database", exist_ok=True)

    conn = sqlite3.connect("database/resumeai.db")
    cursor = conn.cursor()

    # ------------------ USERS TABLE ------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        is_banned INTEGER DEFAULT 0,
        reset_token TEXT,
        reset_token_expiry TEXT
    )
    """)

    # ------------------ JOBS TABLE ------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        recruiter_email TEXT,
        is_banned INTEGER DEFAULT 0
    )
    """)

    # ------------------ APPLICATIONS TABLE ------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        candidate_email TEXT,
        recruiter_email TEXT,
        job_title TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # ------------------ CANDIDATES TABLE ------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        resume_text TEXT,
        resume_file TEXT
    )
    """)

    # ------------------ SAFE MIGRATIONS ------------------

    # USERS fixes
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0")
    except:
        pass

    try:
        cursor.execute("ALTER TABLE users ADD COLUMN reset_token TEXT")
    except:
        pass

    try:
        cursor.execute("ALTER TABLE users ADD COLUMN reset_token_expiry TEXT")
    except:
        pass

    # JOBS fixes
    try:
        cursor.execute("ALTER TABLE jobs ADD COLUMN is_banned INTEGER DEFAULT 0")
    except:
        pass

    # ------------------ CREATE DEFAULT ADMIN ------------------
    cursor.execute("SELECT * FROM users WHERE role = 'admin'")
    admin = cursor.fetchone()

    if not admin:
        hashed_password = generate_password_hash("admin123")

        cursor.execute("""
        INSERT INTO users (name, email, password, role)
        VALUES (?, ?, ?, ?)
        """, (
            "Admin",
            "adminresume6@gmail.com",
            hashed_password,
            "admin"
        ))

        print("✅ Admin created: adminresume6@gmail.com / admin123")

    conn.commit()
    conn.close()

    print("✅ Database initialized successfully")


if __name__ == "__main__":
    init_db()