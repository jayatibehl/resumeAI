import { useEffect, useState } from "react";
import { getAllJobs, getSkillGap } from "../services/jobService";

export default function SkillGap() {

  const [allJobs, setAllJobs] = useState([]);
  const [topJobs, setTopJobs] = useState([]);
  const [otherJobs, setOtherJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [result, setResult] = useState(null);

  const resumeText = localStorage.getItem("resume_text");

  /* ------------------ LOAD DATA ------------------ */
  useEffect(() => {

    const loadData = async () => {

      const jobs = await getAllJobs();
      setAllJobs(jobs);

      const matched = JSON.parse(localStorage.getItem("matched_jobs")) || [];

      setTopJobs(matched);

      const matchedIds = new Set(matched.map((j) => j.job_id));

      const remaining = jobs.filter((j) => !matchedIds.has(j.id));

      setOtherJobs(remaining);
    };

    loadData();

  }, []);

  /* ------------------ SEARCH FILTER ------------------ */
  const filterJobs = (jobs) =>
    jobs.filter((job) =>
      job.title.toLowerCase().includes(search.toLowerCase())
    );

  /* ------------------ CLICK HANDLER ------------------ */
  const handleSelectJob = async (job) => {

    setSelectedJob(job);

    if (!resumeText) {
      alert("Upload resume first");
      return;
    }

    try {
      const data = await getSkillGap(resumeText, job.description);

      console.log("SkillGap result:", data); // debug

      setResult(data);
    } catch {
      alert("Skill gap failed");
    }
  };

  return (
    <div>

      <h2>Skill Gap Analysis</h2>

      {!resumeText && (
        <p style={{ color: "#ff6b6b" }}>
          Upload and analyze your resume first.
        </p>
      )}

      <p>Select a job description to continue</p>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search jobs..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", marginBottom: "15px" }}
      />

      {/* TOP MATCHES */}
      {topJobs.length > 0 && (
        <>
          <h3>⭐ Your Top Matches</h3>

          {filterJobs(topJobs).map((job) => (
            <div
              key={job.job_id}
              onClick={() =>
                handleSelectJob({
                  id: job.job_id,
                  title: job.title,
                  description: job.description,
                })
              }
              style={{
                border: "1px solid #4caf50",
                padding: "10px",
                marginBottom: "10px",
                cursor: "pointer",
                background:
                  selectedJob?.id === job.job_id ? "#1e1e2f" : "transparent",
              }}
            >
              <h4>{job.title}</h4>
              <p>{job.description?.substring(0, 100)}...</p>

              <p style={{ color: "#4caf50" }}>
                Match: {job.match_score?.toFixed(2)}%
              </p>
            </div>
          ))}
        </>
      )}

      {/* OTHER JOBS */}
      <h3>📌 Other Jobs</h3>

      {filterJobs(otherJobs).map((job) => (
        <div
          key={job.id}
          onClick={() => handleSelectJob(job)}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            marginBottom: "10px",
            cursor: "pointer",
            background:
              selectedJob?.id === job.id ? "#1e1e2f" : "transparent",
          }}
        >
          <h4>{job.title}</h4>
          <p>{job.description.substring(0, 100)}...</p>
        </div>
      ))}

      {/* RESULT */}
      {result && (
        <div style={{ marginTop: "20px" }}>

          <h3>Match Score: {result.match_score || 0}%</h3>

          <h4>Matched Skills</h4>
          <ul>
            {(result.matched_skills || []).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>

          <h4>Missing Skills</h4>
          <ul>
            {(result.missing_skills || []).map((s, i) => (
              <li key={i} style={{ color: "red" }}>
                {s}
              </li>
            ))}
          </ul>

        </div>
      )}

    </div>
  );
}