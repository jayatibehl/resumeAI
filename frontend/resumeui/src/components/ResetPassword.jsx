import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./Login.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:5000/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, new_password: newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        alert("Password updated successfully! Please login.");
        navigate("/");
      } else {
        alert(data.error || "Update failed.");
      }
    } catch (err) {
      alert("Server error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Set New Password</h2>
        <p className="subtitle">Resetting password for: <b>{email}</b></p>
        
        <form onSubmit={handleReset}>
          <input
            className="auth-input"
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}