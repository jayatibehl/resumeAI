from flask import Blueprint, request, jsonify
import sqlite3
import os

from ai.jd_matcher import match_resume_to_jobs

job_bp = Blueprint("jobs", __name__, url_prefix="/api/jobs")

# ------------------ DATABASE PATH ------------------

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, "resumeai.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ------------------ INIT JOBS TABLE ------------------

def init_jobs_table():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            recruiter_email TEXT
        )
    """)

    conn.commit()
    conn.close()


# ------------------ INIT CANDIDATES TABLE ------------------

def init_candidates_table():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS candidates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            resume_text TEXT,
            resume_file TEXT
        )
    """)

    conn.commit()
    conn.close()


# ------------------ POST JOB ------------------

@job_bp.route("/post", methods=["POST"])
def post_job():

    data = request.json

    title = data.get("title")
    description = data.get("description")
    recruiter_email = data.get("recruiter_email")

    if not title or not description:
        return jsonify({"error": "Missing fields"}), 400

    init_jobs_table()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO jobs (title, description, recruiter_email) VALUES (?, ?, ?)",
        (title, description, recruiter_email)
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "Job posted successfully"})


# ------------------ GET ALL JOBS ------------------

@job_bp.route("/all", methods=["GET"])
def get_all_jobs():

    init_jobs_table()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, title, description FROM jobs")
    jobs = cursor.fetchall()

    conn.close()

    job_list = []

    for job in jobs:
        job_list.append({
            "id": job["id"],
            "title": job["title"],
            "description": job["description"]
        })

    return jsonify(job_list)


# ------------------ GET SINGLE JOB ------------------

@job_bp.route("/<int:job_id>", methods=["GET"])
def get_job(job_id):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, title, description FROM jobs WHERE id = ?", (job_id,))
    job = cursor.fetchone()

    conn.close()

    if not job:
        return jsonify({"error": "Job not found"}), 404

    return jsonify({
        "id": job["id"],
        "title": job["title"],
        "description": job["description"]
    })


# ============================================================
# 🔥 MATCHED CANDIDATES FOR A JOB
# ============================================================

@job_bp.route("/matched-candidates", methods=["POST"])
def matched_candidates():

    data = request.json
    job_id = data.get("job_id")

    if not job_id:
        return jsonify({"error": "Job ID required"}), 400

    init_candidates_table()

    conn = get_connection()
    cursor = conn.cursor()

    # 🔹 Get job description
    cursor.execute("SELECT description FROM jobs WHERE id = ?", (job_id,))
    job = cursor.fetchone()

    if not job:
        return jsonify({"error": "Job not found"}), 404

    job_description = job["description"]

    # 🔹 Get all candidates
    cursor.execute("SELECT name, email, resume_text, resume_file FROM candidates")
    candidates = cursor.fetchall()

    results = []

    for c in candidates:

        # 🔥 match resume against all jobs
        matches = match_resume_to_jobs(c["resume_text"])

        score = 0

        # find score for THIS job
        for m in matches:
            if m["description"] == job_description:
                score = m["match_score"]

        results.append({
            "name": c["name"],
            "email": c["email"],
            "resume": c["resume_file"],
            "match_score": score
        })

    # 🔥 sort by best match
    results = sorted(results, key=lambda x: x["match_score"], reverse=True)

    return jsonify(results)