from ai.skill_extractor import extract_skills
from ai.embedding_engine import get_embedding, cosine_similarity


# ------------------ NORMALIZE ------------------

def normalize(skill):
    return skill.lower().strip()


# ------------------ EXPERIENCE GAP ------------------

def detect_experience_gap(resume_text, job_description):
    resume_text = resume_text.lower()
    job_description = job_description.lower()

    gap = []

    # internship requirement
    if "internship" in job_description and "intern" not in resume_text:
        gap.append("internship experience")

    # general experience requirement
    if "experience" in job_description and "experience" not in resume_text:
        gap.append("relevant work experience")

    return gap


# ------------------ MATCH CHECK ------------------

def is_skill_matched(job_skill, resume_skills, resume_text, threshold=0.6):

    job_skill = normalize(job_skill)
    resume_text = resume_text.lower()

    # direct text match
    if job_skill in resume_text:
        return True

    # exact extracted match
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
        pass

    return False


# ------------------ MAIN FUNCTION ------------------

def analyze_skill_gap(resume_text, job_description):

    # extract resume skills
    resume_skills_raw = extract_skills(resume_text)

    if not resume_skills_raw:
        resume_skills_raw = resume_text.split()

    resume_skills = list(set([
        normalize(s) for s in resume_skills_raw if len(s) > 2
    ]))


    # extract job skills
    job_skills_raw = extract_skills(job_description)

    if not job_skills_raw:
        job_skills_raw = job_description.split()

    job_skills = list(set([
        normalize(s) for s in job_skills_raw if len(s) > 2
    ]))


    matched = []
    missing = []

    # compare job → resume
    for job_skill in job_skills:

        if is_skill_matched(job_skill, resume_skills, resume_text):
            matched.append(job_skill)
        else:
            missing.append(job_skill)


    # add experience-based gaps
    experience_gap = detect_experience_gap(resume_text, job_description)

    for gap in experience_gap:
        if gap not in missing:
            missing.append(gap)


    # match percentage
    total_required = len(job_skills) + len(experience_gap)

    if total_required == 0:
        match_score = 0
    else:
        match_score = (len(matched) / total_required) * 100


    # debug logs
    print("\n--- SKILL GAP DEBUG ---")
    print("Resume skills:", resume_skills[:20])
    print("Job skills:", job_skills[:20])
    print("Matched:", matched)
    print("Missing:", missing)
    print("Experience gap:", experience_gap)
    print("------------------------\n")


    return {
        "match_score": round(match_score, 2),
        "matched_skills": matched,
        "missing_skills": missing,
        "resume_skills": resume_skills,
        "required_skills": job_skills
    }