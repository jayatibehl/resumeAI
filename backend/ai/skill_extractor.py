import os
import re
import spacy
from sentence_transformers import SentenceTransformer, util

# -----------------------------
# LOAD MODELS
# -----------------------------
nlp = spacy.load("en_core_web_sm")
model = SentenceTransformer("all-MiniLM-L6-v2")

# -----------------------------
# LOAD SKILL DATASET
# -----------------------------
DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/skills_dataset.txt")

with open(DATA_PATH, "r", encoding="utf-8") as f:
    SKILLS = [line.strip().lower() for line in f.readlines() if line.strip()]

# Precompute embeddings
skill_embeddings = model.encode(SKILLS, convert_to_tensor=True)


# -----------------------------
# FILTER INVALID SKILLS
# -----------------------------
def is_valid_skill(skill, text):
    skill = skill.lower()
    text = text.lower()

    if len(skill) == 1 and skill != "c":
        return False

    if skill in ["go", "r"]:
        pattern = r'\b' + re.escape(skill) + r'\b'
        return re.search(pattern, text) is not None

    return True


# -----------------------------
# LIST-BASED EXTRACTION
# -----------------------------
def extract_list_based_skills(text):

    text = text.lower()
    skills = set()

    lines = text.split("\n")

    for line in lines:

        if ":" in line:
            parts = line.split(":", 1)

            if len(parts) > 1:
                right_part = parts[1]

                items = right_part.split(",")

                for item in items:
                    skill = item.strip()

                    if len(skill) > 1:
                        skills.add(skill)

    return list(skills)


# -----------------------------
# NLP PHRASE EXTRACTION
# -----------------------------
def extract_candidate_phrases(text):

    doc = nlp(text)
    phrases = set()

    for chunk in doc.noun_chunks:

        phrase = chunk.text.lower().strip()

        if len(phrase) < 3:
            continue

        if len(phrase) > 40:
            continue

        phrases.add(phrase)

    return list(phrases)


# -----------------------------
# SEMANTIC MATCHING
# -----------------------------
def match_skills_semantically(phrases):

    if not phrases:
        return []

    phrase_embeddings = model.encode(phrases, convert_to_tensor=True)

    detected_skills = set()

    for i, phrase_emb in enumerate(phrase_embeddings):

        scores = util.cos_sim(phrase_emb, skill_embeddings)[0]
        best_idx = scores.argmax()

        # threshold relaxed from 0.60 → 0.55
        if scores[best_idx] > 0.55:
            detected_skills.add(SKILLS[best_idx])

    return list(detected_skills)


# -----------------------------
# MAIN FUNCTION
# -----------------------------
def extract_skills(resume_text):

    text = resume_text.lower()
    detected_skills = set()

    # STEP 1 — DIRECT MATCH (FIXED)
    for skill in SKILLS:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text):
            detected_skills.add(skill)

    # STEP 2 — LIST EXTRACTION
    list_skills = extract_list_based_skills(resume_text)

    for skill in list_skills:
        if skill in SKILLS:
            detected_skills.add(skill)

    # STEP 3 — NLP + SEMANTIC MATCHING
    phrases = extract_candidate_phrases(resume_text)
    semantic_skills = match_skills_semantically(phrases)

    for skill in semantic_skills:
        detected_skills.add(skill)

    # STEP 4 — FINAL CLEANING
    cleaned = []

    for skill in detected_skills:
        if is_valid_skill(skill, resume_text):
            cleaned.append(skill)

    return cleaned