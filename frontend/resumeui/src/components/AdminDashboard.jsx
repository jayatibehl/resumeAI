import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [bannedJobs, setBannedJobs] = useState([]); // ✅ NEW
  const [activeTab, setActiveTab] = useState("candidates");

  const token = localStorage.getItem("token");

  // ✅ ADDED LOGOUT FUNCTION
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await fetch("http://127.0.0.1:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData = await userRes.json();

      const usersArray = Array.isArray(userData)
        ? userData
        : Array.isArray(userData.users)
        ? userData.users
        : [];

      setUsers(usersArray);

      const jobRes = await fetch("http://127.0.0.1:5000/api/admin/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const jobData = await jobRes.json();

      const jobsArray = Array.isArray(jobData)
        ? jobData
        : Array.isArray(jobData.jobs)
        ? jobData.jobs
        : [];

      setJobs(jobsArray);

    } catch (err) {
      console.error("FETCH ERROR:", err);
    }
  };

  // ✅ FETCH BANNED JOBS
  const fetchBannedJobs = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/jobs/banned", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setBannedJobs(data);
    } catch (err) {
      console.error("BANNED JOB FETCH ERROR:", err);
    }
  };

  const candidates = users.filter((u) => u.role === "candidate");
  const recruiters = users.filter((u) => u.role === "recruiter");

  const pieData = [
    { name: "Candidates", value: candidates.length },
    { name: "Recruiters", value: recruiters.length },
  ];

  const COLORS = ["#4ade80", "#60a5fa"];

  const banUser = async (email) => {
    await fetch("http://127.0.0.1:5000/api/admin/ban", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    });
    fetchData();
  };

  const deleteUser = async (email) => {
    await fetch("http://127.0.0.1:5000/api/admin/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    });
    fetchData();
  };

  // ✅ BAN JOB FUNCTION
  const banJob = async (jobId) => {
    await fetch(`http://127.0.0.1:5000/api/jobs/ban/${jobId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchData();
  };

  return (
    <div
      style={{
        padding: "30px",
        color: "white",
        display: "flex",
        justifyContent: "center"
      }}
    >

      <div style={{ width: "100%", maxWidth: "900px" }}>

        <h2 style={{ textAlign: "center" }}>Admin Dashboard</h2>

        {/* STATS */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "40px",
          marginBottom: "20px"
        }}>
          <h3>Total Users: {users.length}</h3>
          <h3>Total Jobs: {jobs.length}</h3>
        </div>

        {/* PIE CHART */}
        <h3 style={{ textAlign: "center" }}>User Roles</h3>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <PieChart width={300} height={300}>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>

        {/* TABS */}
        <div style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "center",
          gap: "10px"
        }}>
          <button
            onClick={() => setActiveTab("candidates")}
            style={{
              ...btn,
              background: activeTab === "candidates" ? "#5b9cff" : "#2a2a40"
            }}
          >
            Candidates ({candidates.length})
          </button>

          <button
            onClick={() => setActiveTab("recruiters")}
            style={{
              ...btn,
              background: activeTab === "recruiters" ? "#5b9cff" : "#2a2a40"
            }}
          >
            Recruiters ({recruiters.length})
          </button>

          <button
            onClick={() => setActiveTab("jobs")}
            style={{
              ...btn,
              background: activeTab === "jobs" ? "#5b9cff" : "#2a2a40"
            }}
          >
            Jobs ({jobs.length})
          </button>

          <button
            onClick={() => {
              setActiveTab("bannedJobs");
              fetchBannedJobs();
            }}
            style={{
              ...btn,
              background: activeTab === "bannedJobs" ? "#5b9cff" : "#2a2a40"
            }}
          >
            Banned Jobs ({bannedJobs.length})
          </button>

          {/* ✅ ADDED LOGOUT TAB */}
          <button
            onClick={handleLogout}
            style={{
              ...btn,
              background: "#ef4444"
            }}
          >
            Logout
          </button>
        </div>

        {/* CONTENT */}
        <div style={{ marginTop: "20px" }}>

          {activeTab === "candidates" && (
            <>
              <h3 style={{ textAlign: "center" }}>Candidates</h3>
              {candidates.map((user) => (
                <div key={user.id} style={card}>
                  <p><b>Name:</b> {user.name}</p>
                  <p><b>Email:</b> {user.email}</p>

                  <button onClick={() => banUser(user.email)} style={banBtn}>
                    Ban
                  </button>
                  <button onClick={() => deleteUser(user.email)} style={deleteBtn}>
                    Delete
                  </button>
                </div>
              ))}
            </>
          )}

          {activeTab === "recruiters" && (
            <>
              <h3 style={{ textAlign: "center" }}>Recruiters</h3>
              {recruiters.map((user) => (
                <div key={user.id} style={card}>
                  <p><b>Name:</b> {user.name}</p>
                  <p><b>Email:</b> {user.email}</p>

                  <button onClick={() => banUser(user.email)} style={banBtn}>
                    Ban
                  </button>
                  <button onClick={() => deleteUser(user.email)} style={deleteBtn}>
                    Delete
                  </button>
                </div>
              ))}
            </>
          )}

          {activeTab === "jobs" && (
            <>
              <h3 style={{ textAlign: "center" }}>Jobs</h3>
              {jobs.map((job) => (
                <div key={job.id} style={card}>
                  <p><b>Title:</b> {job.title}</p>
                  <p><b>Description:</b> {job.description}</p>
                  <p><b>Recruiter:</b> {job.recruiter_email}</p>

                  <button onClick={() => banJob(job.id)} style={banBtn}>
                    Ban Job
                  </button>
                </div>
              ))}
            </>
          )}

          {activeTab === "bannedJobs" && (
            <>
              <h3 style={{ textAlign: "center" }}>Banned Jobs</h3>
              {bannedJobs.map((job) => (
                <div key={job.id} style={card}>
                  <p><b>Title:</b> {job.title}</p>
                  <p><b>Description:</b> {job.description}</p>
                  <p><b>Recruiter:</b> {job.recruiter_email}</p>
                </div>
              ))}
            </>
          )}

        </div>

      </div>
    </div>
  );
}

// STYLES
const btn = {
  padding: "8px 16px",
  border: "none",
  borderRadius: "6px",
  color: "white",
  cursor: "pointer",
  transition: "0.2s ease"
};

const card = {
  background: "#1e1e2f",
  padding: "15px",
  borderRadius: "10px",
  marginBottom: "10px",
};

const banBtn = {
  marginRight: "10px",
  padding: "6px 12px",
  background: "#f59e0b",
  border: "none",
  borderRadius: "5px",
  color: "white",
  cursor: "pointer",
};

const deleteBtn = {
  padding: "6px 12px",
  background: "#ef4444",
  border: "none",
  borderRadius: "5px",
  color: "white",
  cursor: "pointer",
};