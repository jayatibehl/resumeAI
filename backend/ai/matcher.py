from sentence_transformers import SentenceTransformer, util
import sqlite3

model = SentenceTransformer('all-MiniLM-L6-v2')
DB_PATH = "database/resumeai.db"

def match_resume_to_jobs(resume_text):

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT company, role, description FROM jobs")
    jobs = cursor.fetchall()

    conn.close()

    if not jobs:
        return []

    resume_embedding = model.encode(resume_text, convert_to_tensor=True)

    results = []

    for job in jobs:

        company, role, description = job

        jd_embedding = model.encode(description, convert_to_tensor=True)

        score = util.cos_sim(resume_embedding, jd_embedding).item()

        results.append({
            "company": company,
            "role": role,
            "match_score": round(score * 100, 2)
        })

    results.sort(key=lambda x: x["match_score"], reverse=True)

    return results