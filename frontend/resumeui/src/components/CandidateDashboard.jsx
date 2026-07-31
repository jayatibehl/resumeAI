import { useState, useEffect } from "react";
import "../App.css";

export default function CandidateDashboard() {

  const [file, setFile] = useState(null);
  const [step, setStep] = useState("upload");

  const [roles, setRoles] = useState([]);
  const [jobs, setJobs] = useState([]);

  const [skills, setSkills] = useState([]);
  const [experience, setExperience] = useState("");

  const [skillGap, setSkillGap] = useState(null);

  const [activeTab, setActiveTab] = useState("analysis");

  const [progressStep, setProgressStep] = useState(-1);

  useEffect(() => {
    const isFreshLogin = sessionStorage.getItem("fresh_login");

    if (!isFreshLogin) {
      localStorage.removeItem("matched_jobs");
      localStorage.removeItem("resume_text");
      localStorage.removeItem("resume_name");
      localStorage.removeItem("skills");
      localStorage.removeItem("roles");
      localStorage.removeItem("experience");

      sessionStorage.setItem("fresh_login", "true");
      setStep("upload");
    }
  }, []);

  useEffect(() => {
    const storedResume = localStorage.getItem("resume_text");
    const storedJobs = localStorage.getItem("matched_jobs");
    const storedSkills = localStorage.getItem("skills");
    const storedRoles = localStorage.getItem("roles");
    const storedExp = localStorage.getItem("experience");

    if (storedResume && storedJobs) {
      setJobs(JSON.parse(storedJobs));
      setSkills(JSON.parse(storedSkills || "[]"));
      setRoles(JSON.parse(storedRoles || "[]"));
      setExperience(storedExp || "");
      setStep("results");
    }
  }, []);

  useEffect(() => {
    if (step === "analyzing") {

      setProgressStep(0);

      const timers = [
        setTimeout(() => setProgressStep(0), 0),
        setTimeout(() => setProgressStep(1), 1000),
        setTimeout(() => setProgressStep(2), 2000),
        setTimeout(() => setProgressStep(3), 3000),
      ];

      return () => timers.forEach(t => clearTimeout(t));
    }
  }, [step]);

  const handleUpload = async () => {

    if (!file) return;

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login again");
      window.location.href = "/";
      return;
    }

    setStep("analyzing");

    const formData = new FormData();
    formData.append("file", file);

    try {

      const res = await fetch("http://127.0.0.1:5000/api/resume/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        setStep("upload");
        return;
      }

      localStorage.setItem("resume_text", data.resume_text || "");
      localStorage.setItem("resume_name", file.name);
      localStorage.setItem("matched_jobs", JSON.stringify(data.matching_jobs || []));
      localStorage.setItem("skills", JSON.stringify(data.analysis?.skills_found || []));
      localStorage.setItem("roles", JSON.stringify(data.recommended_roles || []));
      localStorage.setItem("experience", data.analysis?.experience_level || "");

      setRoles(data.recommended_roles || []);
      setJobs(data.matching_jobs || []);
      setSkills(data.analysis?.skills_found || []);
      setExperience(data.analysis?.experience_level || "Not specified");

      setStep("results");

    } catch {
      alert("Backend not connected");
      setStep("upload");
    }
  };

  const downloadReport = async () => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://127.0.0.1:5000/api/resume/download-report", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.download_url) {
        window.open(data.download_url, "_blank");
      } else {
        alert("Failed to generate report");
      }

    } catch {
      alert("Server error");
    }
  };

  const handleJobClick = async (job) => {

    const storedResume = localStorage.getItem("resume_text");

    if (!storedResume || storedResume.length < 20) {
      alert("Upload resume first");
      return;
    }

    const token = localStorage.getItem("token");

    try {

      const res = await fetch("http://127.0.0.1:5000/api/skills/gap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          resume_text: storedResume,
          job_description: job.description
        })
      });

      const data = await res.json();

      setSkillGap(data || null);
      setActiveTab("skillgap");

    } catch {
      alert("Skill gap service unavailable");
    }
  };

  // APPLY FUNCTION ADDED
  const handleApply = async (jobId) => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/jobs/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ job_id: jobId })
      });

      const data = await res.json();
      alert(data.message || "Applied");

    } catch {
      alert("Error applying to job");
    }
  };

  const handleReset = () => {
    localStorage.removeItem("resume_text");
    localStorage.removeItem("resume_name");
    localStorage.removeItem("matched_jobs");
    localStorage.removeItem("skills");
    localStorage.removeItem("roles");
    localStorage.removeItem("experience");

    sessionStorage.removeItem("fresh_login");

    setFile(null);
    setStep("upload");
    setRoles([]);
    setJobs([]);
    setSkills([]);
    setExperience("");
    setSkillGap(null);
  };

  const validJobs = (jobs || []).filter(j => (j.match_score || 0) > 0);

  return (
    <main className="main-content">

      {step === "upload" && (
        <div className="upload-card">
          <h2>Analyze Your Career Path</h2>

          <label className="drag-area">
            <input
              type="file"
              hidden
              accept=".pdf"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <p>{file ? file.name : "Upload Resume PDF"}</p>
          </label>

          <button className="primary-btn" onClick={handleUpload}>
            Start AI Analysis
          </button>
        </div>
      )}

      {step === "analyzing" && (
        <div className="upload-card">
          <div className="spinner"></div>
          <h3>Analyzing your resume...</h3>

          <div className="steps">
            {progressStep >= 0 && <p style={{ color: "#1e3a8a" }}>Extracting resume text...</p>}
            {progressStep >= 1 && <p style={{ color: "#1e3a8a" }}>Identifying skills...</p>}
            {progressStep >= 2 && <p style={{ color: "#1e3a8a" }}>Evaluating experience...</p>}
            {progressStep >= 3 && <p style={{ color: "#1e3a8a" }}>Matching job roles...</p>}
          </div>
        </div>
      )}

      {step === "results" && (
        <div className="results-grid">

          <div className="stat-card" style={{ gridColumn: "1 / -1" }}>
            <h3>Uploaded Resume</h3>

            <p
              style={{ color: "#60a5fa", cursor: "pointer", textDecoration: "underline" }}
              onClick={() => {
                if (file) {
                  const url = URL.createObjectURL(file);
                  window.open(url, "_blank");
                } else {
                  alert("Resume preview not available. Please upload again.");
                }
              }}
            >
              {localStorage.getItem("resume_name")}
            </p>

            <br /><br />

            <button onClick={handleReset}>
              Upload Another Resume
            </button>

            <br /><br />

            <button onClick={downloadReport}>
              Download Report
            </button>
          </div>

          {activeTab === "analysis" && (
            <>
              <div className="stat-card">
                <h3>Detected Skills</h3>
                <div className="tag-container">
                  {skills
                    .flatMap(s => Array.isArray(s) ? s : [s])
                    .map(s => s.trim())
                    .filter(s => s.length > 1)
                    .map((s, i) => (
                      <span key={i} className="tag">{s}</span>
                    ))}
                </div>
              </div>

              <div className="stat-card">
                <h3>Experience Level</h3>
                <p>{experience}</p>
              </div>

              <div className="stat-card">
                <h3>AI Suggested Roles</h3>
                {roles.map((r, i) => {
                  const roleName = typeof r === "object" ? r.role : r;
                  const score = typeof r === "object" ? r.score : null;

                  return (
                    <div key={i}>
                      <span>{roleName}</span>
                      {score !== null && score !== undefined
                        ? ` - ${Number(score).toFixed(2)}%`
                        : ""}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === "jobs" && (
            <div className="stat-card">
              <h3>Matching Jobs</h3>

              {validJobs.length === 0 && <p>No relevant jobs found</p>}

              {validJobs.map((j, i) => (
                <div key={i} style={{ marginBottom: "10px" }}>

                  <div onClick={() => handleJobClick(j)}>
                    <h4>{j.title}</h4>
                    <p>{j.match_score}%</p>
                  </div>

                  <button
                    className="secondary-btn"
                    onClick={() => handleApply(j.id)}
                  >
                    Apply
                  </button>

                </div>
              ))}
            </div>
          )}

          {activeTab === "skillgap" && skillGap && (
            <div className="stat-card">
              <h3>Skill Gap</h3>

              <p>Score: {skillGap.match_score || 0}%</p>

              <p>Missing Skills:</p>
              {(skillGap.missing_skills || []).map((s, i) => (
                <span key={i}>{s}</span>
              ))}
            </div>
          )}

        </div>
      )}

    </main>
  );
}