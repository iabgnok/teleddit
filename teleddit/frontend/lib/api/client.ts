// lib/api/client.ts
// 使用原生的 fetch API 构建核心请求客户端
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

  // 这里的 Token 管理后续可以放 localStorage 也可以放 cookies
  let token = "";
  if (typeof window !== "undefined") {
    token = localStorage.getItem("access_token") || "";
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${endpoint}`;

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
}

export async function uploadFile(file: File): Promise<{ url: string }> {
  // 1. Get auth token
  let token = "";
  if (typeof window !== "undefined") {
    token = localStorage.getItem("access_token") || "";
  }

  // 2. Prepare FormData
  const formData = new FormData();
  formData.append("file", file);

  // 3. Send Request
  // Note: Do NOT set Content-Type header manually for FormData, 
  // browser will set it with boundary automatically.
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

