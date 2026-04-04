import { useState } from "react";

export default function CandidateDashboard() {

  const [file, setFile] = useState(null);
  const [step, setStep] = useState("upload");

  const [roles, setRoles] = useState([]);
  const [jobs, setJobs] = useState([]);

  const [skills, setSkills] = useState([]);
  const [experience, setExperience] = useState("");

  const [skillGap, setSkillGap] = useState(null);

  const [activeTab, setActiveTab] = useState("analysis");

  const resumeName = localStorage.getItem("resume_name");


  /* ------------------ UPLOAD ------------------ */

  const handleUpload = async () => {

    if (!file) return;

    // ✅ FIX: GET USER DATA
    const email = localStorage.getItem("email");
    const name = localStorage.getItem("name");

    console.log("EMAIL:", email);
    console.log("NAME:", name);

    if (!email || !name) {
      alert("User not logged in properly");
      return;
    }

    setStep("analyzing");

    const formData = new FormData();
    formData.append("file", file);

    // ✅ FIX: SEND USER DATA TO BACKEND
    formData.append("email", email);
    formData.append("name", name);

    try {

      const res = await fetch("http://127.0.0.1:5000/api/resume/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        setStep("upload");
        return;
      }

      // ✅ FIX 1: ALWAYS STORE CORRECT TEXT
      localStorage.setItem("resume_text", data.resume_text || "");
      localStorage.setItem("resume_name", file.name);

      if (data.matching_jobs) {
        localStorage.setItem("matched_jobs", JSON.stringify(data.matching_jobs));
      }

      setRoles(data.recommended_roles || []);
      setJobs(data.matching_jobs || []);

      if (data.analysis) {
        setSkills(data.analysis.skills_found || []);
        setExperience(data.analysis.experience_level || "Not specified");
      }

      setStep("results");

    } catch {
      alert("Backend not connected");
      setStep("upload");
    }
  };


  /* ------------------ SKILL GAP (FIXED) ------------------ */

  const handleJobClick = async (job) => {

    const storedResume = localStorage.getItem("resume_text");

    if (!storedResume || storedResume.length < 20) {
      alert("Upload resume first");
      return;
    }

    try {

      const res = await fetch("http://127.0.0.1:5000/api/skills/gap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          resume_text: storedResume,
          job_description: job.description
        })
      });

      const data = await res.json();

      setSkillGap(data);
      setActiveTab("skillgap");

    } catch {
      alert("Skill gap service unavailable");
    }
  };


  /* ------------------ RESET ------------------ */

  const handleReset = () => {
    localStorage.removeItem("resume_text");
    localStorage.removeItem("resume_name");
    localStorage.removeItem("matched_jobs");
    setFile(null);
    setStep("upload");
    setRoles([]);
    setJobs([]);
    setSkills([]);
    setExperience("");
    setSkillGap(null);
  };


  return (
    <main className="main-content">

      {/* ------------------ UPLOAD ------------------ */}
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


      {/* ------------------ ANALYZING ------------------ */}
      {step === "analyzing" && (
        <div className="upload-card">
          <h3>Analyzing Resume...</h3>
        </div>
      )}


      {/* ------------------ RESULTS ------------------ */}
      {step === "results" && (

        <div className="results-grid">

          {/* Resume */}
          <div className="stat-card" style={{ gridColumn: "1 / -1" }}>

            <h3>Uploaded Resume</h3>

            {resumeName ? (
              <>
                <a
                  href={`http://127.0.0.1:5000/uploads/${resumeName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: "10px",
                    padding: "10px 16px",
                    background: "#5b6cff",
                    borderRadius: "8px",
                    textDecoration: "none",
                    color: "white",
                    fontWeight: "500"
                  }}
                >
                  📄 {resumeName}
                </a>

                <br /><br />

                <button
                  onClick={handleReset}
                  style={{
                    padding: "10px 16px",
                    background: "#5b6cff",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                    cursor: "pointer"
                  }}
                >
                  Upload Another Resume
                </button>
              </>
            ) : (
              <p>No resume uploaded</p>
            )}

          </div>


          {/* ANALYSIS */}
          {activeTab === "analysis" && (

            <>
              <div className="stat-card">
                <h3>Detected Skills</h3>

                <div className="tag-container">
                  {skills.map((s, i) => (
                    <span key={i} className="tag">{s}</span>
                  ))}
                </div>
              </div>


              <div className="stat-card">
                <h3>Experience Level</h3>
                <p>{experience}</p>
              </div>


              {/* ROLES */}
              <div className="stat-card">
                <h3>AI Suggested Roles</h3>

                {roles.length === 0 && <p>No roles detected</p>}

                {roles.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.08)"
                    }}
                  >
                    <span className="tag">{r.role}</span>

                    <span style={{ color: "#5b6cff", fontWeight: "600" }}>
                      {r.score}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}


          {/* JOB MATCHES */}
          {activeTab === "jobs" && (
            <div className="stat-card">

              <h3>Matching Jobs</h3>

              {jobs.map((j, i) => (
                <div
                  key={i}
                  onClick={() => handleJobClick(j)}
                  style={{ cursor: "pointer", marginBottom: "10px" }}
                >
                  <h4>{j.title}</h4>

                  <p>Match: {Number(j.match_score).toFixed(2)}%</p>
                </div>
              ))}

            </div>
          )}


          {/* SKILL GAP */}
          {activeTab === "skillgap" && skillGap && (
            <div className="stat-card">

              <h3>Skill Gap Analysis</h3>

              <h4>Match Score: {skillGap.match_score}%</h4>

              <h4>Matched Skills</h4>
              <div className="tag-container">
                {skillGap.matched_skills?.map((s, i) => (
                  <span key={i} className="tag">{s}</span>
                ))}
              </div>

              <h4>Missing Skills</h4>
              <div className="tag-container">
                {skillGap.missing_skills?.map((s, i) => (
                  <span
                    key={i}
                    className="tag"
                    style={{ background: "#ff4d4f" }}
                  >
                    {s}
                  </span>
                ))}
              </div>

            </div>
          )}

        </div>
      )}

    </main>
  );
}