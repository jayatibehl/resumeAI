from flask import Blueprint, request, jsonify
from ai.skill_gap_analyzer import analyze_skill_gap

skill_bp = Blueprint("skills", __name__, url_prefix="/api/skills")


@skill_bp.route("/gap", methods=["POST"])
def skill_gap():

    data = request.json

    resume_text = data.get("resume_text")
    job_description = data.get("job_description")

    if not resume_text or not job_description:
        return jsonify({"error": "Missing data"}), 400

    result = analyze_skill_gap(resume_text, job_description)

    return jsonify(result)