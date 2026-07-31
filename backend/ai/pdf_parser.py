import pdfplumber

def extract_resume_text(pdf_path):
    text = ""

    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + " "

    except Exception:
        return None

    text = text.strip()

    #  Reject empty or garbage files
    if len(text) < 50:
        return None

    return text