import { useEffect, useState } from "react";

export default function JobMatches() {

  const [matches, setMatches] = useState([]);

  const resumeName = localStorage.getItem("resume_name");

  useEffect(() => {
    const storedJobs = localStorage.getItem("matched_jobs");

    if (storedJobs) {
      setMatches(JSON.parse(storedJobs));
    }
  }, []);

  const handleReupload = () => {
    localStorage.clear();
    window.location.reload(); // simple reset
  };

  // 🔥 APPLY FUNCTION (ADDED)
  const handleApply = async (jobId) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://127.0.0.1:5000/api/jobs/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ job_id: jobId })
      });

      const data = await res.json();

      if (res.ok) {
        alert("Applied successfully ✅");
      } else {
        alert(data.error || data.message || "Failed to apply");
      }

    } catch (err) {
      alert("Server error");
    }
  };

  return (
    <div className="main-content">

      <div className="upload-card">
        <h2>Match Resume With Job Openings</h2>

        {!resumeName ? (
          <p style={{ color: "red" }}>
            Please upload resume in Analysis tab first.
          </p>
        ) : (
          <>
            <a
              href={`http://127.0.0.1:5000/uploads/${resumeName}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                marginTop: "10px",
                padding: "8px 14px",
                background: "#5b6cff",
                borderRadius: "6px",
                textDecoration: "none",
                color: "white",
                fontSize: "14px"
              }}
            >
              📄 {resumeName}
            </a>

            <br /><br />

            <button
              onClick={handleReupload}
              style={{
                padding: "8px 14px",
                background: "#ff4d4f",
                border: "none",
                borderRadius: "6px",
                color: "white",
                cursor: "pointer"
              }}
            >
              Upload Another Resume
            </button>
          </>
        )}
      </div>

      {matches.length > 0 && (
        <div className="results-grid">

          {matches.map((job, i) => (
            <div key={i} className="stat-card">

              <h3>{job.title}</h3>

              <p>
                {job.description
                  ? job.description.substring(0, 120) + "..."
                  : ""}
              </p>

              <div className="big-number">
                {Number(job.match_score).toFixed(2)}%
              </div>

              {/* 🔥 APPLY BUTTON (ADDED) */}
              <button
                onClick={() => handleApply(job.job_id)}
                style={{
                  marginTop: "10px",
                  padding: "6px 12px",
                  background: "#28a745",
                  border: "none",
                  borderRadius: "5px",
                  color: "white",
                  cursor: "pointer"
                }}
              >
                Apply
              </button>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}