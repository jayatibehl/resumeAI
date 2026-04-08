import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {

  const navigate = useNavigate();

  // ✅ FIXED: role-based redirect instead of always recruiter
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token && role) {
      if (role === "candidate") {
        navigate("/candidate", { replace: true });
      } else if (role === "recruiter") {
        navigate("/recruiter", { replace: true });
      } else if (role === "admin") {
        navigate("/admin", { replace: true });
      }
    }
  }, []);

  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "candidate"
  });

  // ================= PASSWORD STRENGTH =================
  const getPasswordStrength = (password) => {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;

    return score;
  };

  const strength = getPasswordStrength(form.password || "");

  const getColor = () => {
    if (strength <= 1) return "red";
    if (strength === 2) return "orange";
    if (strength === 3) return "yellow";
    if (strength === 4) return "green";
  };

  const getWidth = () => {
    return `${(strength / 4) * 100}%`;
  };

  const isStrong = strength === 4;

  // ================= SUBMIT =================
  const submit = async () => {

    if (isRegister && !isStrong) {
      alert("Please create a strong password");
      return;
    }

    const url = isRegister
      ? "http://127.0.0.1:5000/api/register"
      : "http://127.0.0.1:5000/api/login";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      // ================= REGISTER =================
      if (isRegister) {
        if (data.message) {
          alert("Account created successfully. Please login.");
          setIsRegister(false);
        } else {
          alert(data.error || "Registration failed");
        }
        return;
      }

      // ================= LOGIN =================
      if (data.role) {

        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("name", data.name);
        localStorage.setItem("email", data.email);

        if (data.role === "candidate") {
          navigate("/candidate");
        } else if (data.role === "recruiter") {
          navigate("/recruiter");
        } else if (data.role === "admin") {
          navigate("/admin");
        }

      } else {
        alert(data.error || "Invalid login");
      }

    } catch (err) {
      alert("Server error");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <h2>{isRegister ? "Create Account" : "Welcome Back"}</h2>

        <p className="subtitle">
          {isRegister
            ? "Create your ResumeAI account"
            : "Login to access your dashboard"}
        </p>

        {isRegister && (
          <input
            type="text"
            placeholder="Full Name"
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />
        )}

        <input
          type="email"
          placeholder="Email Address"
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        {/* ================= PASSWORD FIELD ================= */}
        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />

          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              opacity: 0.7
            }}
          >
            {showPassword ? (
              <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12c-3 0-5-2-5-5s2-5 5-5 5 2 5 5-2 5-5 5z"/>
              </svg>
            ) : (
              <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                <path d="M2 5l20 14M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7z"/>
              </svg>
            )}
          </span>
        </div>

        {/* ================= PASSWORD STRENGTH ================= */}
        {isRegister && (
          <>
            <div className="password-strength-bar">
              <div
                className="strength-fill"
                style={{
                  width: getWidth(),
                  backgroundColor: getColor(),
                }}
              ></div>
            </div>

            <div className="password-rules single-line">
              <span className={form.password.length >= 8 ? "valid" : ""}>Min 8</span>
              <span className={/[A-Z]/.test(form.password) ? "valid" : ""}>Uppercase</span>
              <span className={/[0-9]/.test(form.password) ? "valid" : ""}>Number</span>
              <span className={/[@$!%*?&]/.test(form.password) ? "valid" : ""}>Special</span>
            </div>
          </>
        )}

        {/* ================= FORGOT PASSWORD ================= */}
        {!isRegister && (
          <p
            style={{
              textAlign: "right",
              marginTop: "6px",
              fontSize: "14px",
              color: "#5b6cff",
              cursor: "pointer"
            }}
            onClick={() => navigate("/forgot-password")}
          >
            Forgot Password?
          </p>
        )}

        {isRegister && (
          <select
            onChange={(e) =>
              setForm({ ...form, role: e.target.value })
            }
          >
            <option value="candidate">Candidate</option>
            <option value="recruiter">Recruiter</option>
          </select>
        )}

        <button
          className="primary-btn"
          onClick={submit}
          disabled={isRegister && !isStrong}
          style={{
            opacity: isRegister && !isStrong ? 0.6 : 1,
            cursor: isRegister && !isStrong ? "not-allowed" : "pointer"
          }}
        >
          {isRegister ? "Create Account" : "Login"}
        </button>

        <p className="toggle-text">
          {isRegister ? "Already have an account?" : "New here?"}
          <span onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? " Login" : " Create Account"}
          </span>
        </p>

      </div>
    </div>
  );
}