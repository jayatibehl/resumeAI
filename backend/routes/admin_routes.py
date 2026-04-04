from flask import Blueprint, jsonify
import sqlite3

# 🔐 AUTH
from utils.auth_middleware import token_required, role_required

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


# ------------------ DATABASE ------------------

def get_db():
    conn = sqlite3.connect("database/resumeai.db")
    conn.row_factory = sqlite3.Row
    return conn


# ============================================================
# 👑 GET ALL USERS (ADMIN ONLY)
# ============================================================

@admin_bp.route("/users", methods=["GET"])
@token_required
@role_required("admin")
def get_users():
    conn = get_db()
    users = conn.execute(
        "SELECT id, name, email, role, is_banned FROM users"
    ).fetchall()
    conn.close()

    return jsonify([dict(u) for u in users])


# ============================================================
# 🗑 DELETE USER
# ============================================================

@admin_bp.route("/user/<int:id>", methods=["DELETE"])
@token_required
@role_required("admin")
def delete_user(id):
    conn = get_db()
    conn.execute("DELETE FROM users WHERE id=?", (id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "User deleted"})


# ============================================================
# 📄 GET ALL JOBS (✅ FIXED)
# ============================================================

@admin_bp.route("/jobs", methods=["GET"])
@token_required
@role_required("admin")
def get_jobs():
    conn = get_db()
    jobs = conn.execute(
        """
        SELECT id, title, description, recruiter_email
        FROM jobs
        WHERE is_banned = 0 OR is_banned IS NULL
        """
    ).fetchall()
    conn.close()

    return jsonify([dict(j) for j in jobs])


# ============================================================
# 🚫 GET BANNED JOBS (🔥 NEW)
# ============================================================

@admin_bp.route("/banned-jobs", methods=["GET"])
@token_required
@role_required("admin")
def get_banned_jobs():
    conn = get_db()
    jobs = conn.execute(
        """
        SELECT id, title, description, recruiter_email
        FROM jobs
        WHERE is_banned = 1
        """
    ).fetchall()
    conn.close()

    return jsonify([dict(j) for j in jobs])


# ============================================================
# 🚫 BAN / UNBAN JOB (🔥 NEW)
# ============================================================

@admin_bp.route("/toggle-job-ban/<int:id>", methods=["PUT"])
@token_required
@role_required("admin")
def toggle_job_ban(id):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT is_banned FROM jobs WHERE id=?", (id,))
    job = cursor.fetchone()

    if not job:
        conn.close()
        return jsonify({"error": "Job not found"}), 404

    new_status = 0 if job["is_banned"] else 1

    cursor.execute(
        "UPDATE jobs SET is_banned=? WHERE id=?",
        (new_status, id)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Job status updated",
        "is_banned": new_status
    })


# ============================================================
# 🗑 DELETE JOB
# ============================================================

@admin_bp.route("/job/<int:id>", methods=["DELETE"])
@token_required
@role_required("admin")
def delete_job(id):
    conn = get_db()
    conn.execute("DELETE FROM jobs WHERE id=?", (id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Job deleted"})


# ============================================================
# 📊 ADMIN STATS
# ============================================================

@admin_bp.route("/stats", methods=["GET"])
@token_required
@role_required("admin")
def get_stats():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM users")
    total_users = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM jobs WHERE is_banned = 0 OR is_banned IS NULL")
    total_jobs = cursor.fetchone()[0]

    cursor.execute("SELECT role, COUNT(*) FROM users GROUP BY role")
    roles = cursor.fetchall()

    role_data = {r[0]: r[1] for r in roles}

    conn.close()

    return jsonify({
        "total_users": total_users,
        "total_jobs": total_jobs,
        "roles": role_data
    })


# ============================================================
# 🚫 BAN / UNBAN USER
# ============================================================

@admin_bp.route("/toggle-ban/<int:id>", methods=["PUT"])
@token_required
@role_required("admin")
def toggle_ban(id):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT is_banned FROM users WHERE id=?", (id,))
    user = cursor.fetchone()

    if not user:
        conn.close()
        return jsonify({"error": "User not found"}), 404

    new_status = 0 if user["is_banned"] else 1

    cursor.execute(
        "UPDATE users SET is_banned=? WHERE id=?",
        (new_status, id)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "message": "User status updated",
        "is_banned": new_status
    })