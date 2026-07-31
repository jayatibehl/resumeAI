import { useState, useEffect } from "react";

export default function ResumeUpload({ setResult }) {

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  // step animation for parsing visualization
  useEffect(() => {
    if (loading) {
      setStep(0);
      const interval = setInterval(() => {
        setStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 800);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleUpload = async () => {

    if (!file) {
      alert("Please select a file");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Session expired. Please login again.");
      window.location.href = "/";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);

    try {

      const res = await fetch("http://127.0.0.1:5000/api/resume/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData
      });

      // handle unauthorized
      if (res.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        window.location.href = "/";
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Upload failed");
        return;
      }

      // store results
      localStorage.setItem("resume_text", data.resume_text || "");
      localStorage.setItem("resume_name", file.name);

      if (data.matching_jobs) {
        localStorage.setItem("matched_jobs", JSON.stringify(data.matching_jobs));
      }

      setResult(data);

    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoading(false);
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

      {/* parsing visualization */}
      {loading && (
        <div className="analysis-loader">

          <div className="spinner"></div>

          <h3>Analyzing your resume...</h3>

          <div className="steps">
            <p className={step >= 0 ? "active" : ""}>
              Extracting resume text...
            </p>
            <p className={step >= 1 ? "active" : ""}>
              Identifying skills...
            </p>
            <p className={step >= 2 ? "active" : ""}>
              Evaluating experience...
            </p>
            <p className={step >= 3 ? "active" : ""}>
              Matching job roles...
            </p>
          </div>

        </div>
      )}

    </div>
  );
}