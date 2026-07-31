import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      // ✅ Show proper message
      if (res.ok) {
        setMessage("Check your mail for reset password link");
      } else {
        setMessage(data.error || "Something went wrong");
      }

    } catch (err) {
      setMessage("Server error. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Forgot Password</h2>
        <p>Enter your registered email to reset password</p>

        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <button className="primary-btn" onClick={handleSubmit}>
          Submit
        </button>

        {/* ✅ Show message on UI instead of alert */}
        {message && (
          <p style={{ marginTop: "10px", color: "#4CAF50" }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}