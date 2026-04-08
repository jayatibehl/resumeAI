from sentence_transformers import SentenceTransformer, util

# Load model
model = SentenceTransformer("all-MiniLM-L6-v2")

# ------------------ CLEAN FUNCTION ------------------

def clean_resume(text):
    text_lower = text.lower()

    # Remove career objective section
    if "career objective" in text_lower:
        parts = text_lower.split("career objective")
        if len(parts) > 1:
            text_lower = parts[-1]

    return text_lower


# ------------------ LABELS ------------------

experience_labels = {
    "Fresher": [
        "student with no work experience",
        "entry level candidate looking for opportunity",
        "seeking internship or job opportunity",
        "btech student with academic projects only"
    ],
    "Internship": [
        "worked as an intern in a company",
        "completed internship with real project work",
        "internship experience building applications",
        "software developer intern experience"
    ],
    "Experienced": [
        "worked as software engineer in company",
        "professional developer with industry experience",
        "2 years experience in software development job",
        "full time job experience in tech company"
    ]
}

# Precompute embeddings
label_embeddings = {
    label: model.encode(sentences, convert_to_tensor=True)
    for label, sentences in experience_labels.items()
}


# ------------------ MAIN FUNCTION ------------------

def classify_experience(text):

    text_clean = clean_resume(text)
    text_lower = text_clean.lower()

    text_embedding = model.encode(text_clean, convert_to_tensor=True)

    best_label = "Fresher"
    best_score = 0

    for label, embeddings in label_embeddings.items():
        scores = util.cos_sim(text_embedding, embeddings)
        max_score = scores.max().item()

        if max_score > best_score:
            best_score = max_score
            best_label = label

    # ------------------ CONTEXT GUARDRAILS ------------------

    # detect real work signals
    has_work_words = any(word in text_lower for word in [
        "worked", "developed", "built", "implemented", "designed",
        "created", "engineered", "deployed"
    ])

    # detect intent phrases (fake experience signals)
    has_intent = any(phrase in text_lower for phrase in [
        "seeking internship",
        "looking for internship",
        "looking for opportunity",
        "seeking opportunity",
        "open to work"
    ])

    # correction logic
    if best_label == "Internship" and has_intent and not has_work_words:
        return "Fresher"

    return best_label