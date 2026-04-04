from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mail import Message
import sqlite3
import jwt
import datetime
import re

auth_bp = Blueprint("auth", __name__, url_prefix="/api")

DB_PATH = "database/resumeai.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ✅ Feature: Strict Email and Phone Validation
def is_valid_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email)

def is_valid_phone(phone):
    # Validates 10-digit Indian numbers starting with 6-9
    pattern = r'^[6-9]\d{9}$'
    return re.match(pattern, phone)

def is_password_strong(password):
    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password): 
        return False
    if not re.search(r"\d", password):    
        return False
    if not re.search(r"[@$!%*?&]", password): 
        return False
    return True

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email', '').strip()
        phone = data.get('phone', '').strip()
        password = data.get('password')
        role = data.get('role', 'candidate')

        # 🛑 Validation Checks
        if not is_valid_email(email):
            return jsonify({"error": "Invalid email format"}), 400
        
        if not is_valid_phone(phone):
            return jsonify({"error": "Invalid 10-digit phone number"}), 400

        if not is_password_strong(password):
            return jsonify({"error": "Password must be 8+ chars with uppercase, number, and symbol."}), 400

        hashed_pw = generate_password_hash(password)
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)",
            (name, email, phone, hashed_pw, role)
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "Registered successfully"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Email or Phone already registered"}), 409
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        # Front-end se 'identifier' ya 'email' dono handle karega
        identifier = (data.get('identifier') or data.get('email', '')).strip()
        password = data.get('password')

        conn = get_db()
        cursor = conn.cursor()
        # Email aur Phone dono par search karega
        cursor.execute("SELECT * FROM users WHERE email = ? OR phone = ?", (identifier, identifier))
        row = cursor.fetchone()
        conn.close()

        if row:
            user = dict(row)
            # 🔑 Hashing check matches 'generate_password_hash'
            if check_password_hash(user['password'], password):
                token = jwt.encode({
                    'user_id': user['id'],
                    'role': user['role'],
                    'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
                }, current_app.config['SECRET_KEY'], algorithm="HS256")

                return jsonify({
                    "token": token,
                    "role": user['role'],
                    "name": user['name'],
                    "email": user['email']
                }), 200

        return jsonify({"error": "Invalid email/phone or password"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email', '').strip()
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "No account found with this email"}), 404

    try:
        from app import mail 
        msg = Message("Reset Your Password - ResumeAI", recipients=[email])
        reset_link = f"http://localhost:3000/reset-password?email={email}"
        msg.body = f"Hi {user['name']},\n\nClick the link below to reset your password:\n{reset_link}"
        mail.send(msg)
        return jsonify({"message": "Reset link sent to your email!"}), 200
    except Exception as e:
        return jsonify({"error": "Mail failed. Check server logs."}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        email = data.get('email', '').strip()
        new_password = data.get('new_password')

        if not is_password_strong(new_password):
            return jsonify({"error": "New password is too weak."}), 400

        hashed_pw = generate_password_hash(new_password)
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET password = ? WHERE email = ?", (hashed_pw, email))
        conn.commit()
        conn.close()
        return jsonify({"message": "Password updated successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500