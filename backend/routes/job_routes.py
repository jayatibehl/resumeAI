from flask import Blueprint, request, jsonify
import sqlite3
import os
from utils.auth_middleware import token_required

job_bp = Blueprint("jobs", __name__, url_prefix="/api/jobs")

DB_PATH = "database/resumeai.db"
UPLOAD_FOLDER = "uploads"


# ------------------ DB HELPER ------------------
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ------------------ POST JOB ------------------
@job_bp.route("/post", methods=["POST"])
@token_required
def post_job():
    data = request.json

    title = data.get("title")
    description = data.get("description")
    recruiter_email = request.user.get("email")

    if not title or not description:
        return jsonify({"error": "Missing fields"}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO jobs (title, description, recruiter_email, is_banned)
        VALUES (?, ?, ?, 0)
        """,
        (title, description, recruiter_email)
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "Job posted successfully"})


# ------------------ GET ALL JOBS ------------------
@job_bp.route("/all", methods=["GET"])
def get_jobs():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, title, description, recruiter_email
        FROM jobs
        WHERE is_banned = 0
    """)

    jobs = cursor.fetchall()
    conn.close()

    return jsonify([dict(job) for job in jobs])


# ------------------ GET BANNED JOBS ------------------
@job_bp.route("/banned", methods=["GET"])
@token_required
def get_banned_jobs():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, title, description, recruiter_email
        FROM jobs
        WHERE is_banned = 1
    """)

    jobs = cursor.fetchall()
    conn.close()

    return jsonify([dict(job) for job in jobs])


# ------------------ BAN JOB ------------------
@job_bp.route("/ban/<int:job_id>", methods=["POST"])
@token_required
def ban_job(job_id):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT recruiter_email FROM jobs WHERE id = ?", (job_id,))
    job = cursor.fetchone()

    if not job:
        conn.close()
        return jsonify({"error": "Job not found"}), 404

    recruiter_email = job["recruiter_email"]

    cursor.execute("UPDATE jobs SET is_banned = 1 WHERE id = ?", (job_id,))

    cursor.execute("""
        SELECT COUNT(*) as count FROM jobs
        WHERE recruiter_email = ? AND is_banned = 1
    """, (recruiter_email,))

    count = cursor.fetchone()["count"]

    if count > 5:
        cursor.execute("""
            UPDATE recruiters
            SET is_banned = 1
            WHERE email = ?
        """, (recruiter_email,))

    conn.commit()
    conn.close()

    return jsonify({"message": "Job banned successfully"})


# ------------------ DELETE JOB ------------------
@job_bp.route("/<int:job_id>", methods=["DELETE"])
@token_required
def delete_job(job_id):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Job deleted successfully"})


# ------------------ MATCHED CANDIDATES ------------------
@job_bp.route("/matched-candidates", methods=["POST"])
@token_required
def matched_candidates():
    data = request.json
    job_id = data.get("job_id")

    if not job_id:
        return jsonify({"error": "Job ID required"}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT description FROM jobs 
        WHERE id = ? AND is_banned = 0
    """, (job_id,))
    job = cursor.fetchone()

    if not job:
        conn.close()
        return jsonify({"error": "Job not found"}), 404

    job_description = job["description"]

    cursor.execute("""
        SELECT name, email, resume_text, resume_file
        FROM candidates
    """)
    candidates = cursor.fetchall()

    conn.close()

    from ai.jd_matcher import match_resume_to_single_job
    from ai.pdf_parser import extract_resume_text

    results = []

    for candidate in candidates:

        resume_text = candidate["resume_text"]

        if not resume_text or len(resume_text.strip()) < 20:
            file_name = candidate["resume_file"]

            if file_name:
                file_path = os.path.join(UPLOAD_FOLDER, file_name)

                try:
                    resume_text = extract_resume_text(file_path)
                except:
                    continue
            else:
                continue

        try:
            score = match_resume_to_single_job(resume_text, job_description)
        except:
            continue

        if score < 5:
            continue

        results.append({
            "name": candidate["name"],
            "email": candidate["email"],
            "resume": candidate["resume_file"],
            "match_score": score
        })

    results.sort(key=lambda x: x["match_score"], reverse=True)

    return jsonify(results)


# ------------------ APPLY TO JOB (FIXED ONLY) ------------------
@job_bp.route("/apply", methods=["POST"])
@token_required
def apply_job():
    data = request.json
    job_id = data.get("job_id")
    candidate_email = request.user.get("email")

    if not job_id:
        return jsonify({"error": "Job ID required"}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT title, recruiter_email FROM jobs WHERE id = ?", (job_id,))
    job = cursor.fetchone()

    if not job:
        conn.close()
        return jsonify({"error": "Job not found"}), 404

    job_title = job["title"]
    recruiter_email = job["recruiter_email"]

    # 🔥 prevent duplicate applications
    cursor.execute("""
        SELECT * FROM applications
        WHERE candidate_email = ? AND job_title = ?
    """, (candidate_email, job_title))

    if cursor.fetchone():
        conn.close()
        return jsonify({"message": "Already applied"})

    cursor.execute("""
        INSERT INTO applications (candidate_email, recruiter_email, job_title)
        VALUES (?, ?, ?)
    """, (candidate_email, recruiter_email, job_title))

    conn.commit()
    conn.close()

    return jsonify({"message": "Applied successfully"})