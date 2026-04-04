from flask import Flask, send_from_directory, make_response, request
from flask_cors import CORS
from flask_mail import Mail
import os
import sqlite3

# 1. Sabhi Blueprints import karein
from routes.auth_routes import auth_bp
from routes.resume_routes import resume_bp 
from routes.job_routes import job_bp
from routes.skill_routes import skill_bp

app = Flask(__name__)

# --- 📂 Central Path Configuration ---
# Isse database hamesha backend folder ke andar 'database' folder mein hi dhundha jayega
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database", "resumeai.db")
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

app.config['SECRET_KEY'] = 'super-secret-resume-ai-key-2026-secure'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# 📧 Flask-Mail Configuration
app.config.update(
    MAIL_SERVER='smtp.gmail.com',
    MAIL_PORT=587,
    MAIL_USE_TLS=True,
    MAIL_USERNAME='divyanshir84@gmail.com',
    MAIL_PASSWORD='oieazpmdiwhmpuoa',
    MAIL_DEFAULT_SENDER='divyanshir84@gmail.com'
)

mail = Mail(app)

# --- 🚀 CORS Fix ---
CORS(app, resources={r"/api/*": {"origins": "*"}}, 
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "OPTIONS"])

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        res = make_response()
        res.headers.add("Access-Control-Allow-Origin", "*")
        res.headers.add("Access-Control-Allow-Headers", "*")
        res.headers.add("Access-Control-Allow-Methods", "*")
        return res

# Ensure folders exist
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# --- 2. Blueprints Register ---
# Note: Ensure your blueprints use the global DB_PATH if they connect to DB
app.register_blueprint(auth_bp) 
app.register_blueprint(resume_bp)
app.register_blueprint(job_bp)
app.register_blueprint(skill_bp)

@app.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route("/")
def home():
    return {
        "status": "online",
        "message": "ResumeAI Backend Running",
        "database_connected": os.path.exists(DB_PATH)
    }

if __name__ == "__main__":
    # Check if DB exists before starting
    if not os.path.exists(DB_PATH):
        print(f"⚠️ WARNING: Database not found at {DB_PATH}. Run init_db.py first!")
    
    app.run(host="127.0.0.1", port=5000, debug=True)