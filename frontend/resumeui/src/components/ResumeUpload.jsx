import { useState } from "react";

export default function ResumeUpload({ setResult }) {

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {

    if (!file) {
      alert("Please select a file");
      return;
    }

    // 🔥 GET USER DATA FIRST (IMPORTANT)
    const email = localStorage.getItem("email");
    const name = localStorage.getItem("name");

    // 🚨 SAFETY CHECK
    if (!email || !name) {
      alert("User not logged in properly");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    // 🔥 SEND TO BACKEND
    formData.append("email", email);
    formData.append("name", name);

    // 🔍 DEBUG (you SHOULD see this in console)
    console.log("EMAIL:", email);
    console.log("NAME:", name);

    setLoading(true);

    try {

      const res = await fetch("http://127.0.0.1:5000/api/resume/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        alert(data.error || "Upload failed");
        return;
      }

      // ✅ STORE DATA
      localStorage.setItem("resume_text", data.resume_text || "");
      localStorage.setItem("resume_name", file.name);

      if (data.matching_jobs) {
        localStorage.setItem("matched_jobs", JSON.stringify(data.matching_jobs));
      }

      setResult(data);
      setLoading(false);

    } catch (err) {
      setLoading(false);
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <div className="upload-card">

      <h2>Upload Resume</h2>

      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Analyzing..." : "Upload & Analyze"}
      </button>

    </div>
  );
}