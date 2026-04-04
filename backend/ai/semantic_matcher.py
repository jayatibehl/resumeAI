import pandas as pd
import os

from ai.embedding_engine import get_embedding, cosine_similarity
from ai.skill_extractor import extract_skills

# ------------------ LOAD DATA ------------------

DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/job_roles.csv")
jobs_df = pd.read_csv(DATA_PATH)

# ------------------ GLOBAL CACHE ------------------

job_embeddings = None


def load_job_embeddings():
    global job_embeddings

    if job_embeddings is None:
        job_embeddings = []

        for _, row in jobs_df.iterrows():
            # 🔥 Combine role + description (better semantic context)
            combined_text = f"{row['role']} {row['description']}"
            emb = get_embedding(combined_text)
            job_embeddings.append(emb)

    return job_embeddings


# ------------------ CLEANING ------------------

def clean_resume_text(text):
    text = text.lower()

    stopwords = [
        "education",
        "project",
        "projects",
        "experience",
        "skills",
        "profile",
        "summary",
        "objective",
        "activities",
        "achievements"
    ]

    for word in stopwords:
        text = text.replace(word, "")

    return text


# ------------------ SKILL BONUS ------------------

def skill_overlap_bonus(resume_skills, role_description):
    role_desc = role_description.lower()

    overlap = sum(1 for skill in resume_skills if skill in role_desc)

    if len(resume_skills) == 0:
        return 0

    # 🔥 normalized + stronger weight
    return (overlap / len(resume_skills)) * 0.15


# ------------------ MAIN FUNCTION ------------------

def recommend_roles(resume_text):

    # Step 1: Clean resume
    resume_text = clean_resume_text(resume_text)

    # Step 2: Extract skills
    resume_skills = extract_skills(resume_text)

    # Step 3: Hybrid input (text + skills)
    resume_input = resume_text + " " + " ".join(resume_skills)

    # Step 4: Get embedding
    resume_embedding = get_embedding(resume_input)

    # Step 5: Load job embeddings (cached)
    job_embeddings = load_job_embeddings()

    scores = []

    # Step 6: Compare with each job
    for i, job_vec in enumerate(job_embeddings):

        sim = cosine_similarity(resume_embedding, job_vec)

        role_description = jobs_df.iloc[i]["description"]

        bonus = skill_overlap_bonus(resume_skills, role_description)

        final_score = float(sim) + float(bonus)

        # 🔥 Normalize from [-1,1] → [0,1]
        final_score = (final_score + 1) / 2

        scores.append({
            "role": jobs_df.iloc[i]["role"],
            "score": round(final_score * 100, 2)
        })

    # Step 7: Sort by score
    scores = sorted(scores, key=lambda x: x["score"], reverse=True)

    # Step 8: Remove duplicates + top 5
    seen = set()
    unique_scores = []

    for item in scores:
        role = item["role"]

        if role not in seen:
            seen.add(role)
            unique_scores.append(item)

        if len(unique_scores) == 5:
            break

    return unique_scores