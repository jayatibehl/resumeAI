from sentence_transformers import SentenceTransformer
import numpy as np

_model = None


def get_model():
    global _model
    if _model is None:
        print("Loading SentenceTransformer model...")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def get_embedding(text):
    model = get_model()
    return model.encode(text)


def cosine_similarity(vec1, vec2):
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)

    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))