import { useEffect, useMemo, useState } from "react";
import ResponsePanel from "./components/ResponsePanel";
import StatusPill from "./components/StatusPill";
import { API_BASE_URL, apiRequest, buildHeaders } from "./lib/api";

const SESSION_STORAGE_KEY = "saasify-ui-session";

const emptySession = {
  tenantId: "",
  userId: "",
  email: "",
  role: "",
  token: "",
  refreshToken: "",
  accessTokenExpiresAt: "",
};

const initialAuthForms = {
  login: {
    email: "",
    password: "",
    tenantId: "",
  },
  register: {
    tenantName: "",
    email: "",
    password: "",
  },
};

const initialProjectForms = {
  create: {
    name: "",
  },
  update: {
    id: "",
    name: "",
  },
  delete: {
    id: "",
  },
};

function loadStoredSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? { ...emptySession, ...JSON.parse(raw) } : emptySession;
  } catch {
    return emptySession;
  }
}

function isSessionActive(session) {
  return Boolean(session.token && session.tenantId);
}

function toCurlBlock(session) {
  if (!isSessionActive(session)) {
    return `curl -X POST ${API_BASE_URL}/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","password":"password123","tenantId":1}'`;
  }

  return `curl ${API_BASE_URL}/api/projects \\
  -H "Authorization: Bearer ${session.token}" \\
  -H "X-Tenant-Id: ${session.tenantId}"`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState("login");
  const [session, setSession] = useState(() => loadStoredSession());
  const [authForms, setAuthForms] = useState(initialAuthForms);
  const [projectForms, setProjectForms] = useState(initialProjectForms);
  const [health, setHealth] = useState({ loading: true, data: null, error: "" });
  const [authFeedback, setAuthFeedback] = useState({ message: "", tone: "neutral" });
  const [authLoading, setAuthLoading] = useState(false);
  const [apiFeedback, setApiFeedback] = useState({ message: "", tone: "neutral" });
  const [apiLoading, setApiLoading] = useState("");
  const [lastResponse, setLastResponse] = useState(null);

  useEffect(() => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    let ignore = false;

    async function fetchHealth() {
      try {
        const data = await apiRequest("/api/health");
        if (!ignore) {
          setHealth({ loading: false, data, error: "" });
        }
      } catch (error) {
        if (!ignore) {
          setHealth({ loading: false, data: null, error: error.message });
        }
      }
    }

    fetchHealth();
    return () => {
      ignore = true;
    };
  }, []);

  const sessionExpiryLabel = useMemo(() => {
    if (!session.accessTokenExpiresAt) return "No active token";
    const date = new Date(session.accessTokenExpiresAt);
    return Number.isNaN(date.getTime()) ? session.accessTokenExpiresAt : date.toLocaleString();
  }, [session.accessTokenExpiresAt]);

  function updateAuthForm(form, field, value) {
    setAuthForms((current) => ({
      ...current,
      [form]: {
        ...current[form],
        [field]: value,
      },
    }));
  }

  function updateProjectForm(form, field, value) {
    setProjectForms((current) => ({
      ...current,
      [form]: {
        ...current[form],
        [field]: value,
      },
    }));
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthFeedback({ message: "", tone: "neutral" });

    const isLogin = activeTab === "login";
    const payload = isLogin
      ? {
          ...authForms.login,
          tenantId: Number(authForms.login.tenantId),
        }
      : authForms.register;

    try {
      const data = await apiRequest(`/api/auth/${activeTab}`, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(payload),
      });

      setSession({
        tenantId: data.tenantId,
        userId: data.userId,
        email: data.email,
        role: data.role,
        token: data.token,
        refreshToken: data.refreshToken,
        accessTokenExpiresAt: data.accessTokenExpiresAt,
      });
      setAuthFeedback({
        message: isLogin
          ? "Login successful. Protected endpoints are ready to use."
          : "Registration successful. Your tenant and admin session are ready.",
        tone: "success",
      });
      setLastResponse({ title: `${activeTab} response`, value: data, tone: "success" });
      if (!isLogin) {
        setActiveTab("login");
        setAuthForms((current) => ({
          ...current,
          login: {
            email: data.email,
            password: "",
            tenantId: String(data.tenantId),
          },
          register: initialAuthForms.register,
        }));
      } else {
        setAuthForms((current) => ({
          ...current,
          login: {
            ...current.login,
            password: "",
          },
        }));
      }
    } catch (error) {
      setAuthFeedback({ message: error.message, tone: "error" });
      setLastResponse({
        title: `${activeTab} error`,
        value: error.body || error.message,
        tone: "error",
      });
    } finally {
      setAuthLoading(false);
    }
  }

  async function runProtectedRequest(label, requestFactory) {
    if (!isSessionActive(session)) {
      setApiFeedback({
        message: "Log in or register first so the app can attach your JWT and tenant header.",
        tone: "error",
      });
      return;
    }

    setApiLoading(label);
    setApiFeedback({ message: "", tone: "neutral" });

    try {
      const data = await requestFactory();
      setApiFeedback({ message: `${label} completed successfully.`, tone: "success" });
      setLastResponse({ title: label, value: data ?? "204 No Content", tone: "success" });
    } catch (error) {
      setApiFeedback({ message: error.message, tone: "error" });
      setLastResponse({ title: `${label} error`, value: error.body || error.message, tone: "error" });
    } finally {
      setApiLoading("");
    }
  }

  function getProtectedHeaders(includeJson = true) {
    return buildHeaders({
      token: session.token,
      tenantId: session.tenantId,
      includeJson,
    });
  }

  async function listProjects() {
    await runProtectedRequest("List projects", () =>
      apiRequest("/api/projects", {
        headers: getProtectedHeaders(),
      }),
    );
  }

  async function createProject(event) {
    event.preventDefault();
    await runProtectedRequest("Create project", () =>
      apiRequest("/api/projects", {
        method: "POST",
        headers: getProtectedHeaders(),
        body: JSON.stringify({
          name: projectForms.create.name,
        }),
      }),
    );
    setProjectForms((current) => ({
      ...current,
      create: initialProjectForms.create,
    }));
  }

  async function updateProject(event) {
    event.preventDefault();
    await runProtectedRequest("Update project", () =>
      apiRequest(`/api/projects/${projectForms.update.id}`, {
        method: "PUT",
        headers: getProtectedHeaders(),
        body: JSON.stringify({
          id: Number(projectForms.update.id),
          name: projectForms.update.name,
        }),
      }),
    );
  }

  async function deleteProject(event) {
    event.preventDefault();
    await runProtectedRequest("Delete project", () =>
      apiRequest(`/api/projects/${projectForms.delete.id}`, {
        method: "DELETE",
        headers: getProtectedHeaders(false),
      }),
    );
    setProjectForms((current) => ({
      ...current,
      delete: initialProjectForms.delete,
    }));
  }

  async function refreshSession() {
    await runProtectedRequest("Refresh token", async () => {
      const data = await apiRequest("/api/auth/refresh", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          refreshToken: session.refreshToken,
        }),
      });

      setSession({
        tenantId: data.tenantId,
        userId: data.userId,
        email: data.email,
        role: data.role,
        token: data.token,
        refreshToken: data.refreshToken,
        accessTokenExpiresAt: data.accessTokenExpiresAt,
      });

      return data;
    });
  }

  async function revokeSession() {
    await runProtectedRequest("Revoke token", async () => {
      const data = await apiRequest("/api/auth/revoke", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          refreshToken: session.refreshToken,
        }),
      });

      setSession(emptySession);
      return data;
    });
  }

  function signOutLocally() {
    setSession(emptySession);
    setApiFeedback({ message: "Local session cleared from this browser.", tone: "success" });
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient--left" />
      <div className="ambient ambient--right" />

      <header className="topbar">
        <div>
          <span className="eyebrow">RAJEESH KV STYLE</span>
          <a className="brand" href="#home">
            SaaSify UI
          </a>
        </div>
        <nav className="topbar__nav">
          <a href="#auth">Auth</a>
          <a href="#playground">Playground</a>
          <a href="#flow">Flow</a>
        </nav>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero__copy">
            <span className="eyebrow">MULTI-TENANT SAAS BACKEND</span>
            <h1>
              A frontend shell for secure tenant-aware API access.
            </h1>
            <p>
              This UI sits on top of the .NET 8 backend from
              Rajeesh KV and makes its workflow visible: create a tenant,
              authenticate with JWT, attach the right tenant context, and
              operate on protected project endpoints without guessing headers.
            </p>
            <div className="hero__actions">
              <a className="button button--primary" href="#auth">
                Login or Register
              </a>
              <a className="button button--ghost" href="#playground">
                Use Protected APIs
              </a>
            </div>

            <div className="hero__chips">
              <StatusPill
                label={
                  health.loading
                    ? "Checking backend"
                    : health.data
                      ? `API ${health.data.status}`
                      : "Backend unreachable"
                }
                tone={health.data ? "success" : health.loading ? "neutral" : "error"}
              />
              <StatusPill label="JWT Auth" tone="neutral" />
              <StatusPill label="Tenant Isolation" tone="neutral" />
              <StatusPill label="Project CRUD" tone="neutral" />
            </div>
          </div>

          <div className="terminal-card">
            <div className="terminal-card__header">
              <span />
              <span />
              <span />
              <strong>backend-ready.sh</strong>
            </div>
            <div className="terminal-card__body">
              <p>$ curl {API_BASE_URL}/api/health</p>
              <p className="muted">
                {health.data
                  ? JSON.stringify(health.data)
                  : health.error || "Waiting for API response..."}
              </p>
              <p>$ POST /api/auth/login</p>
              <p className="muted">Requires email, password, and tenantId.</p>
              <p>$ GET /api/projects</p>
              <p className="success">
                Requires Bearer token + X-Tenant-Id header.
              </p>
            </div>
          </div>
        </section>

        <section className="grid-section" id="auth">
          <article className="glass-card auth-card">
            <div className="section-heading">
              <span className="eyebrow">AUTH ACCESS</span>
              <h2>Register a tenant or log in to unlock the API.</h2>
              <p>
                Registration provisions a tenant and admin account. Login expects
                the exact `tenantId` returned from registration.
              </p>
            </div>

            <div className="tab-row">
              <button
                className={activeTab === "login" ? "tab is-active" : "tab"}
                type="button"
                onClick={() => setActiveTab("login")}
              >
                Login
              </button>
              <button
                className={activeTab === "register" ? "tab is-active" : "tab"}
                type="button"
                onClick={() => setActiveTab("register")}
              >
                Register
              </button>
            </div>

            <form className="form-grid" onSubmit={handleAuthSubmit}>
              {activeTab === "register" ? (
                <label>
                  <span>Tenant name</span>
                  <input
                    value={authForms.register.tenantName}
                    onChange={(event) =>
                      updateAuthForm("register", "tenantName", event.target.value)
                    }
                    placeholder="Acme Labs"
                    required
                  />
                </label>
              ) : (
                <label>
                  <span>Tenant ID</span>
                  <input
                    value={authForms.login.tenantId}
                    onChange={(event) =>
                      updateAuthForm("login", "tenantId", event.target.value)
                    }
                    placeholder="1"
                    inputMode="numeric"
                    required
                  />
                </label>
              )}

              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={authForms[activeTab].email}
                  onChange={(event) => updateAuthForm(activeTab, "email", event.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </label>

              <label>
                <span>Password</span>
                <input
                  type="password"
                  value={authForms[activeTab].password}
                  onChange={(event) =>
                    updateAuthForm(activeTab, "password", event.target.value)
                  }
                  placeholder="password123"
                  required
                />
              </label>

              <button className="button button--primary button--wide" disabled={authLoading}>
                {authLoading
                  ? `${activeTab === "login" ? "Logging in" : "Registering"}...`
                  : activeTab === "login"
                    ? "Start Session"
                    : "Create Tenant & Session"}
              </button>
            </form>

            {authFeedback.message ? (
              <div className={`notice notice--${authFeedback.tone}`}>{authFeedback.message}</div>
            ) : null}
          </article>

          <article className="glass-card session-card">
            <div className="section-heading">
              <span className="eyebrow">SESSION STATE</span>
              <h2>Keep the headers correct automatically.</h2>
              <p>
                Once authenticated, the app stores your tenant ID, access token,
                refresh token, and expiry so every protected request is formed in
                the backend’s expected way.
              </p>
            </div>

            <dl className="session-grid">
              <div>
                <dt>Tenant</dt>
                <dd>{session.tenantId || "Not set"}</dd>
              </div>
              <div>
                <dt>User</dt>
                <dd>{session.email || "Anonymous"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{session.role || "Unknown"}</dd>
              </div>
              <div>
                <dt>Access Expires</dt>
                <dd>{sessionExpiryLabel}</dd>
              </div>
            </dl>

            <div className="code-block">
              <div className="code-block__label">Generated curl</div>
              <pre>{toCurlBlock(session)}</pre>
            </div>

            <div className="session-actions">
              <button
                className="button button--ghost"
                type="button"
                onClick={refreshSession}
                disabled={!isSessionActive(session) || apiLoading === "Refresh token"}
              >
                Refresh Token
              </button>
              <button
                className="button button--ghost"
                type="button"
                onClick={revokeSession}
                disabled={!session.refreshToken || apiLoading === "Revoke token"}
              >
                Revoke Token
              </button>
              <button className="button button--subtle" type="button" onClick={signOutLocally}>
                Clear Local Session
              </button>
            </div>
          </article>
        </section>

        <section className="grid-section grid-section--wide" id="playground">
          <article className="glass-card playground-card">
            <div className="section-heading">
              <span className="eyebrow">API PLAYGROUND</span>
              <h2>Exercise the protected project endpoints.</h2>
              <p>
                Every request adds `Authorization: Bearer &lt;token&gt;` and
                `X-Tenant-Id` from the active session, which is exactly what this
                backend needs for project access.
              </p>
            </div>

            <div className="action-row">
              <button
                className="button button--primary"
                type="button"
                onClick={listProjects}
                disabled={apiLoading === "List projects"}
              >
                {apiLoading === "List projects" ? "Loading..." : "List Projects"}
              </button>
            </div>

            <div className="playground-grid">
              <form className="mini-form" onSubmit={createProject}>
                <h3>Create Project</h3>
                <label>
                  <span>Name</span>
                  <input
                    value={projectForms.create.name}
                    onChange={(event) =>
                      updateProjectForm("create", "name", event.target.value)
                    }
                    placeholder="Roadmap Portal"
                    required
                  />
                </label>
                <button
                  className="button button--ghost button--wide"
                  disabled={apiLoading === "Create project"}
                >
                  {apiLoading === "Create project" ? "Creating..." : "POST /api/projects"}
                </button>
              </form>

              <form className="mini-form" onSubmit={updateProject}>
                <h3>Update Project</h3>
                <label>
                  <span>Project ID</span>
                  <input
                    value={projectForms.update.id}
                    onChange={(event) => updateProjectForm("update", "id", event.target.value)}
                    placeholder="1"
                    inputMode="numeric"
                    required
                  />
                </label>
                <label>
                  <span>New name</span>
                  <input
                    value={projectForms.update.name}
                    onChange={(event) =>
                      updateProjectForm("update", "name", event.target.value)
                    }
                    placeholder="Roadmap Portal v2"
                    required
                  />
                </label>
                <button
                  className="button button--ghost button--wide"
                  disabled={apiLoading === "Update project"}
                >
                  {apiLoading === "Update project" ? "Updating..." : "PUT /api/projects/:id"}
                </button>
              </form>

              <form className="mini-form" onSubmit={deleteProject}>
                <h3>Delete Project</h3>
                <label>
                  <span>Project ID</span>
                  <input
                    value={projectForms.delete.id}
                    onChange={(event) => updateProjectForm("delete", "id", event.target.value)}
                    placeholder="1"
                    inputMode="numeric"
                    required
                  />
                </label>
                <button
                  className="button button--ghost button--wide"
                  disabled={apiLoading === "Delete project"}
                >
                  {apiLoading === "Delete project" ? "Deleting..." : "DELETE /api/projects/:id"}
                </button>
              </form>
            </div>

            {apiFeedback.message ? (
              <div className={`notice notice--${apiFeedback.tone}`}>{apiFeedback.message}</div>
            ) : null}
          </article>

          <aside className="glass-card flow-card" id="flow">
            <div className="section-heading">
              <span className="eyebrow">REQUEST FLOW</span>
              <h2>How this UI maps to the backend.</h2>
            </div>
            <ol className="flow-list">
              <li>Register creates a tenant and admin account, then returns JWT and refresh tokens.</li>
              <li>Login requires `email`, `password`, and the correct `tenantId`.</li>
              <li>Protected project requests attach both Bearer auth and `X-Tenant-Id`.</li>
              <li>Refresh rotates the refresh token and updates the access token expiry.</li>
              <li>Errors from auth, tenant validation, and server middleware are surfaced directly in the UI.</li>
            </ol>

            <div className="code-block">
              <div className="code-block__label">API base URL</div>
              <pre>{API_BASE_URL}</pre>
            </div>

            <p className="flow-note">
              Set `VITE_API_BASE_URL` if your backend runs somewhere other than
              `https://localhost:5001`.
            </p>
          </aside>
        </section>

        <section className="response-section">
          <ResponsePanel
            title={lastResponse?.title}
            value={lastResponse?.value}
            tone={lastResponse?.tone}
          />
        </section>
      </main>
    </div>
  );
}
