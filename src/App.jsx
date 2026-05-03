import { useEffect, useMemo, useState } from "react";
import ResponsePanel from "./components/ResponsePanel";
import { API_BASE_URL, apiRequest, buildHeaders } from "./lib/api";

const SESSION_STORAGE_KEY = "saasify-ui-session";

const emptySession = {
  tenantId: "",
  tenantName: "",
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
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({ totalItems: 0, totalPages: 0, hasPreviousPage: false, hasNextPage: false });
  const [tenantSettings, setTenantSettings] = useState(null);
  const [rbacStatus, setRbacStatus] = useState([]);
  const [rbacLoading, setRbacLoading] = useState(false);
  const [isStripeLoading, setIsStripeLoading] = useState("");

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
      void fetchSubscription();
      void fetchSubscriptionHistory();
      void fetchTenantSettings();
      void fetchRbacStatus();
    } else {
      setProjects([]);
      setProjectDrafts({});
      setSelectedProjectIds([]);
      setSubscription(null);
      setSubscriptionHistory([]);
      setTenantSettings(null);
      setRbacStatus([]);
    }
  }, [session.token, session.tenantId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (sessionId && isSessionActive(session)) {
      void verifyStripeSession(sessionId);
    }
  }, [session.token, session.tenantId]);

  const permissions = useMemo(() => {
    if (!session.token) return [];
    try {
      const payload = JSON.parse(atob(session.token.split(".")[1]));
      return payload.permission || [];
    } catch {
      return [];
    }
  }, [session.token]);

  useEffect(() => {
    let ignore = false;

    const fallbackPlans = [
      { name: "Free", description: "Perfect for small teams getting started", monthlyPrice: 0, rateLimitPerMinute: 100, maxUsers: 3, features: ["Basic features", "3 users", "100 requests/minute"] },
      { name: "Professional", description: "For growing teams that need more power", monthlyPrice: 29.99, rateLimitPerMinute: 1000, maxUsers: 10, features: ["All Free features", "10 users", "1000 requests/minute", "Priority support"] },
      { name: "Enterprise", description: "For large organizations with advanced needs", monthlyPrice: 99.99, rateLimitPerMinute: 5000, maxUsers: 50, features: ["All Professional features", "50 users", "5000 requests/minute", "24/7 support", "Custom integrations"] },
    ];

    async function loadPlans() {
      if (!isSessionActive(session)) {
        if (!ignore) { setPlans(fallbackPlans); setPlansLoading(false); }
        return;
      }
      try {
        const data = await apiRequest("/api/Subscription/plans", {
          headers: buildHeaders({ token: session.token, tenantId: session.tenantId }),
        });
        if (!ignore) setPlans(Array.isArray(data) ? data : fallbackPlans);
      } catch {
        if (!ignore) setPlans(fallbackPlans);
      } finally {
        if (!ignore) setPlansLoading(false);
      }
    }
    loadPlans();
    return () => { ignore = true; };
  }, [session.token]);

  const sessionExpiryLabel = useMemo(() => {
    if (!session.accessTokenExpiresAt) return "No active token";
    const date = new Date(session.accessTokenExpiresAt);
    return Number.isNaN(date.getTime()) ? session.accessTokenExpiresAt : date.toLocaleString("en-IN");
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
      tenantName: data.tenantName,
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

  async function fetchProjects(page = pageNumber, size = pageSize) {
    setProjectsLoading(true);
    const data = await runProtectedRequest(
      "List projects",
      () =>
        apiRequest(`/api/projects?pageNumber=${page}&pageSize=${size}`, {
          headers: getProtectedHeaders(),
        }),
      { silentSuccess: true },
    );
    if (data) {
      const items = mapProjectsResponse(data.data ?? data);
      setProjects(items);
      syncProjectDrafts(items);
      setSelectedProjectIds((current) =>
        current.filter((projectId) => items.some((item) => item.id === projectId)),
      );
      if (data.totalItems !== undefined) {
        setPagination({
          totalItems: data.totalItems,
          totalPages: data.totalPages,
          hasPreviousPage: data.hasPreviousPage,
          hasNextPage: data.hasNextPage,
        });
        setPageNumber(data.pageNumber ?? page);
      }
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
    setSigningOut(true);
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
    setSigningOut(false);
  }

  function signOutLocally() {
    setSession(emptySession);
    setFeedback(setApiFeedback, "Local session cleared from this browser.", "success");
  }

  async function fetchSubscription() {
    const data = await runProtectedRequest(
      "Get subscription",
      () => apiRequest("/api/Subscription/current", { headers: getProtectedHeaders() }),
      { silentSuccess: true },
    );
    if (data) setSubscription(data);
  }

  async function fetchSubscriptionHistory() {
    const data = await runProtectedRequest(
      "Subscription history",
      () => apiRequest("/api/Subscription/history", { headers: getProtectedHeaders() }),
      { silentSuccess: true },
    );
    if (data) setSubscriptionHistory(Array.isArray(data) ? data : []);
  }

  async function handleUpgradePlan(planName) {
    setUpgradeLoading(planName);
    const data = await runProtectedRequest(`Upgrade to ${planName}`, () =>
      apiRequest("/api/Subscription/upgrade", {
        method: "POST",
        headers: getProtectedHeaders(),
        body: JSON.stringify({ newPlan: planName }),
      }),
    );
    setUpgradeLoading("");
    if (data) {
      setSubscription(data);
      setShowUpgradeModal(false);
      await fetchSubscriptionHistory();
    }
  }

  async function handleCancelSubscription() {
    const data = await runProtectedRequest("Cancel subscription", () =>
      apiRequest("/api/Subscription/cancel", {
        method: "POST",
        headers: getProtectedHeaders(false),
      }),
    );
    if (data !== null) {
      await fetchSubscription();
      await fetchSubscriptionHistory();
    }
  }

  async function fetchTenantSettings() {
    const data = await runProtectedRequest(
      "Get tenant settings",
      () => apiRequest("/api/tenant-settings", { headers: getProtectedHeaders() }),
      { silentSuccess: true },
    );
    if (data) setTenantSettings(data);
  }

  async function updateTenantSettings(updated) {
    const data = await runProtectedRequest("Update settings", () =>
      apiRequest("/api/tenant-settings", {
        method: "PUT",
        headers: getProtectedHeaders(),
        body: JSON.stringify(updated),
      }),
    );
    if (data) setTenantSettings(data);
  }

  async function handleCreateStripeSession(planId) {
    setIsStripeLoading(planId);
    const data = await runProtectedRequest(`Checkout ${planId}`, () =>
      apiRequest("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: getProtectedHeaders(),
        body: JSON.stringify({ planId }),
      }),
    );
    setIsStripeLoading("");
    if (data?.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    }
  }

  async function handleOpenCustomerPortal() {
    const data = await runProtectedRequest("Customer portal", () =>
      apiRequest("/api/stripe/customer-portal", { headers: getProtectedHeaders() }),
    );
    if (data?.portalUrl) {
      window.location.href = data.portalUrl;
    }
  }

  async function verifyStripeSession(sessionId) {
    const data = await runProtectedRequest(
      "Verify payment",
      () => apiRequest(`/api/stripe/verify-session?session_id=${sessionId}`, { headers: getProtectedHeaders() }),
    );
    if (data) {
      await fetchSubscription();
      await fetchSubscriptionHistory();
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  async function fetchRbacStatus() {
    if (!permissions.includes("tenant.admin")) return;
    const data = await runProtectedRequest(
      "RBAC status",
      () => apiRequest("/api/rbac-migration/status", { headers: getProtectedHeaders() }),
      { silentSuccess: true },
    );
    if (data?.status) setRbacStatus(data.status);
  }

  async function handleRbacMigrate() {
    setRbacLoading(true);
    const data = await runProtectedRequest("RBAC migration", () =>
      apiRequest("/api/rbac-migration/migrate", {
        method: "POST",
        headers: getProtectedHeaders(),
      }),
    );
    setRbacLoading(false);
    if (data) await fetchRbacStatus();
  }

  async function checkFeature(feature) {
    return await runProtectedRequest(
      `Check ${feature}`,
      () => apiRequest(`/api/tenant-settings/features/${feature}`, { headers: getProtectedHeaders() }),
      { silentSuccess: true },
    );
  }

  async function checkLimit(resource, currentUsage) {
    return await runProtectedRequest(
      `Check ${resource} limit`,
      () => apiRequest(`/api/tenant-settings/limits/${resource}?currentUsage=${currentUsage}`, { headers: getProtectedHeaders() }),
      { silentSuccess: true },
    );
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
              <button className="nav-icon" type="button" onClick={fetchProjects} title="Refresh projects">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
              </button>
              <button className={`nav-icon${signingOut ? " nav-icon--loading" : ""}`} type="button" onClick={revokeSession} disabled={signingOut} title="Sign out">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              </button>
            </>
          ) : (
            <button className="nav-icon" type="button" onClick={() => openAuthModal("login")} title="Sign in / Register">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </button>
          )}
        </nav>
      </header>

      {signingOut && (
        <div className="signout-overlay">
          <div className="signout-overlay__content">
            <svg className="signout-spinner" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            <span>Signing out…</span>
          </div>
        </div>
      )}

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
                    Get Started
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

            <div className="pricing-section">
              <div className="pricing-section__title">
                <span className="eyebrow">SUBSCRIPTION PLANS</span>
                <h2>Choose the right plan for your team</h2>
              </div>
              {plansLoading ? (
                <div className="pricing-grid">
                  {[1, 2, 3].map((i) => (
                    <div className="plan-card" key={i}>
                      <div className="skeleton-row" style={{ width: "40%", marginBottom: "0.5rem" }} />
                      <div className="skeleton-row" style={{ width: "60%", marginBottom: "0.4rem" }} />
                      <div className="skeleton-row" style={{ width: "80%", marginBottom: "1rem" }} />
                      <div className="skeleton-row" style={{ width: "100%", height: "2.5rem" }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pricing-grid">
                  {plans.map((plan) => (
                    <div
                      key={plan.name}
                      className={`plan-card${plan.name === "Professional" ? " plan-card--featured" : ""}`}
                    >
                      {plan.name === "Professional" && (
                        <span className="plan-card__badge">Most Popular</span>
                      )}
                      <div className="plan-card__name">{plan.name}</div>
                      <div className="plan-card__price">
                        {plan.monthlyPrice === 0 ? "Free" : `$${plan.monthlyPrice}`}
                        {plan.monthlyPrice > 0 && <span>/mo</span>}
                      </div>
                      <div className="plan-card__desc">{plan.description}</div>
                      <div className="plan-card__meta">
                        <div className="plan-card__meta-item">
                          <strong>{plan.maxUsers}</strong> users
                        </div>
                        <div className="plan-card__meta-item">
                          <strong>{plan.rateLimitPerMinute}</strong> req/min
                        </div>
                      </div>
                      <ul className="plan-card__features">
                        {plan.features.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                      <button
                        className={`button ${plan.name === "Professional" ? "button--primary" : "button--ghost"} button--wide`}
                        type="button"
                        onClick={() => openAuthModal("register")}
                      >
                        Get Started
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <section className="workspace-hero">
              <div>
                <span className="eyebrow">PROJECT WORKSPACE</span>
                <h1>
                  {session.tenantName}
                </h1>
                {subscription && (
                  <div className="plan-badge" style={{ marginTop: "0.5rem" }}>
                    <span className="plan-badge__dot" />
                    <span className="plan-badge__plan">{subscription.plan} Plan</span>
                    <span className="plan-badge__expiry">
                      {subscription.isActive
                        ? `Expires ${new Date(subscription.endDate).toLocaleDateString("en-IN")}`
                        : "Inactive"}
                    </span>
                  </div>
                )}
              </div>
              <div className="workspace-hero__actions">
                <button className="button button--primary button--sm" type="button" onClick={fetchProjects}>
                  {projectsLoading ? "Refreshing..." : "Refresh"}
                </button>
                <button className="button button--ghost button--sm" type="button" onClick={() => setShowUpgradeModal(true)}>
                  Upgrade Plan
                </button>
                {subscription?.isActive && subscription?.plan !== "Free" && (
                  <button className="button button--ghost button--sm" type="button" onClick={handleOpenCustomerPortal}>
                    Billing Portal
                  </button>
                )}
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

                {pagination.totalItems > 0 && (
                  <div className="pagination-bar">
                    <div className="pagination-bar__info">
                      <strong>{pagination.totalItems}</strong> project{pagination.totalItems !== 1 ? "s" : ""}
                      {" · "}Page <strong>{pageNumber}</strong> of <strong>{pagination.totalPages}</strong>
                    </div>
                    <div className="pagination-bar__controls">
                      <select
                        className="page-size-select"
                        value={pageSize}
                        onChange={(e) => {
                          const newSize = Number(e.target.value);
                          setPageSize(newSize);
                          setPageNumber(1);
                          fetchProjects(1, newSize);
                        }}
                      >
                        <option value={10}>10 / page</option>
                        <option value={25}>25 / page</option>
                        <option value={50}>50 / page</option>
                      </select>
                      <div className="pagination-bar__pages">
                        <button
                          className="page-btn"
                          type="button"
                          disabled={!pagination.hasPreviousPage}
                          onClick={() => fetchProjects(1, pageSize)}
                        >
                          ««
                        </button>
                        <button
                          className="page-btn"
                          type="button"
                          disabled={!pagination.hasPreviousPage}
                          onClick={() => fetchProjects(pageNumber - 1, pageSize)}
                        >
                          ‹
                        </button>
                        {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                          let start = Math.max(1, pageNumber - 2);
                          if (start + 4 > pagination.totalPages) start = Math.max(1, pagination.totalPages - 4);
                          const pg = start + i;
                          if (pg > pagination.totalPages) return null;
                          return (
                            <button
                              key={pg}
                              className={`page-btn${pg === pageNumber ? " page-btn--active" : ""}`}
                              type="button"
                              onClick={() => fetchProjects(pg, pageSize)}
                            >
                              {pg}
                            </button>
                          );
                        })}
                        <button
                          className="page-btn"
                          type="button"
                          disabled={!pagination.hasNextPage}
                          onClick={() => fetchProjects(pageNumber + 1, pageSize)}
                        >
                          ›
                        </button>
                        <button
                          className="page-btn"
                          type="button"
                          disabled={!pagination.hasNextPage}
                          onClick={() => fetchProjects(pagination.totalPages, pageSize)}
                        >
                          »»
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
                      <dd>{session.tenantName}</dd>
                    </div>
                    <div>
                      <dt>Role</dt>
                      <dd>{session.role}</dd>
                    </div>
                    {permissions.length > 0 && (
                      <div className="permissions-list">
                        <dt>Permissions</dt>
                        <dd>
                          {permissions.map((p) => (
                            <span key={p} className="permission-tag">
                              {p.replace(".", " ")}
                            </span>
                          ))}
                        </dd>
                      </div>
                    )}
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

                {subscription && (
                  <div className="glass-card">
                    <div className="section-heading section-heading--compact">
                      <span className="eyebrow">SUBSCRIPTION</span>
                      <h2>Current Plan</h2>
                    </div>
                    <div className="sub-card">
                      <div className="sub-card__header">
                        <span className="sub-card__plan-name">{subscription.plan}</span>
                        <span className="sub-card__plan-price">
                          {subscription.amount === 0 ? "Free" : `$${subscription.amount}/mo`}
                        </span>
                      </div>
                      <div className="sub-card__details">
                        <dl className="sub-card__detail">
                          <dt>Status</dt>
                          <dd style={{ color: subscription.isActive ? "var(--primary)" : "var(--danger)" }}>
                            {subscription.isActive ? "Active" : "Inactive"}
                          </dd>
                        </dl>
                        <dl className="sub-card__detail">
                          <dt>Expires</dt>
                          <dd>{new Date(subscription.endDate).toLocaleDateString("en-IN")}</dd>
                        </dl>
                        <dl className="sub-card__detail">
                          <dt>Started</dt>
                          <dd>{new Date(subscription.startDate).toLocaleDateString("en-IN")}</dd>
                        </dl>
                        <dl className="sub-card__detail">
                          <dt>Currency</dt>
                          <dd>{subscription.currency}</dd>
                        </dl>
                      </div>
                      <div className="stack-actions">
                        <button
                          className="button button--primary button--wide button--sm"
                          type="button"
                          onClick={() => setShowUpgradeModal(true)}
                        >
                          Change Plan
                        </button>
                        {subscription.isActive && subscription.plan !== "Free" && (
                          <button
                            className="button button--danger button--wide button--sm"
                            type="button"
                            onClick={handleCancelSubscription}
                          >
                            Cancel Subscription
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {subscriptionHistory.length > 0 && (
                  <div className="glass-card">
                    <div className="section-heading section-heading--compact">
                      <span className="eyebrow">HISTORY</span>
                      <h2>Plan Changes</h2>
                    </div>
                    <div className="history-list" style={{ marginTop: "0.5rem" }}>
                      {subscriptionHistory.map((item) => (
                        <div className="history-item" key={item.id}>
                          <span className="history-item__plan">{item.plan}</span>
                          <span className="history-item__date">
                            {new Date(item.createdAt).toLocaleDateString("en-IN")}
                          </span>
                          <span
                            className={`history-item__status history-item__status--${item.isActive ? "active" : "inactive"}`}
                          >
                            {item.isActive ? "Active" : "Ended"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

                {permissions.includes("tenant.admin") && (
                  <>
                    <div className="glass-card">
                      <div className="section-heading section-heading--compact">
                        <span className="eyebrow">ADMIN</span>
                        <h2>Tenant Settings</h2>
                      </div>
                      {tenantSettings ? (
                        <div className="settings-grid">
                          <label className="setting-toggle">
                            <input
                              type="checkbox"
                              checked={tenantSettings.enableAdvancedFeatures}
                              onChange={(e) => updateTenantSettings({ ...tenantSettings, enableAdvancedFeatures: e.target.checked })}
                            />
                            <span>Advanced Features</span>
                          </label>
                          <label className="setting-toggle">
                            <input
                              type="checkbox"
                              checked={tenantSettings.enableApiAccess}
                              onChange={(e) => updateTenantSettings({ ...tenantSettings, enableApiAccess: e.target.checked })}
                            />
                            <span>API Access</span>
                          </label>
                          <div className="setting-limit">
                            <span className="muted">Max Projects:</span>
                            <strong>{tenantSettings.maxProjects}</strong>
                          </div>
                        </div>
                      ) : (
                        <div className="muted small">Loading settings...</div>
                      )}
                    </div>

                    <div className="glass-card">
                      <div className="section-heading section-heading--compact">
                        <span className="eyebrow">SYSTEM</span>
                        <h2>RBAC Migration</h2>
                      </div>
                      <div className="history-list history-list--compact">
                        {rbacStatus.map((s, i) => (
                          <div key={i} className={`history-item ${s.includes("Not") ? "history-item--warning" : "history-item--success"}`}>
                            {s}
                          </div>
                        ))}
                      </div>
                      <button
                        className="button button--primary button--wide button--sm"
                        style={{ marginTop: "1rem" }}
                        disabled={rbacLoading || !rbacStatus.some((s) => s.includes("Not"))}
                        onClick={handleRbacMigrate}
                      >
                        {rbacLoading ? "Migrating..." : "Run Migration"}
                      </button>
                    </div>
                  </>
                )}
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

      {showUpgradeModal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowUpgradeModal(false)}>
          <div className="upgrade-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="upgrade-modal__header">
              <div>
                <span className="eyebrow">SUBSCRIPTION</span>
                <h2>Choose your plan</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setShowUpgradeModal(false)}>
                ×
              </button>
            </div>
            <div className="upgrade-grid">
              {plans.map((plan) => {
                const isCurrent = subscription?.plan === plan.name;
                return (
                  <div
                    key={plan.name}
                    className={`plan-card${isCurrent ? " plan-card--current" : ""}${plan.name === "Professional" && !isCurrent ? " plan-card--featured" : ""}`}
                  >
                    {plan.name === "Professional" && !isCurrent && (
                      <span className="plan-card__badge">Popular</span>
                    )}
                    <div className="plan-card__name">{plan.name}</div>
                    <div className="plan-card__price">
                      {plan.monthlyPrice === 0 ? "Free" : `$${plan.monthlyPrice}`}
                      {plan.monthlyPrice > 0 && <span>/mo</span>}
                    </div>
                    <div className="plan-card__desc">{plan.description}</div>
                    <div className="plan-card__meta">
                      <div className="plan-card__meta-item">
                        <strong>{plan.maxUsers}</strong> users
                      </div>
                      <div className="plan-card__meta-item">
                        <strong>{plan.rateLimitPerMinute}</strong> req/min
                      </div>
                    </div>
                    <ul className="plan-card__features">
                      {plan.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                    <button
                      className={`button ${isCurrent ? "button--subtle" : "button--primary"} button--wide button--sm`}
                      type="button"
                      disabled={isCurrent || upgradeLoading === plan.name || isStripeLoading === plan.name}
                      onClick={() => {
                        if (plan.name === "Free") handleUpgradePlan(plan.name);
                        else handleCreateStripeSession(plan.name);
                      }}
                    >
                      {isCurrent
                        ? "Current Plan"
                        : (upgradeLoading === plan.name || isStripeLoading === plan.name)
                          ? "Processing..."
                          : `Switch to ${plan.name}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
