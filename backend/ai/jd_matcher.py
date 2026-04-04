import sqlite3
import os
from ai.embedding_engine import get_embedding, cosine_similarity
from ai.skill_extractor import extract_skills

# ------------------ 📂 PATH CONFIGURATION ------------------
# Isse ensure hoga ki database hamesha backend/database/ folder mein hi dhundha jaye
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "database", "resumeai.db")

# ------------------ GLOBAL CACHE ------------------
job_cache = None

def load_jobs():
    global job_cache

    if job_cache is None:
        # Check karein ki DB file exist karti bhi hai ya nahi
        if not os.path.exists(DB_PATH):
            print(f"❌ Error: Database file not found at {DB_PATH}")
            return []

        try:
            # ✅ CORRECT PATH USE KIYA HAI
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()

            cursor.execute("SELECT id, title, description FROM jobs")
            jobs = cursor.fetchall()
            conn.close()

            job_cache = []
            for job in jobs:
                job_id, title, description = job
                combined_text = f"{title} {description}"
                embedding = get_embedding(combined_text)

                job_cache.append({
                    "job_id": job_id,
                    "title": title,
                    "description": description,
                    "embedding": embedding
                })
        except sqlite3.OperationalError as e:
            print(f"❌ SQLite Error: {e}")
            return []

    return job_cache

# ------------------ SKILL BONUS ------------------
def skill_overlap_bonus(resume_skills, job_description):
    job_desc = job_description.lower()
    if not resume_skills:
        return 0
    
    overlap = sum(1 for skill in resume_skills if skill.lower() in job_desc)
    return (overlap / len(resume_skills)) * 0.2

# ------------------ MAIN FUNCTION ------------------
def match_resume_to_jobs(resume_text):
    # Step 1: Extract skills
    resume_skills = extract_skills(resume_text)

    # Step 2: Hybrid input
    resume_input = resume_text + " " + " ".join(resume_skills)

    # Step 3: Compute embedding
    resume_embedding = get_embedding(resume_input)

    # Step 4: Load jobs (cached)
    jobs = load_jobs()

    if not jobs:
        print("⚠️ No jobs found in database to match.")
        return []

    results = []
    for job in jobs:
        sim = cosine_similarity(resume_embedding, job["embedding"])
        bonus = skill_overlap_bonus(resume_skills, job["description"])
        
        # Calculate final score
        final_score = float(sim) + float(bonus)
        
        # Normalize score to 0-1 range and handle potential overflow
        final_score = max(0, min(1, (final_score + 1) / 2))

        results.append({
            "job_id": job["job_id"],
            "title": job["title"],
            "description": job["description"],
            "match_score": round(final_score * 100, 2)
        })

    # Step 5: Sort
    results = sorted(results, key=lambda x: x["match_score"], reverse=True)
    return results[:5]