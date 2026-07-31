import sqlite3

from ai.embedding_engine import get_embedding, cosine_similarity
from ai.skill_extractor import extract_skills


def load_jobs():
    conn = sqlite3.connect("database/resumeai.db")
    cursor = conn.cursor()

    # ✅ only non-banned jobs
    cursor.execute("SELECT id, title, description FROM jobs WHERE is_banned = 0")
    jobs = cursor.fetchall()

    conn.close()

    job_list = []

    for job in jobs:
        job_id, title, description = job

        combined_text = f"{title} {description}"
        embedding = get_embedding(combined_text)

        job_list.append({
            "job_id": job_id,
            "title": title,
            "description": description,
            "embedding": embedding
        })

    return job_list


def skill_overlap(resume_skills, job_description):
    job_desc = job_description.lower()
    return sum(1 for skill in resume_skills if skill in job_desc)


def match_resume_to_jobs(resume_text):

    resume_skills = extract_skills(resume_text)

    resume_input = resume_text + " " + " ".join(resume_skills)
    resume_embedding = get_embedding(resume_input)

    jobs = load_jobs()

    results = []

    for job in jobs:

        overlap = skill_overlap(resume_skills, job["description"])

        if overlap == 0:
            continue

        sim = float(cosine_similarity(resume_embedding, job["embedding"]))

        ratio = overlap / len(resume_skills) if len(resume_skills) > 0 else 0

        final_score = (0.7 * sim) + (0.3 * ratio)
        final_score = (final_score + 1) / 2

        if final_score < 0.35:
            continue

        results.append({
            "job_id": job["job_id"],
            "title": job["title"],
            "description": job["description"],
            "match_score": float(round(final_score * 100, 2))
        })

    results = sorted(results, key=lambda x: x["match_score"], reverse=True)

    return results[:5]


def match_resume_to_single_job(resume_text, job_description):

    if not resume_text or not job_description:
        return 0

    try:
        resume_skills = extract_skills(resume_text)

        overlap = skill_overlap(resume_skills, job_description)

        if overlap == 0:
            return 0

        resume_input = resume_text + " " + " ".join(resume_skills)

        resume_embedding = get_embedding(resume_input)
        job_embedding = get_embedding(job_description)

        sim = float(cosine_similarity(resume_embedding, job_embedding))

        ratio = overlap / len(resume_skills) if len(resume_skills) > 0 else 0

        final_score = (0.7 * sim) + (0.3 * ratio)
        final_score = (final_score + 1) / 2

        return float(round(final_score * 100, 2))

    except:
        return 0