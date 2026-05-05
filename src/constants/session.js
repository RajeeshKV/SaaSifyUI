export const SESSION_STORAGE_KEY = "saasify-ui-session";

export const emptySession = {
  tenantId: "",
  tenantName: "",
  userId: "",
  email: "",
  role: "",
  token: "",
  refreshToken: "",
  accessTokenExpiresAt: "",
  isEmailVerified: true,
};

export const initialAuthForms = {
  login: {
    email: "",
    password: "",
  },
  register: {
    tenantName: "",
    name: "",
    email: "",
    password: "",
  },
};

export function loadStoredSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? { ...emptySession, ...JSON.parse(raw) } : emptySession;
  } catch {
    return emptySession;
  }
}

export function isSessionActive(session) {
  return Boolean(session.token && session.tenantId);
}

export function toCurlBlock(session, API_BASE_URL) {
  if (!isSessionActive(session)) {
    return `curl -X POST ${API_BASE_URL}/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","password":"password123","tenantId":1}'`;
  }

  return `curl ${API_BASE_URL}/api/v1/projects \\
  -H "Authorization: Bearer ${session.token}" \\
  -H "X-Tenant-Id: ${session.tenantId}"`;
}

export function mapProjectsResponse(data) {
  return Array.isArray(data) ? data : [];
}
