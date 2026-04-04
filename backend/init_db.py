import sqlite3
import os

def init_db():
    db_folder = "database"
    if not os.path.exists(db_folder):
        os.makedirs(db_folder)
    
    conn = sqlite3.connect(os.path.join(db_folder, "resumeai.db"))
    cursor = conn.cursor()
    
    # Create Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT, email TEXT UNIQUE, phone TEXT, password TEXT, role TEXT
    )""")
    
    # Create Jobs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT, description TEXT, skills TEXT, recruiter_email TEXT
    )""")
    
    # Sample data insert karein
    cursor.execute("INSERT OR IGNORE INTO jobs (title, description, skills) VALUES ('Software Engineer', 'Python and React developer', 'Python, React, Flask')")
    
    conn.commit()
    conn.close()
    print("✅ Success: Database created successfully!")

if __name__ == "__main__":
    init_db()