import { useState, useEffect } from "react";
import { Briefcase, Users, Search, PlusCircle } from "lucide-react";
import "../App.css";

export default function RecruiterDashboard() {

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);

  const [activeTab, setActiveTab] = useState("jobs");
  const [selectedJobId, setSelectedJobId] = useState(null);

  const [search, setSearch] = useState("");

  // LOAD JOBS
  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/jobs/all");
        const data = await res.json();
        setJobs(data);
      } catch {
        console.log("Could not load jobs");
      }
    };
    loadJobs();
  }, []);

  // POST JOB
  const postJob = async () => {

    if (!title || !description) {
      alert("Please fill all fields");
      return;
    }

    try {

      const res = await fetch("http://127.0.0.1:5000/api/jobs/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          description,
          recruiter_email: "recruiter@test.com"
        })
      });

      const data = await res.json();

      if (data.message) {

        const jobsRes = await fetch("http://127.0.0.1:5000/api/jobs/all");
        const jobsData = await jobsRes.json();

        setJobs(jobsData);
        setTitle("");
        setDescription("");

      } else {
        alert("Error posting job");
      }

    } catch {
      alert("Backend not connected");
    }
  };

  // 🔥 VIEW MATCHES → SWITCH TAB
  const handleViewMatches = (jobId) => {
    setSelectedJobId(jobId);
    setActiveTab("candidates");
    fetchCandidates(jobId);
  };

  // 🔥 FETCH CANDIDATES
  const fetchCandidates = async (jobId) => {

    try {
      const res = await fetch("http://127.0.0.1:5000/api/jobs/matched-candidates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ job_id: jobId })
      });

      const data = await res.json();
      setCandidates(data);

    } catch {
      alert("Error loading candidates");
    }
  };

  const filteredJobs = jobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-container">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="logo">Resume<span>AI</span></div>

        <nav>

          <div
            className={`nav-item ${activeTab === "jobs" ? "active" : ""}`}
            onClick={() => setActiveTab("jobs")}
          >
            <Briefcase size={20}/> Job Posts
          </div>

          <div
            className={`nav-item ${activeTab === "candidates" ? "active" : ""}`}
            onClick={() => setActiveTab("candidates")}
          >
            <Users size={20}/> Candidates
          </div>

        </nav>

      </aside>


      <main className="main-content">

        {/* ================= JOB POSTS TAB ================= */}
        {activeTab === "jobs" && (
          <>

            {/* STATS */}
            <div className="results-grid">
              <section className="stat-card">
                <h3>Total Jobs</h3>
                <div className="big-number">{jobs.length}</div>
              </section>
            </div>

            {/* POST JOB */}
            <div className="upload-card" style={{ marginTop: 30 }}>

              <h2><PlusCircle size={22}/> Post a Job</h2>

              <input
                className="input-box"
                placeholder="Job Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />

              <textarea
                className="input-box"
                placeholder="Job Description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows="4"
              />

              <button className="primary-btn" onClick={postJob}>
                Post Job
              </button>

            </div>

            {/* JOB LIST */}
            <h2 style={{ marginTop: 40 }}>Your Job Posts</h2>

            <div className="results-grid">

              {jobs.map(job => (

                <section key={job.id} className="stat-card">

                  <h3>{job.title}</h3>
                  <p>{job.description}</p>

                  <button
                    className="secondary-btn"
                    onClick={() => handleViewMatches(job.id)}
                  >
                    <Search size={16}/> View Matches
                  </button>

                </section>

              ))}

            </div>

          </>
        )}


        {/* ================= CANDIDATES TAB ================= */}
        {activeTab === "candidates" && (
          <>

            <h2>Select Job</h2>

            <input
              type="text"
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-box"
            />

            <div style={{ marginTop: 15 }}>

              {filteredJobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => fetchCandidates(job.id)}
                  style={{
                    padding: "10px",
                    cursor: "pointer",
                    borderBottom: "1px solid rgba(255,255,255,0.1)"
                  }}
                >
                  {job.title}
                </div>
              ))}

            </div>


            {/* CANDIDATES */}
            <div className="results-grid" style={{ marginTop: 30 }}>

              {candidates.length === 0 && (
                <p>No candidates found</p>
              )}

              {candidates.map((c, i) => (

                <section key={i} className="stat-card">

                  <h3>{c.name}</h3>

                  <p>{c.email}</p>

                  <div className="big-number">
                    {c.match_score}%
                  </div>

                  <a
                    href={`http://127.0.0.1:5000/uploads/${c.resume}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#5b6cff" }}
                  >
                    View Resume
                  </a>

                  <br />

                  <a
                    href={`mailto:${c.email}`}
                    style={{ color: "#00d084" }}
                  >
                    Contact
                  </a>

                </section>

              ))}

            </div>

          </>
        )}

      </main>

    </div>
  );
}