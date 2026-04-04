import sqlite3
import os

def init_db():
    if not os.path.exists("database"):
        os.makedirs("database")
    
    conn = sqlite3.connect("database/resumeai.db")
    cursor = conn.cursor()
    
    # Tables create karna
    cursor.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE, phone TEXT, password TEXT, role TEXT)")
    cursor.execute("CREATE TABLE IF NOT EXISTS jobs (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, skills TEXT, recruiter_email TEXT)")
    
    # Testing ke liye ek dummy job add karna (Optional)
    cursor.execute("INSERT OR IGNORE INTO jobs (title, description, skills) VALUES ('Python Developer', 'Flask expert needed', 'Python, Flask, React')")
    
    conn.commit()
    conn.close()
    print("✅ Database Initialized Successfully!")

if __name__ == "__main__":
    init_db()