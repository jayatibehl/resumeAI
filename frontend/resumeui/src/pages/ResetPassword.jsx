import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../components/Login.css";

export default function ResetPassword() {

  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // detect flow
  const isResetFlow = !!token;

  // password rules
  const rules = {
    min: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };

  const handleReset = async () => {

    if (!Object.values(rules).every(Boolean)) {
      alert("Password does not meet requirements");
      return;
    }

    try {

      let res;

      // 🔥 FORGOT PASSWORD FLOW
      if (isResetFlow) {
        res = await fetch("http://127.0.0.1:5000/api/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ token, password })
        });
      }

      // 🔥 PROFILE CHANGE PASSWORD FLOW
      else {
        res = await fetch("http://127.0.0.1:5000/api/change-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({ password })
        });
      }

      const data = await res.json();

      if (data.message) {
        alert("Password updated successfully");

        // ✅ FIXED REDIRECT
        if (isResetFlow) {
          navigate("/"); // login page
        } else {
          navigate("/candidate"); // dashboard
        }

      } else {
        alert(data.error || "Something went wrong");
      }

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <div className="auth-container">

      <div className="auth-card">

        <h2>{isResetFlow ? "Reset Password" : "Change Password"}</h2>

        <p className="subtitle">
          {isResetFlow
            ? "Enter your new password"
            : "Update your account password"}
        </p>

        {/* Password Input */}
        <div style={{ position: "relative" }}>

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <span
            style={{
              position: "absolute",
              right: "15px",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer"
            }}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 3L21 21" stroke="#aaa" strokeWidth="2"/>
                <path d="M10.5 10.5A3 3 0 0013.5 13.5" stroke="#aaa" strokeWidth="2"/>
                <path d="M9.88 5.08A10.94 10.94 0 0112 5C17 5 21 12 21 12c-.58 1.07-1.3 2.06-2.14 2.94M6.1 6.1C3.6 7.9 2 12 2 12s4 7 10 7c1.61 0 3.09-.36 4.4-1" stroke="#aaa" strokeWidth="2"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#aaa" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" stroke="#aaa" strokeWidth="2"/>
              </svg>
            )}
          </span>

        </div>

        {/* Password Rules */}
        <div className="password-rules">
          <span className={rules.min ? "valid" : ""}>Min 8</span>
          <span className={rules.upper ? "valid" : ""}>Uppercase</span>
          <span className={rules.number ? "valid" : ""}>Number</span>
          <span className={rules.special ? "valid" : ""}>Special</span>
        </div>

        {/* Button */}
        <button className="primary-btn" onClick={handleReset}>
          {isResetFlow ? "Reset Password" : "Update Password"}
        </button>

        {/* Back */}
        <div className="toggle-text">
          {isResetFlow
            ? "Remember your password?"
            : "Go back to dashboard"}
          <span
            onClick={() =>
              navigate(isResetFlow ? "/" : "/candidate")
            }
          >
            {isResetFlow ? "Login" : "Home"}
          </span>
        </div>

      </div>

    </div>
  );
}