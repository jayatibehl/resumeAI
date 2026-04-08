import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Users, Search, PlusCircle } from "lucide-react";
import "../App.css";

export default function RecruiterDashboard() {

  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [applications, setApplications] = useState([]);

  const [activeTab, setActiveTab] = useState("jobs");
  const [selectedJobId, setSelectedJobId] = useState(null);

  const [search, setSearch] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) navigate("/", { replace: true });
  }, []);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/jobs/all");
        const data = await res.json();

        setJobs(
          Array.isArray(data)
            ? data
            : Array.isArray(data.jobs)
            ? data.jobs
            : []
        );
      } catch {
        console.log("Could not load jobs");
      }
    };
    loadJobs();
  }, []);

  const postJob = async () => {
    if (!title || !description) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:5000/api/jobs/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
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

        setJobs(
          Array.isArray(jobsData)
            ? jobsData
            : Array.isArray(jobsData.jobs)
            ? jobsData.jobs
            : []
        );

        setTitle("");
        setDescription("");
      } else {
        alert("Error posting job");
      }

    } catch {
      alert("Backend not connected");
    }
  };

  const deleteJob = async (jobId) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.message) {
        setJobs(prev => prev.filter(job => job.id !== jobId));
      } else {
        alert("Failed to delete job");
      }

    } catch {
      alert("Error deleting job");
    }
  };

  const handleViewMatches = (jobId) => {
    setSelectedJobId(jobId);
    setActiveTab("candidates");
    fetchCandidates(jobId);
  };

  const fetchCandidates = async (jobId) => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/jobs/matched-candidates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ job_id: jobId })
      });

      const data = await res.json();

      setCandidates(
        Array.isArray(data)
          ? data
          : Array.isArray(data.candidates)
          ? data.candidates
          : []
      );

    } catch {
      alert("Error loading candidates");
    }
  };

  // ✅ ONLY CHANGE: job_id → job_title
  const fetchApplications = async (jobTitle) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/jobs/applications?job_title=${jobTitle}`);
      const data = await res.json();
      setApplications(data);
    } catch {
      alert("Error loading applications");
    }
  };

  const filteredJobs = (jobs || []).filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase())
  );

  const validCandidates = (candidates || []).filter(c => c.match_score > 0);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const handleChangePassword = () => {
    const newPassword = prompt("Enter new password:");
    if (!newPassword) return;

    fetch("http://127.0.0.1:5000/api/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ password: newPassword })
    })
    .then(res => res.json())
    .then(data => alert(data.message || "Password updated"))
    .catch(() => alert("Error updating password"));
  };

  return (
    <div className="dashboard-container">

      <aside className="sidebar">
        <div className="logo">Resume<span>AI</span></div>

        <nav>

          <div
            className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </div>

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

          <div
            className={`nav-item ${activeTab === "applications" ? "active" : ""}`}
            onClick={() => setActiveTab("applications")}
          >
            Applied Candidates
          </div>

        </nav>
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

            <br /><br />

            <button onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}

        {activeTab === "jobs" && (
          <>
            <div className="results-grid">
              <section className="stat-card">
                <h3>Total Jobs</h3>
                <div className="big-number">{jobs.length}</div>
              </section>
            </div>

            <div className="upload-card" style={{ marginTop: 30 }}>
              <h2><PlusCircle size={22}/> Post a Job</h2>

              <input className="input-box" placeholder="Job Title"
                value={title} onChange={e => setTitle(e.target.value)} />

              <textarea className="input-box" placeholder="Job Description"
                value={description} onChange={e => setDescription(e.target.value)} />

              <button className="primary-btn" onClick={postJob}>
                Post Job
              </button>
            </div>

            <h2 style={{ marginTop: 40 }}>Your Job Posts</h2>

            <div className="results-grid">
              {jobs.map(job => (
                <section key={job.id} className="stat-card">

                  <h3>{job.title}</h3>
                  <p>{job.description}</p>

                  <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>

                    <button className="secondary-btn"
                      onClick={() => handleViewMatches(job.id)}>
                      <Search size={16}/> View Matches
                    </button>

                    <button className="secondary-btn"
                      style={{ background: "#ff4d4f", color: "white" }}
                      onClick={() => deleteJob(job.id)}>
                      Delete
                    </button>

                    <button className="secondary-btn"
                      onClick={() => {
                        setActiveTab("applications");
                        setSelectedJobId(job.id);
                        fetchApplications(job.title);
                      }}>
                      View Applications
                    </button>

                  </div>

                </section>
              ))}
            </div>
          </>
        )}

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
                  onClick={() => {
                    setSelectedJobId(job.id);
                    fetchCandidates(job.id);
                  }}
                  style={{
                    padding: "10px",
                    cursor: "pointer",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "6px",
                    background:
                      selectedJobId === job.id
                        ? "rgba(91,156,255,0.15)"
                        : "transparent",
                    border:
                      selectedJobId === job.id
                        ? "1px solid #5b9cff"
                        : "1px solid transparent"
                  }}
                >
                  {job.title}
                </div>
              ))}
            </div>

            <div className="results-grid" style={{ marginTop: 30 }}>
              {validCandidates.length === 0 && <p>No relevant candidates found</p>}

              {validCandidates.map((c, i) => (
                <section key={i} className="stat-card">

                  <h3>{c.name}</h3>
                  <p>{c.email}</p>

                  <div className="big-number">{c.match_score}%</div>

                  <a
                    href={`http://127.0.0.1:5000/uploads/${c.resume}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#5b9cff" }}
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

        {activeTab === "applications" && (
          <>
            <h2>Select Job</h2>

            <div style={{ marginTop: 15 }}>
              {jobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => {
                    setSelectedJobId(job.id);
                    fetchApplications(job.title);
                  }}
                  style={{
                    padding: "10px",
                    cursor: "pointer",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "6px",
                    background:
                      selectedJobId === job.id
                        ? "rgba(91,156,255,0.15)"
                        : "transparent",
                    border:
                      selectedJobId === job.id
                        ? "1px solid #5b9cff"
                        : "1px solid transparent"
                  }}
                >
                  {job.title}
                </div>
              ))}
            </div>

            <div className="results-grid" style={{ marginTop: 30 }}>
              {applications.length === 0 && <p>No applications yet</p>}

              {applications.map((app, i) => (
                <section key={i} className="stat-card">

                  <h3>{app.candidate_email}</h3>

                  <button
                    onClick={() =>
                      window.open(
                        `https://mail.google.com/mail/?view=cm&fs=1&to=${app.candidate_email}`,
                        "_blank"
                      )
                    }
                  >
                    Contact
                  </button>

                </section>
              ))}
            </div>
          </>
        )}

      </main>
    </div>
  );
}