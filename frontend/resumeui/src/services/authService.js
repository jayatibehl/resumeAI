import API_BASE_URL from "./api";

export const registerUser = async (data) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error("Registration failed");
    }

    return await res.json();
  } catch (err) {
    console.error("Register error:", err);
    return { error: "Backend not connected" };
  }
};

export const loginUser = async (data) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error("Login failed");
    }

    return await res.json();
  } catch (err) {
    console.error("Login error:", err);
    return { error: "Backend not connected" };
  }
};