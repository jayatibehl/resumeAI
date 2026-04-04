from ai.embedding_engine import get_embedding, similarity_score

ROLE_DATABASE = {
    "Data Scientist":
        "Analyze data using Python, machine learning, statistics and SQL",

    "Machine Learning Engineer":
        "Develop machine learning systems using Python, deep learning and TensorFlow",

    "Backend Developer":
        "Develop APIs, databases and scalable backend services using Python",

    "Frontend Developer":
        "Build web interfaces using React, JavaScript and modern frontend tools"
}

def suggest_roles_from_resume(resume_text):

    resume_vector = get_embedding(resume_text)

    results = []

    for role, description in ROLE_DATABASE.items():

        role_vector = get_embedding(description)

        score = similarity_score(resume_vector, role_vector)

        results.append({
            "role": role,
            "match": round(score * 100, 2)
        })

    results = sorted(results, key=lambda x: x["match"], reverse=True)

    return results[:3]