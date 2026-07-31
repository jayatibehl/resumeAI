from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import jwt
import os
import re
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv
import uuid
from datetime import datetime, timedelta

load_dotenv()

auth_bp = Blueprint("auth", __name__, url_prefix="/api")

SECRET_KEY = "your_secret_key"

# ------------------ DATABASE PATH ------------------

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "database", "resumeai.db")


def get_db():
    print("USING DB:", DB_PATH)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ------------------ EMAIL VALIDATION ------------------

def is_valid_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email)


# ============================================================
# REGISTER
# ============================================================

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.json

        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role')

        if not name or not email or not password or not role:
            return jsonify({"error": "Missing required fields"}), 400

        if not is_valid_email(email):
            return jsonify({"error": "Invalid email format"}), 400

        if role == "admin":
            return jsonify({"error": "Cannot register as admin"}), 403

        hashed_password = generate_password_hash(password)

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            (name, email, hashed_password, role)
        )

        conn.commit()
        conn.close()

        return jsonify({"message": "User registered successfully"})

    except sqlite3.IntegrityError:
        return jsonify({"error": "User already exists"}), 400

    except Exception as e:
        print("REGISTER ERROR:", e)
        return jsonify({"error": "Server error"}), 500


# ============================================================
# LOGIN
# ============================================================

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.json

        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"error": "Missing email or password"}), 400

        if not is_valid_email(email):
            return jsonify({"error": "Invalid email format"}), 400

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        conn.close()

        if not user:
            return jsonify({"error": "User not registered"}), 404

        if user["is_banned"] == 1:
            return jsonify({"error": "Your account has been banned"}), 403

        stored_password = user["password"]

        # 🔥 FIXED PASSWORD CHECK (ONLY CHANGE)
        valid = check_password_hash(stored_password, password)

        if not valid:
            return jsonify({"error": "Incorrect password"}), 401

        token = jwt.encode({
            "user_id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "exp": datetime.utcnow() + timedelta(hours=5)
        }, SECRET_KEY, algorithm="HS256")

        return jsonify({
            "token": token,
            "role": user["role"],
            "name": user["name"],
            "email": user["email"]
        })

    except Exception as e:
        print("LOGIN ERROR:", e)
        return jsonify({"error": "Server error"}), 500


# ============================================================
# CHANGE PASSWORD
# ============================================================

@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    try:
        token = request.headers.get("Authorization")

        if not token:
            return jsonify({"error": "Token missing"}), 401

        token = token.split(" ")[1]

        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        email = decoded.get("email")

        data = request.json
        new_password = data.get("password")

        if not new_password:
            return jsonify({"error": "Password required"}), 400

        hashed_password = generate_password_hash(new_password)

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            "UPDATE users SET password = ? WHERE email = ?",
            (hashed_password, email)
        )

        conn.commit()
        conn.close()

        return jsonify({"message": "Password updated successfully"})

    except Exception as e:
        print("CHANGE PASSWORD ERROR:", e)
        return jsonify({"error": "Server error"}), 500


# ============================================================
# FORGOT PASSWORD
# ============================================================

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.json
        email = data.get("email")

        if not email or not is_valid_email(email):
            return jsonify({"error": "Invalid email"}), 400

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()

        if not user:
            conn.close()
            return jsonify({"error": "Email not registered"}), 404

        token = str(uuid.uuid4())
        expiry = (datetime.utcnow() + timedelta(minutes=15)).isoformat()

        cursor.execute(
            "UPDATE users SET reset_token=?, reset_token_expiry=? WHERE email=?",
            (token, expiry, email)
        )

        conn.commit()
        conn.close()

        reset_link = f"http://localhost:3000/reset-password/{token}"

        sender_email = os.getenv("MAIL_USERNAME")
        sender_password = os.getenv("MAIL_PASSWORD")

        msg = MIMEText(f"Reset link: {reset_link}")
        msg['Subject'] = "Reset Password"
        msg['From'] = sender_email
        msg['To'] = email

        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        return jsonify({"message": "Reset link sent to your email"})

    except Exception as e:
        print("EMAIL ERROR:", e)
        return jsonify({"error": "Failed to send email"}), 500


# ============================================================
# RESET PASSWORD
# ============================================================

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.json
        token = data.get("token")
        password = data.get("password")

        if not token or not password:
            return jsonify({"error": "Missing fields"}), 400

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT reset_token_expiry FROM users WHERE TRIM(reset_token)=?",
            (token.strip(),)
        )
        user = cursor.fetchone()

        if not user:
            conn.close()
            return jsonify({"error": "Invalid token"}), 400

        expiry = datetime.fromisoformat(user["reset_token_expiry"])

        if datetime.utcnow() > expiry:
            conn.close()
            return jsonify({"error": "Token expired"}), 400

        hashed_password = generate_password_hash(password)

        cursor.execute(
            "UPDATE users SET password=?, reset_token=NULL, reset_token_expiry=NULL WHERE reset_token=?",
            (hashed_password, token)
        )

        conn.commit()
        conn.close()

        return jsonify({"message": "Password updated successfully"})

    except Exception as e:
        print("RESET ERROR:", e)
        return jsonify({"error": "Server error"}), 500