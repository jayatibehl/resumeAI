import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react"; 
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState({ label: "", color: "#ccc", width: "0%" });

  const [form, setForm] = useState({
    name: "", email: "", phone: "", identifier: "", password: "", role: "candidate"
  });

  useEffect(() => {
    setForm({ name: "", email: "", phone: "", identifier: "", password: "", role: "candidate" });
    setShowPassword(false);
  }, [isRegister]);

  useEffect(() => {
    if (!isRegister) return;
    const pass = form.password;
    if (!pass) {
      setStrength({ label: "", color: "#ccc", width: "0%" });
      return;
    }

    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[@$!%*?&]/.test(pass)) score++;

    const levels = [
      { label: "Too Weak", color: "#ef4444", width: "25%" },
      { label: "Weak", color: "#f59e0b", width: "50%" },
      { label: "Strong", color: "#10b981", width: "75%" },
      { label: "Very Strong", color: "#6366f1", width: "100%" }
    ];
    
    setStrength(score > 0 ? levels[score - 1] : levels[0]);
  }, [form.password, isRegister]);

  const submit = async () => {
    if (isRegister) {
      if (!/[@$!%*?&]/.test(form.password)) return alert("Add a special character!");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return alert("Invalid Email");
      if (!/^[6-9]\d{9}$/.test(form.phone)) return alert("Invalid Phone");
    }

    setLoading(true);
    const baseUrl = "http://localhost:5000/api"; 
    const url = isRegister ? `${baseUrl}/register` : `${baseUrl}/login`;
    const payload = isRegister 
      ? { name: form.name, email: form.email, phone: form.phone, password: form.password, role: form.role }
      : { identifier: form.identifier, password: form.password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      if (isRegister) {
        alert("Account created successfully!");
        setIsRegister(false); 
        setForm(prev => ({ ...prev, identifier: form.email, password: form.password }));
      } else {
        saveSession(data);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSession = (data) => {
    localStorage.clear();
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("name", data.name);
    localStorage.setItem("email", data.email);
    navigate(data.role === "candidate" ? "/candidate" : "/recruiter");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isRegister ? "Create Account" : "Welcome Back"}</h2>
        
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} autoComplete="off">
          {isRegister && (
            <input className="auth-input" type="text" placeholder="Full Name" value={form.name} required
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} />
          )}

          {isRegister ? (
            <>
              <input className="auth-input" type="email" placeholder="Email Address" value={form.email} required
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} />
              <input className="auth-input" type="tel" placeholder="Phone Number" value={form.phone} required
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))} />
            </>
          ) : (
            <input className="auth-input" type="text" placeholder="Email or Phone" value={form.identifier} required
              onChange={(e) => setForm(prev => ({ ...prev, identifier: e.target.value }))} />
          )}

          <div className="password-wrapper" style={{ position: "relative" }}>
            <input
              className="auth-input"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              required
              onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
            />
            <span onClick={() => setShowPassword(!showPassword)}
              style={{ position: "absolute", right: "12px", top: "12px", cursor: "pointer", color: "#666" }}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </span>
            
            {isRegister && form.password && (
              <div className="strength-section" style={{ marginTop: '12px' }}>
                {/* Strength Bar */}
                <div className="strength-meter-bg" style={{ height: '5px', borderRadius: '10px', backgroundColor: '#e2e8f0', marginBottom: '10px' }}>
                  <div className="strength-bar" style={{ width: strength.width, backgroundColor: strength.color, height: '100%', borderRadius: '10px', transition: '0.4s ease' }}></div>
                </div>
                
                {/* 📋 Modern Pill-style Checklist */}
                <div className="password-checklist" style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '8px', 
                  padding: '5px 0'
                }}>
                  {[
                    { label: "Min. 8 Characters", met: form.password.length >= 8 },
                    { label: "Uppercase", met: /[A-Z]/.test(form.password) },
                    { label: "Number", met: /[0-9]/.test(form.password) },
                    { label: "Special (@$!)", met: /[@$!%*?&]/.test(form.password) }
                  ].map((item, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '5px', 
                      fontSize: '0.7rem', 
                      padding: '4px 10px',
                      borderRadius: '20px',
                      border: `1px solid ${item.met ? '#10b981' : '#e2e8f0'}`,
                      backgroundColor: item.met ? '#f0fdf4' : '#fff',
                      color: item.met ? '#10b981' : '#94a3b8',
                      transition: '0.3s'
                    }}>
                      <span style={{ fontSize: '10px' }}>{item.met ? "✔" : "○"}</span>
                      <span style={{ fontWeight: '500' }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!isRegister && (
            <p className="forgot-pw-link" onClick={() => navigate("/forgot-password")} 
               style={{ cursor: "pointer", textAlign: 'right', fontSize: '0.85rem', color: '#6366f1', margin: '10px 0' }}>
              Forgot Password?
            </p>
          )}

          {isRegister && (
            <select className="auth-select" value={form.role} onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value }))}>
              <option value="candidate">I am a Candidate</option>
              <option value="recruiter">I am a Recruiter</option>
            </select>
          )}

          <button type="submit" className="primary-btn" disabled={loading} style={{ marginTop: '10px' }}>
            {loading ? "Processing..." : (isRegister ? "Sign Up" : "Login")}
          </button>
        </form>

        <p className="toggle-text">
          {isRegister ? "Already have an account?" : "New to ResumeAI?"}
          <span className="toggle-link" onClick={() => setIsRegister(!isRegister)} style={{ cursor: "pointer", color: '#6366f1', fontWeight: 'bold' }}>
            {isRegister ? " Login" : " Create Account"}
          </span>
        </p>
      </div>
    </div>
  );
}