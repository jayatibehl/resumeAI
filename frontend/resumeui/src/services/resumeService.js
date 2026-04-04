import API_BASE_URL from "./api";

export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append("file", file); // backend expects "file"

  try {
    const res = await fetch(`${API_BASE_URL}/api/resume/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Upload failed");
    }

    return await res.json();
  } catch (err) {
    console.error("Resume upload error:", err);
    return { error: "Backend not connected" };
  }
};