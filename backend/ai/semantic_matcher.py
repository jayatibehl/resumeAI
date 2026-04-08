import pandas as pd
import os
import re

from ai.embedding_engine import get_embedding, cosine_similarity
from ai.skill_extractor import extract_skills

# ------------------ LOAD CSV ------------------

DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/job_roles.csv")
jobs_df = pd.read_csv(DATA_PATH)


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
        text = re.sub(rf"\b{word}\b", "", text)

    return text


# ------------------ SKILL MATCH ------------------

def skill_overlap(resume_skills, role_description):
    role_desc = role_description.lower()
    return sum(1 for skill in resume_skills if skill in role_desc)


# ------------------ MAIN FUNCTION ------------------

def recommend_roles(resume_text):

    # clean resume
    resume_text = clean_resume_text(resume_text)

    # extract skills
    resume_skills = extract_skills(resume_text)

    # prepare embedding input
    resume_input = resume_text + " " + " ".join(resume_skills)
    resume_embedding = get_embedding(resume_input)

    scores = []

    for _, row in jobs_df.iterrows():

        role = row["role"]
        description = row["description"]

        overlap = skill_overlap(resume_skills, description)

        # strict filter
        if overlap == 0:
            continue

        job_text = f"{role} {description}"
        job_embedding = get_embedding(job_text)

        sim = float(cosine_similarity(resume_embedding, job_embedding))

        ratio = overlap / len(resume_skills) if len(resume_skills) > 0 else 0

        final_score = (0.7 * sim) + (0.3 * ratio)
        final_score = (final_score + 1) / 2

        if final_score < 0.35:
            continue

        scores.append({
            "role": role,
            "score": float(round(final_score * 100, 2))
        })

    scores = sorted(scores, key=lambda x: x["score"], reverse=True)

    return scores[:5]