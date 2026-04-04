import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css"; 

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await fetch("http://127.0.0.1:5000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ text: "Reset link sent! Please check your email inbox.", type: "success" });
      } else {
        setMessage({ text: data.error || "User not found.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Server connection failed.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Reset Password</h2>
        <p className="subtitle">Enter your email to receive a recovery link</p>
        
        <form onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="email"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {message.text && (
          <p className={`status-msg ${message.type === "error" ? "error-text" : "success-text"}`}>
            {message.text}
          </p>
        )}

        <p className="toggle-text" onClick={() => navigate("/")} style={{cursor: 'pointer', marginTop: '15px'}}>
          Back to Login
        </p>
      </div>
    </div>
  );
}