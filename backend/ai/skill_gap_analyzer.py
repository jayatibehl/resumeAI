from ai.skill_extractor import extract_skills
from ai.embedding_engine import get_embedding, cosine_similarity


# ------------------ NORMALIZE ------------------

def normalize(skill):
    return skill.lower().strip()


# ------------------ MATCH CHECK ------------------

def is_skill_matched(job_skill, resume_skills, resume_text, threshold=0.6):

    job_skill = normalize(job_skill)
    resume_text = resume_text.lower()

    # ✅ 1. Direct text match (VERY IMPORTANT FIX)
    if job_skill in resume_text:
        return True

    # ✅ 2. Exact extracted match
    if job_skill in resume_skills:
        return True

    try:
        job_vec = get_embedding(job_skill)

        for skill in resume_skills:
            skill_vec = get_embedding(skill)

            score = cosine_similarity(job_vec, skill_vec)

            if score >= threshold:
                return True

    except:
        # fallback if embedding fails
        pass

    return False


# ------------------ MAIN FUNCTION ------------------

def analyze_skill_gap(resume_text, job_description):

    # 🔥 STEP 1: Extract resume skills
    resume_skills_raw = extract_skills(resume_text)

    if not resume_skills_raw:
        resume_skills_raw = resume_text.split()

    resume_skills = list(set([
        normalize(s) for s in resume_skills_raw if len(s) > 2
    ]))


    # 🔥 STEP 2: Extract job skills
    job_skills_raw = extract_skills(job_description)

    if not job_skills_raw:
        job_skills_raw = job_description.split()

    job_skills = list(set([
        normalize(s) for s in job_skills_raw if len(s) > 2
    ]))


    matched = []
    missing = []

    # 🔥 STEP 3: Compare job → resume
    for job_skill in job_skills:

        if is_skill_matched(job_skill, resume_skills, resume_text):
            matched.append(job_skill)
        else:
            missing.append(job_skill)


    # 🔥 STEP 4: Match %
    if len(job_skills) == 0:
        match_score = 0
    else:
        match_score = (len(matched) / len(job_skills)) * 100


    # 🔥 DEBUG
    print("\n--- SKILL GAP DEBUG ---")
    print("Resume skills:", resume_skills[:20])
    print("Job skills:", job_skills[:20])
    print("Matched:", matched)
    print("Missing:", missing)
    print("------------------------\n")


    # 🔥 STEP 5: Return structured result
    return {
        "match_score": round(match_score, 2),
        "matched_skills": matched,
        "missing_skills": missing,
        "resume_skills": resume_skills,
        "required_skills": job_skills
    }