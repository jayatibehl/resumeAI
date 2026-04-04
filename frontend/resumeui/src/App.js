import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import "./App.css";

import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword"; // Naya component import
import ResetPassword from "./components/ResetPassword";   // Naya component import
import CandidateDashboard from "./components/CandidateDashboard";
import RecruiterDashboard from "./components/RecruiterDashboard";
import JobMatches from "./components/JobMatches";
import ProtectedRoute from "./components/ProtectedRoute";
import SkillGap from "./components/SkillGap";

/* ------------------ Candidate Layout ------------------ */
function CandidateLayout() {
  const [activeTab, setActiveTab] = useState("analysis");

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          Resume<span>AI</span>
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

      {/* Main Content */}
      <main className="main-content">
        {activeTab === "analysis" && <CandidateDashboard />}
        {activeTab === "jobs" && <JobMatches />}
        {activeTab === "skillgap" && <SkillGap />}
      </main>
    </div>
  );
}

/* ------------------ Main App ------------------ */
function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        
        {/* Dedicated Password Recovery Pages */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Candidate Dashboard */}
        <Route
          path="/candidate"
          element={
            <ProtectedRoute role="candidate">
              <CandidateLayout />
            </ProtectedRoute>
          }
        />

        {/* Recruiter Dashboard */}
        <Route
          path="/recruiter"
          element={
            <ProtectedRoute role="recruiter">
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;