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

function mapProjectsResponse(data) {
  return Array.isArray(data) ? data : [];
}

export default function App() {
  const [session, setSession] = useState(() => loadStoredSession());
  const [activeTab, setActiveTab] = useState("login");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authForms, setAuthForms] = useState(initialAuthForms);
  const [authFeedback, setAuthFeedback] = useState({ message: "", tone: "neutral" });
  const [authLoading, setAuthLoading] = useState(false);
  const [health, setHealth] = useState({ loading: true, data: null, error: "" });
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectDrafts, setProjectDrafts] = useState({});
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [newProjectName, setNewProjectName] = useState("");
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

  useEffect(() => {
    if (isSessionActive(session)) {
      setShowAuthModal(false);
      void fetchProjects();
    } else {
      setProjects([]);
      setProjectDrafts({});
      setSelectedProjectIds([]);
    }
  }, [session.token, session.tenantId]);

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

  function setFeedback(setter, message, tone) {
    setter({ message, tone });
  }

  function applySession(data) {
    setSession({
      tenantId: data.tenantId,
      userId: data.userId,
      email: data.email,
      role: data.role,
      token: data.token,
      refreshToken: data.refreshToken,
      accessTokenExpiresAt: data.accessTokenExpiresAt,
    });
  }

  function getProtectedHeaders(includeJson = true) {
    return buildHeaders({
      token: session.token,
      tenantId: session.tenantId,
      includeJson,
    });
  }

  function syncProjectDrafts(items) {
    setProjectDrafts((current) => {
      const next = {};
      items.forEach((project) => {
        next[project.id] = current[project.id] ?? project.name;
      });
      return next;
    });
  }

  async function runProtectedRequest(label, requestFactory, options = {}) {
    if (!isSessionActive(session)) {
      setFeedback(
        setApiFeedback,
        "Open login or register first so the app can attach your JWT and tenant header.",
        "error",
      );
      return null;
    }

    setApiLoading(label);
    setApiFeedback({ message: "", tone: "neutral" });

    try {
      const data = await requestFactory();
      if (!options.silentSuccess) {
        setFeedback(setApiFeedback, `${label} completed successfully.`, "success");
      }
      setLastResponse({ title: label, value: data ?? "204 No Content", tone: "success" });
      return data;
    } catch (error) {
      setFeedback(setApiFeedback, error.message, "error");
      setLastResponse({ title: `${label} error`, value: error.body || error.message, tone: "error" });
      return null;
    } finally {
      setApiLoading("");
    }
  }

  async function fetchProjects() {
    setProjectsLoading(true);
    const data = await runProtectedRequest(
      "List projects",
      () =>
        apiRequest("/api/projects", {
          headers: getProtectedHeaders(),
        }),
      { silentSuccess: true },
    );
    if (data) {
      const items = mapProjectsResponse(data);
      setProjects(items);
      syncProjectDrafts(items);
      setSelectedProjectIds((current) =>
        current.filter((projectId) => items.some((item) => item.id === projectId)),
      );
    }
    setProjectsLoading(false);
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

      applySession(data);
      setLastResponse({ title: `${activeTab} response`, value: data, tone: "success" });
      setFeedback(
        setAuthFeedback,
        isLogin
          ? "Login successful. Redirecting you into the API workspace."
          : "Tenant created. You are now inside the workspace.",
        "success",
      );

      if (!isLogin) {
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
      setFeedback(setAuthFeedback, error.message, "error");
      setLastResponse({
        title: `${activeTab} error`,
        value: error.body || error.message,
        tone: "error",
      });
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleCreateProject(event) {
    event.preventDefault();
    if (!newProjectName.trim()) return;

    const data = await runProtectedRequest("Create project", () =>
      apiRequest("/api/projects", {
        method: "POST",
        headers: getProtectedHeaders(),
        body: JSON.stringify({ name: newProjectName.trim() }),
      }),
    );

    if (data) {
      setNewProjectName("");
      await fetchProjects();
    }
  }

  async function handleInlineUpdate(projectId) {
    const name = (projectDrafts[projectId] || "").trim();
    if (!name) {
      setFeedback(setApiFeedback, "Project name cannot be empty.", "error");
      return;
    }

    const data = await runProtectedRequest(`Update project #${projectId}`, () =>
      apiRequest(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: getProtectedHeaders(),
        body: JSON.stringify({
          id: Number(projectId),
          name,
        }),
      }),
    );

    if (data) {
      setProjects((current) =>
        current.map((project) => (project.id === projectId ? { ...project, name } : project)),
      );
    }
  }

  async function handleDeleteProject(projectId) {
    const data = await runProtectedRequest(`Delete project #${projectId}`, () =>
      apiRequest(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers: getProtectedHeaders(false),
      }),
    );

    if (data !== null || apiLoading === "") {
      setProjects((current) => current.filter((project) => project.id !== projectId));
      setSelectedProjectIds((current) => current.filter((id) => id !== projectId));
      setProjectDrafts((current) => {
        const next = { ...current };
        delete next[projectId];
        return next;
      });
    }
  }

  async function refreshSession() {
    const data = await runProtectedRequest("Refresh token", () =>
      apiRequest("/api/auth/refresh", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          refreshToken: session.refreshToken,
        }),
      }),
    );

    if (data) {
      applySession(data);
    }
  }

  async function revokeSession() {
    const data = await runProtectedRequest("Revoke token", () =>
      apiRequest("/api/auth/revoke", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          refreshToken: session.refreshToken,
        }),
      }),
    );

    if (data !== null || apiLoading === "") {
      setSession(emptySession);
    }
  }

  function signOutLocally() {
    setSession(emptySession);
    setFeedback(setApiFeedback, "Local session cleared from this browser.", "success");
  }

  function toggleProjectSelection(projectId) {
    setSelectedProjectIds((current) =>
      current.includes(projectId)
        ? current.filter((id) => id !== projectId)
        : [...current, projectId],
    );
  }

  function openAuthModal(mode = "login") {
    setActiveTab(mode);
    setShowAuthModal(true);
    setAuthFeedback({ message: "", tone: "neutral" });
  }

  const selectedCount = selectedProjectIds.length;
  const authenticated = isSessionActive(session);

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
          {authenticated ? (
            <>
              <button className="nav-button" type="button" onClick={fetchProjects}>
                Refresh Grid
              </button>
              <button className="nav-button" type="button" onClick={signOutLocally}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button className="nav-button" type="button" onClick={() => openAuthModal("login")}>
                Login
              </button>
              <button className="nav-button nav-button--accent" type="button" onClick={() => openAuthModal("register")}>
                Register
              </button>
            </>
          )}
        </nav>
      </header>

      <main>
        {!authenticated ? (
          <>
            <section className="hero hero--landing" id="home">
              <div className="hero__copy">
                <span className="eyebrow">MULTI-TENANT SAAS BACKEND</span>
                <h1>Explain first. Authenticate second. Operate beautifully after.</h1>
                <p>
                  SaaSify UI is now designed as a proper front door for the backend:
                  a strong project explanation up front, auth tucked into a popup,
                  and a cleaner post-login workspace for managing project endpoints
                  with less friction and better feedback.
                </p>
                <div className="hero__actions">
                  <button className="button button--primary" type="button" onClick={() => openAuthModal("login")}>
                    Open Login
                  </button>
                  <button className="button button--ghost" type="button" onClick={() => openAuthModal("register")}>
                    Create Tenant
                  </button>
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
                  <StatusPill label="Popup Auth" tone="neutral" />
                  <StatusPill label="Workspace Grid" tone="neutral" />
                  <StatusPill label="Inline Updates" tone="neutral" />
                </div>
              </div>

              <div className="terminal-card">
                <div className="terminal-card__header">
                  <span />
                  <span />
                  <span />
                  <strong>workspace-preview.sh</strong>
                </div>
                <div className="terminal-card__body">
                  <p>$ curl {API_BASE_URL}/api/health</p>
                  <p className="muted">
                    {health.data
                      ? JSON.stringify(health.data)
                      : health.error || "Waiting for API response..."}
                  </p>
                  <p>$ Login / Register</p>
                  <p className="muted">Handled in a modal instead of taking over the landing page.</p>
                  <p>$ Manage /api/projects</p>
                  <p className="success">Inline edit, inline delete, and future bulk actions.</p>
                </div>
              </div>
            </section>

            <section className="landing-grid">
              <article className="glass-card feature-card">
                <span className="eyebrow">WHAT THIS PROJECT IS</span>
                <h2>A frontend console for a tenant-aware .NET backend.</h2>
                <p>
                  The backend handles authentication, tenant isolation, refresh tokens,
                  and project CRUD. This UI focuses on making those capabilities usable
                  instead of exposing raw forms and disconnected endpoint blocks.
                </p>
              </article>

              <article className="glass-card feature-card">
                <span className="eyebrow">FLOW</span>
                <h2>From hero to workspace without losing context.</h2>
                <p>
                  Users land on an explanation-first hero, open auth only when needed,
                  and then move into a dedicated dashboard where API operations feel like
                  product actions rather than demo requests.
                </p>
              </article>
            </section>
          </>
        ) : (
          <>
            <section className="workspace-hero">
              <div>
                <span className="eyebrow">PROJECT WORKSPACE</span>
                <h1>Manage protected endpoints from a cleaner signed-in page.</h1>
                <p>
                  You are signed in as <strong>{session.email}</strong> for tenant{" "}
                  <strong>{session.tenantId}</strong>. Create, edit, delete, refresh,
                  and inspect project state inline from the grid below.
                </p>
              </div>
              <div className="workspace-hero__actions">
                <button className="button button--primary" type="button" onClick={fetchProjects}>
                  {projectsLoading ? "Refreshing..." : "Refresh Projects"}
                </button>
                <button className="button button--ghost" type="button" onClick={refreshSession}>
                  Refresh Token
                </button>
              </div>
            </section>

            <section className="workspace-grid">
              <article className="glass-card workspace-main">
                <div className="section-heading section-heading--compact">
                  <span className="eyebrow">API ENDPOINTS</span>
                  <h2>Projects grid with inline actions.</h2>
                  <p>
                    Create records quickly, edit names inline, remove rows inline,
                    and select multiple projects now so the future bulk update API can slot in cleanly.
                  </p>
                </div>

                <div className="toolbar">
                  <form className="toolbar__create" onSubmit={handleCreateProject}>
                    <input
                      value={newProjectName}
                      onChange={(event) => setNewProjectName(event.target.value)}
                      placeholder="Create a new project"
                    />
                    <button
                      className="button button--primary"
                      disabled={apiLoading === "Create project" || !newProjectName.trim()}
                    >
                      {apiLoading === "Create project" ? "Creating..." : "Add Project"}
                    </button>
                  </form>

                  <div className="bulk-panel">
                    <div>
                      <strong>{selectedCount}</strong> selected
                      <span>Bulk rename will plug in once the API supports multi-update.</span>
                    </div>
                    <button className="button button--subtle" type="button" disabled>
                      Bulk Update Coming Soon
                    </button>
                  </div>
                </div>

                {apiFeedback.message ? (
                  <div className={`notice notice--${apiFeedback.tone}`}>{apiFeedback.message}</div>
                ) : null}

                <div className="project-grid">
                  {projectsLoading ? (
                    <div className="empty-state">Loading project cards...</div>
                  ) : projects.length === 0 ? (
                    <div className="empty-state">
                      No projects found yet. Create one above to populate the workspace.
                    </div>
                  ) : (
                    projects.map((project) => (
                      <article className="project-card" key={project.id}>
                        <div className="project-card__top">
                          <label className="selector">
                            <input
                              type="checkbox"
                              checked={selectedProjectIds.includes(project.id)}
                              onChange={() => toggleProjectSelection(project.id)}
                            />
                            <span>Select</span>
                          </label>
                          <StatusPill label={`Project #${project.id}`} tone="neutral" />
                        </div>

                        <div className="project-card__body">
                          <label>
                            <span>Name</span>
                            <input
                              value={projectDrafts[project.id] ?? project.name}
                              onChange={(event) =>
                                setProjectDrafts((current) => ({
                                  ...current,
                                  [project.id]: event.target.value,
                                }))
                              }
                            />
                          </label>
                        </div>

                        <div className="project-card__actions">
                          <button
                            className="button button--ghost"
                            type="button"
                            onClick={() => handleInlineUpdate(project.id)}
                            disabled={apiLoading === `Update project #${project.id}`}
                          >
                            {apiLoading === `Update project #${project.id}` ? "Saving..." : "Save"}
                          </button>
                          <button
                            className="button button--danger"
                            type="button"
                            onClick={() => handleDeleteProject(project.id)}
                            disabled={apiLoading === `Delete project #${project.id}`}
                          >
                            {apiLoading === `Delete project #${project.id}` ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </article>

              <aside className="glass-card workspace-side">
                <div className="section-heading section-heading--compact">
                  <span className="eyebrow">SESSION</span>
                  <h2>Live auth context.</h2>
                </div>

                <dl className="session-grid">
                  <div>
                    <dt>Tenant</dt>
                    <dd>{session.tenantId}</dd>
                  </div>
                  <div>
                    <dt>User</dt>
                    <dd>{session.email}</dd>
                  </div>
                  <div>
                    <dt>Role</dt>
                    <dd>{session.role}</dd>
                  </div>
                  <div>
                    <dt>Expires</dt>
                    <dd>{sessionExpiryLabel}</dd>
                  </div>
                </dl>

                <div className="code-block">
                  <div className="code-block__label">Generated curl</div>
                  <pre>{toCurlBlock(session)}</pre>
                </div>

                <div className="stack-actions">
                  <button className="button button--ghost button--wide" type="button" onClick={refreshSession}>
                    Refresh Token
                  </button>
                  <button className="button button--ghost button--wide" type="button" onClick={revokeSession}>
                    Revoke Token
                  </button>
                  <button className="button button--subtle button--wide" type="button" onClick={signOutLocally}>
                    Clear Local Session
                  </button>
                </div>

                <div className="code-block">
                  <div className="code-block__label">API base URL</div>
                  <pre>{API_BASE_URL}</pre>
                </div>
              </aside>
            </section>

            <section className="response-section">
              <ResponsePanel
                title={lastResponse?.title}
                value={lastResponse?.value}
                tone={lastResponse?.tone}
              />
            </section>
          </>
        )}
      </main>

      {showAuthModal ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="auth-modal__header">
              <div>
                <span className="eyebrow">AUTH ACCESS</span>
                <h2>{activeTab === "login" ? "Welcome back." : "Create your tenant."}</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setShowAuthModal(false)}>
                ×
              </button>
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
                    onChange={(event) => updateAuthForm("register", "tenantName", event.target.value)}
                    placeholder="Acme Labs"
                    required
                  />
                </label>
              ) : (
                <label>
                  <span>Tenant ID</span>
                  <input
                    value={authForms.login.tenantId}
                    onChange={(event) => updateAuthForm("login", "tenantId", event.target.value)}
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
                  onChange={(event) => updateAuthForm(activeTab, "password", event.target.value)}
                  placeholder="password123"
                  required
                />
              </label>

              <button className="button button--primary button--wide" disabled={authLoading}>
                {authLoading
                  ? `${activeTab === "login" ? "Logging in" : "Registering"}...`
                  : activeTab === "login"
                    ? "Enter Workspace"
                    : "Create Tenant & Enter"}
              </button>
            </form>

            {authFeedback.message ? (
              <div className={`notice notice--${authFeedback.tone}`}>{authFeedback.message}</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
