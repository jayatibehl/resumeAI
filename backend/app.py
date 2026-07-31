from flask import Flask, send_from_directory
from flask_cors import CORS
import os

# Import blueprints
from routes.auth_routes import auth_bp
from routes.resume_routes import resume_bp
from routes.job_routes import job_bp
from routes.skill_routes import skill_bp
from routes.admin_routes import admin_bp
from dotenv import load_dotenv
from flask_mail import Mail

load_dotenv()

app = Flask(__name__)

# ---------------------------
# CONFIG
# ---------------------------

app.config["UPLOAD_FOLDER"] = "uploads"

# ---------------------------
# MAIL CONFIG (ADDED)
# ---------------------------

app.config["MAIL_SERVER"] = "smtp.gmail.com"
app.config["MAIL_PORT"] = 587
app.config["MAIL_USE_TLS"] = True
app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")

mail = Mail(app)

# Enable CORS (allow frontend requests)
CORS(app, supports_credentials=True)

# Ensure uploads folder exists
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)


# ---------------------------
# REGISTER ROUTES
# ---------------------------

app.register_blueprint(auth_bp)
app.register_blueprint(resume_bp)
app.register_blueprint(job_bp)
app.register_blueprint(skill_bp)
app.register_blueprint(admin_bp)


# ---------------------------
# FILE DOWNLOAD (PDF + RESUMES)
# ---------------------------

@app.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


# ---------------------------
# HEALTH CHECK
# ---------------------------

@app.route("/")
def home():
    return {"message": "ResumeAI Backend Running"}


# ---------------------------
# RUN SERVER
# ---------------------------

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)