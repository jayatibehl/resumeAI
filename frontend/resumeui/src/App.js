import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import "./App.css";

import Login from "./components/Login";
import CandidateDashboard from "./components/CandidateDashboard";
import RecruiterDashboard from "./components/RecruiterDashboard";
import JobMatches from "./components/JobMatches";
import ProtectedRoute from "./components/ProtectedRoute";
import SkillGap from "./components/SkillGap";
import AdminDashboard from "./components/AdminDashboard";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./components/ForgotPassword";

/* ------------------ Candidate Layout ------------------ */
function CandidateLayout() {

  const [activeTab, setActiveTab] = useState("analysis");

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const handleChangePassword = () => {
    window.location.href = "/reset-password";
  };

  return (
    <div className="dashboard-container">

      <aside className="sidebar">

        <div className="logo">
          Resume<span>AI</span>
        </div>

        <div
          className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </div>

        <div
          className={`nav-item ${activeTab === "analysis" ? "active" : ""}`}
          onClick={() => setActiveTab("analysis")}
        >
          Analysis
        </div>

        <div
          className={`nav-item ${activeTab === "jobs" ? "active" : ""}`}
          onClick={() => setActiveTab("jobs")}
        >
          Job Matches
        </div>

        <div
          className={`nav-item ${activeTab === "skillgap" ? "active" : ""}`}
          onClick={() => setActiveTab("skillgap")}
        >
          Skill Gap Analysis
        </div>

        <div className="nav-item logout" onClick={logout}>
          Logout
        </div>

      </aside>

      <main className="main-content">

        {activeTab === "profile" && (
          <div className="stat-card">
            <h3>Profile</h3>

            <p><b>Name:</b> {localStorage.getItem("name")}</p>
            <p><b>Email:</b> {localStorage.getItem("email")}</p>
            <p><b>Role:</b> {localStorage.getItem("role")}</p>

            <br />

            <button onClick={handleChangePassword}>
              Change Password
            </button>
          </div>
        )}

        {activeTab === "analysis" && <CandidateDashboard />}
        {activeTab === "jobs" && <JobMatches />}
        {activeTab === "skillgap" && <SkillGap />}

      </main>

    </div>
  );
}

/* ------------------ Main App ------------------ */
function App() {

  // ✅ AUTO REDIRECT LOGIC (ONLY ADDITION)
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  return (
    <Router>

      <Routes>

        {/* ✅ FIXED LOGIN ROUTE */}
        <Route
          path="/"
          element={
            token ? (
              role === "recruiter" ? (
                <Navigate to="/recruiter" />
              ) : role === "admin" ? (
                <Navigate to="/admin" />
              ) : (
                <Navigate to="/candidate" />
              )
            ) : (
              <Login />
            )
          }
        />

        {/* Reset Password */}
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Candidate */}
        <Route
          path="/candidate"
          element={
            <ProtectedRoute role="candidate">
              <CandidateLayout />
            </ProtectedRoute>
          }
        />

        {/* Recruiter */}
        <Route
          path="/recruiter"
          element={
            <ProtectedRoute role="recruiter">
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Forgot Password */}
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>

    </Router>
  );
}

export default App;