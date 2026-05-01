import { useEffect, useMemo, useState } from "react";
import ResponsePanel from "./components/ResponsePanel";
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
      if (error.status === 401) {
        setSession(emptySession);
        setFeedback(setApiFeedback, "Session expired or token invalid. You have been signed out.", "error");
        setLastResponse({ title: `${label} (unauthorized)`, value: error.body || error.message, tone: "error" });
        return null;
      }
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
      ? authForms.login
      : authForms.register;

    try {
      const data = await apiRequest(`/api/Auth/${activeTab}`, {
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
      await fetchProjects();
    }
  }

  async function handleDeleteProject(projectId) {
    const ok = await runProtectedRequest(`Delete project #${projectId}`, () =>
      apiRequest(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers: getProtectedHeaders(false),
      }),
    );

    if (ok !== null || apiLoading === "") {
      await fetchProjects();
    }
  }

  async function handleBulkUpdate() {
    if (selectedProjectIds.length === 0) return;

    for (const projectId of selectedProjectIds) {
      const name = (projectDrafts[projectId] || "").trim();
      if (!name) continue;

      await runProtectedRequest(`Update project #${projectId}`, () =>
        apiRequest(`/api/projects/${projectId}`, {
          method: "PUT",
          headers: getProtectedHeaders(),
          body: JSON.stringify({ id: Number(projectId), name }),
        }),
      );
    }

    setSelectedProjectIds([]);
    await fetchProjects();
  }

  async function handleBulkDelete() {
    if (selectedProjectIds.length === 0) return;

    for (const projectId of [...selectedProjectIds]) {
      await runProtectedRequest(`Delete project #${projectId}`, () =>
        apiRequest(`/api/projects/${projectId}`, {
          method: "DELETE",
          headers: getProtectedHeaders(false),
        }),
      );
    }

    setSelectedProjectIds([]);
    await fetchProjects();
  }

  async function refreshSession() {
    const data = await runProtectedRequest("Refresh token", () =>
      apiRequest("/api/Auth/refresh", {
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
      apiRequest("/api/Auth/revoke", {
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

  function toggleSelectAll() {
    if (selectedProjectIds.length === projects.length && projects.length > 0) {
      setSelectedProjectIds([]);
    } else {
      setSelectedProjectIds(projects.map((p) => p.id));
    }
  }

  function openAuthModal(mode = "login") {
    setActiveTab(mode);
    setShowAuthModal(true);
    setAuthFeedback({ message: "", tone: "neutral" });
  }

  const selectedCount = selectedProjectIds.length;
  const authenticated = isSessionActive(session);
  const allSelected = projects.length > 0 && selectedCount === projects.length;

  return (
    <div className="app-shell">
      <div className="ambient ambient--left" />
      <div className="ambient ambient--right" />

      <header className="topbar">
        <a className="brand" href="#home">Saasify</a>
        <nav className="topbar__nav">
          {authenticated ? (
            <>
              <button className="nav-button" type="button" onClick={fetchProjects}>
                Refresh Grid
              </button>
              <button className="nav-button" type="button" onClick={revokeSession}>
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
            <div className={`health-bar health-bar--${health.data ? "online" : health.loading ? "checking" : "offline"}`}>
              <span className="health-bar__dot" />
              <span className="health-bar__label">
                {health.loading
                  ? "Connecting to backend..."
                  : health.data
                    ? "Backend online"
                    : "Backend unreachable. The service may be waking up."}
              </span>
            </div>

            <section className="hero hero--landing" id="home">
              <div className="hero__copy">
                <span className="eyebrow">MULTI-TENANT SAAS PLATFORM</span>
                <h1>Tenant isolation. JWT auth. Project management. One clean UI.</h1>
                <p>
                  Saasify is a full-stack multi-tenant SaaS platform built on .NET with
                  tenant-scoped data isolation, secure JWT authentication with refresh
                  token rotation, and a React workspace for managing resources across tenants.
                </p>
                <div className="hero__actions">
                  <button className="button button--primary" type="button" onClick={() => openAuthModal("login")}>
                    Sign In
                  </button>
                  <button className="button button--ghost" type="button" onClick={() => openAuthModal("register")}>
                    Register Tenant
                  </button>
                </div>
              </div>

              <div className="terminal-card">
                <div className="terminal-card__header">
                  <span />
                  <span />
                  <span />
                  <strong>saasify-api.sh</strong>
                </div>
                <div className="terminal-card__body">
                  <p>$ curl {API_BASE_URL}/api/health</p>
                  <p className="muted">
                    {health.data
                      ? JSON.stringify(health.data)
                      : health.error || "Waiting for response..."}
                  </p>
                  <p>$ POST /api/Auth/login</p>
                  <p className="muted">JWT + refresh token issued, tenant context set.</p>
                  <p>$ GET /api/projects</p>
                  <p className="success">Tenant-scoped project list returned.</p>
                </div>
              </div>
            </section>

            <div className="feature-strip">
              <div className="feature-chip">
                <span className="eyebrow">ARCHITECTURE</span>
                <h3>Multi-tenant .NET backend with scoped data isolation</h3>
                <p>Each tenant operates in a fully isolated context. No data leakage across boundaries.</p>
              </div>
              <div className="feature-chip">
                <span className="eyebrow">SECURITY</span>
                <h3>JWT access tokens with refresh token rotation</h3>
                <p>Short-lived access tokens, server-side revocation, and automatic session management.</p>
              </div>
              <div className="feature-chip">
                <span className="eyebrow">DEVELOPER EXPERIENCE</span>
                <h3>React workspace with live API interaction</h3>
                <p>Manage projects, inspect responses, and test endpoints directly from the browser.</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <section className="workspace-hero">
              <div>
                <span className="eyebrow">PROJECT WORKSPACE</span>
                <h1>
                  {session.email} · Tenant {session.tenantId}
                </h1>
              </div>
              <div className="workspace-hero__actions">
                <button className="button button--primary button--sm" type="button" onClick={fetchProjects}>
                  {projectsLoading ? "Refreshing..." : "Refresh"}
                </button>
                <button className="button button--ghost button--sm" type="button" onClick={refreshSession}>
                  Refresh Token
                </button>
              </div>
            </section>

            <div className="workspace-layout">
              <article className="workspace-main">
                <div className="workspace-main__header">
                  <div className="toolbar">
                    <form className="toolbar__create" onSubmit={handleCreateProject}>
                      <input
                        value={newProjectName}
                        onChange={(event) => setNewProjectName(event.target.value)}
                        placeholder="New project name..."
                      />
                      <button
                        className="button button--primary button--sm"
                        disabled={apiLoading === "Create project" || !newProjectName.trim()}
                      >
                        {apiLoading === "Create project" ? "Creating..." : "Add"}
                      </button>
                    </form>

                    {selectedCount > 0 && (
                      <div className="bulk-bar">
                        <span className="bulk-bar__count">{selectedCount}</span> selected
                        <button
                          className="button button--ghost button--sm"
                          type="button"
                          onClick={handleBulkUpdate}
                        >
                          Update Selected
                        </button>
                        <button
                          className="button button--danger button--sm"
                          type="button"
                          onClick={handleBulkDelete}
                        >
                          Delete Selected
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {apiFeedback.message ? (
                  <div className={`notice notice--${apiFeedback.tone}`}>{apiFeedback.message}</div>
                ) : null}

                <div className="data-grid-wrap">
                  {projectsLoading && projects.length === 0 ? (
                    <div className="empty-state">Loading projects...</div>
                  ) : projects.length === 0 ? (
                    <div className="empty-state">
                      No projects yet. Create one above to populate the grid.
                    </div>
                  ) : (
                    <table className="data-grid">
                      <thead>
                        <tr>
                          <th>
                            <input
                              type="checkbox"
                              className="grid-checkbox"
                              checked={allSelected}
                              onChange={toggleSelectAll}
                              title="Select all"
                            />
                          </th>
                          <th className="col-id">ID</th>
                          <th className="col-name">Name</th>
                          <th className="col-actions">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projects.map((project) => (
                          <tr
                            key={project.id}
                            className={selectedProjectIds.includes(project.id) ? "row--selected" : ""}
                          >
                            <td>
                              <input
                                type="checkbox"
                                className="grid-checkbox"
                                checked={selectedProjectIds.includes(project.id)}
                                onChange={() => toggleProjectSelection(project.id)}
                              />
                            </td>
                            <td className="col-id">#{project.id}</td>
                            <td className="col-name">
                              <input
                                value={projectDrafts[project.id] ?? project.name}
                                onChange={(event) =>
                                  setProjectDrafts((current) => ({
                                    ...current,
                                    [project.id]: event.target.value,
                                  }))
                                }
                              />
                            </td>
                            <td className="col-actions">
                              <div className="row-actions">
                                <button
                                  className="button button--ghost button--sm"
                                  type="button"
                                  onClick={() => handleInlineUpdate(project.id)}
                                  disabled={apiLoading === `Update project #${project.id}`}
                                >
                                  {apiLoading === `Update project #${project.id}` ? "Saving..." : "Save"}
                                </button>
                                <button
                                  className="button button--danger button--sm"
                                  type="button"
                                  onClick={() => handleDeleteProject(project.id)}
                                  disabled={apiLoading === `Delete project #${project.id}`}
                                >
                                  {apiLoading === `Delete project #${project.id}` ? "..." : "Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </article>

              <aside className="workspace-side">
                <div className="glass-card">
                  <div className="section-heading section-heading--compact">
                    <span className="eyebrow">SESSION</span>
                    <h2>Auth Context</h2>
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
                    <div className="code-block__label">Curl</div>
                    <pre>{toCurlBlock(session)}</pre>
                  </div>

                  <div className="stack-actions">
                    <button className="button button--ghost button--wide button--sm" type="button" onClick={refreshSession}>
                      Refresh Token
                    </button>
                    <button className="button button--ghost button--wide button--sm" type="button" onClick={revokeSession}>
                      Revoke Token
                    </button>
                    <button className="button button--subtle button--wide button--sm" type="button" onClick={signOutLocally}>
                      Clear Local Session
                    </button>
                  </div>
                </div>

                {lastResponse && (
                  <div className="glass-card">
                    <ResponsePanel
                      title={lastResponse.title}
                      value={lastResponse.value}
                      tone={lastResponse.tone}
                    />
                  </div>
                )}

                <div className="glass-card">
                  <div className="code-block">
                    <div className="code-block__label">API Base</div>
                    <pre>{API_BASE_URL}</pre>
                  </div>
                </div>
              </aside>
            </div>
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
              {activeTab === "register" && (
                <label>
                  <span>Tenant name</span>
                  <input
                    value={authForms.register.tenantName}
                    onChange={(event) => updateAuthForm("register", "tenantName", event.target.value)}
                    placeholder="Acme Labs"
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
