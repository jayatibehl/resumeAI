import re

# Global variable for the model
_model = None

def get_model():
    """Lazy loads the model and library only when needed."""
    global _model
    if _model is None:
        try:
            # 🚀 Local import taaki editor analysis ke waqt hang na ho
            from sentence_transformers import SentenceTransformer
            print("--- Initializing AI Model (Please wait...) ---")
            _model = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception as e:
            print(f"Model Loading Error: {e}")
            return None
    return _model

def has_resume_structure(text):
    """Fast Regex check for common resume headers."""
    text_lower = text.lower()
    # Word boundaries (\b) are used for exact matching
    patterns = [r'\beducation\b', r'\bexperience\b', r'\bskills\b', r'\bprojects\b']
    hits = sum(1 for p in patterns if re.search(p, text_lower))
    return hits >= 2

def is_resume(text):
    if not text or len(text.strip()) < 200:
        return False

    # 1. Sabse pehle simple structure check karein (Sabse Fast)
    if has_resume_structure(text):
        return True

    # 2. Agar structure clear nahi hai, tabhi AI use karein
    model = get_model()
    if model:
        try:
            from sentence_transformers import util
            ref_text = "Professional resume with work experience and education."
            ref_emb = model.encode(ref_text, convert_to_tensor=True)
            text_emb = model.encode(text[:1500], convert_to_tensor=True)
            
            score = float(util.cos_sim(text_emb, ref_emb)[0][0])
            print(f"AI Score: {score:.4f}")
            return score > 0.30
        except Exception as e:
            print(f"AI Analysis Error: {e}")
            return False
    
    return False