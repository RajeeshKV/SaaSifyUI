const DEFAULT_API_BASE_URL = "https://saasifyapi.rajeesh.online";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || DEFAULT_API_BASE_URL;

export function buildHeaders({ token, tenantId, includeJson = true } = {}) {
  const headers = {};

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (tenantId) {
    headers["X-Tenant-Id"] = String(tenantId);
  }

  return headers;
}

async function readResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : null;
}

function normalizeErrorMessage(body, fallback) {
  if (!body) return fallback;
  if (typeof body === "string") return body;
  if (typeof body.error === "string") return body.error;
  if (typeof body.message === "string" && typeof body.details === "string") {
    return `${body.message}: ${body.details}`;
  }
  if (typeof body.message === "string") return body.message;
  if (typeof body.details === "string") return body.details;
  return fallback;
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const body = await readResponseBody(response);

  if (!response.ok) {
    const error = new Error(
      normalizeErrorMessage(body, `Request failed with status ${response.status}`),
    );

    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}
