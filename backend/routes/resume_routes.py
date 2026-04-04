from flask import Blueprint, request, jsonify
import os
import sqlite3
import jwt

# AI Processing Imports
from ai.pdf_parser import extract_resume_text
from ai.resume_validator import is_resume
from ai.semantic_matcher import recommend_roles
from ai.jd_matcher import match_resume_to_jobs
from ai.skill_extractor import extract_skills, detect_experience

resume_bp = Blueprint("resume", __name__, url_prefix="/api/resume")

# --- 📂 Path Configuration (Robust Way) ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "database", "resumeai.db")
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
SECRET_KEY = 'super-secret-resume-ai-key-2026-secure'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def init_candidates_table():
    """Ensure candidates table exists before use"""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS candidates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                email TEXT UNIQUE,
                resume_text TEXT,
                resume_file TEXT
            )
        """)
        conn.commit()

@resume_bp.route("/upload", methods=["POST"])
def upload_resume():
    try:
        # 1. Database sync
        init_candidates_table()

        # 2. Input Validation
        name = request.form.get("name")
        email = request.form.get("email")

        if not email:
            return jsonify({"error": "Session expired or email missing. Please login."}), 400

        if "file" not in request.files:
            return jsonify({"error": "No resume file detected"}), 400

        file = request.files["file"]
        if file.filename == "" or not file.filename.lower().endswith(".pdf"):
            return jsonify({"error": "Only PDF resumes are allowed"}), 400

        # Save file with a safe path
        filepath = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filepath)

        # 3. 🤖 AI Pipeline (The heavy lifting)
        text = extract_resume_text(filepath)
        if not text or len(text.strip()) < 50: # Increased threshold for better accuracy
            return jsonify({"error": "The PDF seems empty or unreadable"}), 400

        if not is_resume(text):
            return jsonify({"error": "This doesn't look like a standard professional resume"}), 400

        # AI Analysis
        skills = extract_skills(text)
        experience = detect_experience(text)
        roles = recommend_roles(text)
        
        # Note: Ensure jd_matcher.py is also using DB_PATH
        job_matches = match_resume_to_jobs(text)

        # 4. 💾 Database Persistence
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            # Insert or Update logic
            cursor.execute("""
                INSERT INTO candidates (name, email, resume_text, resume_file) 
                VALUES (?, ?, ?, ?)
                ON CONFLICT(email) DO UPDATE SET
                name=excluded.name,
                resume_text=excluded.resume_text,
                resume_file=excluded.resume_file
            """, (name, email, text, file.filename))
            conn.commit()

        # 5. Success Response
        return jsonify({
            "message": "Resume analyzed successfully",
            "analysis": {
                "skills_found": skills,
                "experience_level": experience
            },
            "recommended_roles": roles,
            "matching_jobs": job_matches
        })

    except Exception as e:
        # Log to terminal for the developer, send cleaner message to user
        print(f"❌ Server Error Detail: {str(e)}")
        return jsonify({"error": f"Internal Error: {str(e)}"}), 500