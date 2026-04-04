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

            </div>
          ))}

        </div>
      )}

    </div>
  );
}