from flask import Blueprint, request, jsonify
import os
import sqlite3

from ai.pdf_parser import extract_resume_text
from ai.resume_validator import is_resume
from ai.semantic_matcher import recommend_roles
from ai.jd_matcher import match_resume_to_jobs

from ai.experience_classifier import classify_experience
from ai.skill_extractor import extract_skills

from utils.auth_middleware import token_required

# PDF
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

resume_bp = Blueprint("resume", __name__, url_prefix="/api/resume")

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, "database", "resumeai.db")


# ============================================================
# UPLOAD RESUME
# ============================================================

@resume_bp.route("/upload", methods=["POST"])
@token_required
def upload_resume():

    user = request.user
    email = user.get("email")
    name = user.get("name")

    if not email:
        return jsonify({"error": "Unauthorized user"}), 401

    # ------------------ FILE VALIDATION ------------------

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF resumes allowed"}), 400

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    # ------------------ TEXT EXTRACTION ------------------

    text = extract_resume_text(filepath)

    if not text or len(text.strip()) < 20:
        return jsonify({"error": "Resume text extraction failed"}), 400

    if not is_resume(text):
        return jsonify({"error": "Uploaded document is not a valid resume"}), 400

    # ------------------ SKILLS ------------------

    skills = extract_skills(text)

    # ------------------ EXPERIENCE ------------------

    raw_exp = classify_experience(text)

    text_lower = text.lower()

    has_work_words = any(word in text_lower for word in [
        "worked", "developed", "built", "implemented",
        "designed", "created", "engineered", "deployed"
    ])

    has_intent = any(phrase in text_lower for phrase in [
        "seeking internship",
        "looking for internship",
        "looking for opportunity",
        "open to work"
    ])

    has_intern = "intern" in text_lower
    has_job = any(word in text_lower for word in ["engineer", "developer"])

    if (raw_exp == "Internship" and not has_intent and has_work_words) or (has_intern and has_work_words):
        experience = "Internship"

    elif (raw_exp == "Experienced" and has_work_words) or (has_job and has_work_words):
        experience = "Job"

    else:
        experience = "Fresher"

    # ------------------ ROLE MATCHING ------------------

    recommended_roles = recommend_roles(text)

    # ------------------ JOB MATCHING ------------------

    job_matches = match_resume_to_jobs(text)

    # ------------------ SAVE ------------------

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM candidates WHERE email = ?", (email,))
    existing = cursor.fetchone()

    if existing:
        cursor.execute("""
            UPDATE candidates
            SET name = ?, resume_text = ?, resume_file = ?
            WHERE email = ?
        """, (name, text, file.filename, email))
    else:
        cursor.execute("""
            INSERT INTO candidates (name, email, resume_text, resume_file)
            VALUES (?, ?, ?, ?)
        """, (name, email, text, file.filename))

    conn.commit()
    conn.close()

    # ✅ FIX: Restore original response format (for frontend)
    return jsonify({
        "message": "Resume analyzed successfully",
        "resume_text": text,
        "analysis": {
            "skills_found": skills,
            "experience_level": experience
        },
        "recommended_roles": recommended_roles,
        "matching_jobs": job_matches
    })


# ============================================================
# DOWNLOAD REPORT
# ============================================================

@resume_bp.route("/download-report", methods=["POST"])
@token_required
def download_report():

    try:
        user = request.user
        email = user.get("email")

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("SELECT name, resume_text FROM candidates WHERE email = ?", (email,))
        data = cursor.fetchone()

        conn.close()

        if not data:
            return jsonify({"error": "No resume found"}), 404

        name, resume_text = data

        # ✅ Fix: handle None name
        name = name if name else email.split("@")[0].capitalize()

        skills = extract_skills(resume_text)
        experience = classify_experience(resume_text)
        roles = recommend_roles(resume_text)

        file_name = f"{email}_report.pdf"
        file_path = os.path.join(UPLOAD_FOLDER, file_name)

        doc = SimpleDocTemplate(file_path)
        styles = getSampleStyleSheet()

        content = []

        content.append(Paragraph(f"Resume Report - {name}", styles["Title"]))
        content.append(Spacer(1, 12))

        content.append(Paragraph(f"Email: {email}", styles["Normal"]))
        content.append(Spacer(1, 12))

        content.append(Paragraph("Skills:", styles["Heading2"]))
        content.append(Paragraph(", ".join(skills) if skills else "None", styles["Normal"]))
        content.append(Spacer(1, 12))

        content.append(Paragraph("Experience Level:", styles["Heading2"]))
        content.append(Paragraph(experience, styles["Normal"]))
        content.append(Spacer(1, 12))

        content.append(Paragraph("Recommended Roles:", styles["Heading2"]))
        content.append(
            Paragraph(", ".join([r["role"] for r in roles]) if roles else "None", styles["Normal"])
        )

        doc.build(content)

        return jsonify({
            "download_url": f"http://127.0.0.1:5000/uploads/{file_name}"
        })

    except Exception as e:
        print("DOWNLOAD ERROR:", e)
        return jsonify({"error": "Server error"}), 500