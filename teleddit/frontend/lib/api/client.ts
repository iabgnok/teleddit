// lib/api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requireAuth = true, headers: customHeaders, ...restOptions } = options;

  const headers = new Headers(customHeaders);
  headers.set("Content-Type", "application/json");

  let token = "";
  if (typeof window !== "undefined") {
    token = localStorage.getItem("access_token") || "";
  }

  if (requireAuth && !token) {
    throw new Error("Not authenticated");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers,
      ...restOptions,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = typeof errorData.detail === 'object'
        ? JSON.stringify(errorData.detail)
        : errorData.detail;
      throw new Error(errorMsg || "API Request Failed");
    }

    return response.json();
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      console.error("Network or CORS error. Is the backend running at", API_BASE_URL, "?");
    }
    throw err;
  }
}

export async function uploadFile(file: File): Promise<{ url: string }> {
  let token = "";
  if (typeof window !== "undefined") {
    token = localStorage.getItem("access_token") || "";
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload/image`, {
    method: "POST",
    headers: {
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Upload Failed");
  }

  return response.json();
}
