import API_BASE_URL from "./api";


/* ------------------ GET ALL JOBS ------------------ */
export const getAllJobs = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/jobs/all`);

    if (!res.ok) {
      throw new Error("Failed to fetch jobs");
    }

    return await res.json();

  } catch (err) {
    console.error("Get jobs error:", err);
    return [];
  }
};


/* ------------------ SKILL GAP ------------------ */
export const getSkillGap = async (resumeText, jobDescription) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/skills/gap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resume_text: resumeText,
        job_description: jobDescription,
      }),
    });

    if (!res.ok) {
      throw new Error("Skill gap analysis failed");
    }

    return await res.json();

  } catch (err) {
    console.error("Skill gap error:", err);
    return { error: "Backend not connected" };
  }
};