from functools import wraps
from flask import request, jsonify
import jwt

SECRET_KEY = "your_secret_key"

# 🔐 Verify token
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Get token from header
        if "Authorization" in request.headers:
            token = request.headers["Authorization"].split(" ")[1]

        if not token:
            return jsonify({"error": "Token missing"}), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            request.user = data  # store user data
        except:
            return jsonify({"error": "Invalid or expired token"}), 401

        return f(*args, **kwargs)

    return decorated


# 👑 Role-based access
def role_required(required_role):
    def wrapper(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = getattr(request, "user", None)

            if not user or user.get("role") != required_role:
                return jsonify({"error": "Unauthorized access"}), 403

            return f(*args, **kwargs)

        return decorated
    return wrapper