import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE_URL, apiRequest, buildHeaders } from "../../lib/api";
import tokenManager from "../../services/tokenManager";
import apiClient from "../../services/apiClient";
import orderService from "../../services/orderService";
import ErrorHandler from "../../utils/errorHandler";
import { emptySession, isSessionActive, toCurlBlock, mapProjectsResponse, initialAuthForms } from "../../constants/session";

import TopBar from "../layout/TopBar";
import NotificationsOverlay from "../layout/NotificationsOverlay";
import SignOutOverlay from "../layout/SignOutOverlay";
import HealthStatus from "../layout/HealthStatus";
import LandingHero from "../landing/LandingHero";
import PricingSection from "../landing/PricingSection";
import AuthModal from "../auth/AuthModal";
import UpgradeModal from "./UpgradeModal";
import InviteUserModal from "./InviteUserModal";
import CreateOrderModal from "./CreateOrderModal";
import CreateProjectModal from "./CreateProjectModal";
import InviteAcceptModal from "../auth/InviteAcceptModal";
import WorkspaceHero from "./WorkspaceHero";
import WorkspaceTabs from "./WorkspaceTabs";
import ProjectToolbar from "./ProjectToolbar";
import UserToolbar from "./UserToolbar";
import ProjectsGrid from "./ProjectsGrid";
import Pagination from "./Pagination";
import SessionDetails from "./SessionDetails";
import SubscriptionCard from "./SubscriptionCard";
import SubscriptionHistory from "./SubscriptionHistory";
import TenantSettings from "./TenantSettings";
import OrderList from "../OrderList";
import OrderStatusTracker from "../OrderStatusTracker";

export default function Workspace({ session, setSession }) {
  const location = useLocation();
  const navigate = useNavigate();
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
  const [inviteToken, setInviteToken] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ password: "", confirmPassword: "" });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("User");
  const [showInviteUserModal, setShowInviteUserModal] = useState(false);

  // New states for Orders and Health
  const [microserviceHealth, setMicroserviceHealth] = useState({ loading: true, data: null, error: "" });
  const [orderServiceHealth, setOrderServiceHealth] = useState({ loading: true, data: null, error: "" });
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState("projects");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let ignore = false;

    async function fetchWithRetry(fn, setter, label, maxRetries = 3, delay = 2000) {
      for (let i = 0; i < maxRetries; i++) {
        try {
          const data = await fn();
          if (!ignore) setter({ loading: false, data, error: "" });
          return; // Success
        } catch (error) {
          if (i === maxRetries - 1) {
            if (!ignore) setter({ loading: false, data: null, error: `${label} unreachable: ${error.message}` });
          } else {
            console.warn(`Retrying ${label} (${i + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
    }

    async function fetchHealth() {
      void fetchWithRetry(
        () => apiClient.get("/api/health").then(res => res.data),
        setHealth,
        "Main API"
      );

      void fetchWithRetry(
        async () => {
          const response = await fetch("https://saasifyapi-client.rajeesh.online/api/health");
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return await response.json();
        },
        setMicroserviceHealth,
        "Microservice"
      );

      void fetchWithRetry(
        () => orderService.checkOrderServiceHealth(),
        setOrderServiceHealth,
        "OrderService"
      );
    }

    fetchHealth();

    const handleAuthExpired = () => {
      setSession(emptySession);
      tokenManager.clearTokens();
      tokenManager.clearCurrentUser();
      setShowAuthModal(true);
    };

    const handleNotification = (e) => {
      const { message, type } = e.detail;
      const id = Date.now();
      setNotifications(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    window.addEventListener('notification', handleNotification);

    return () => {
      ignore = true;
      window.removeEventListener('auth:expired', handleAuthExpired);
      window.removeEventListener('notification', handleNotification);
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
    const params = new URLSearchParams(location.search);
    const sessionId = params.get("session_id");
    const errorMsg = params.get("error");
    const path = location.pathname.toLowerCase();

    if (path.includes("/billing/error") || errorMsg) {
      setFeedback(setApiFeedback, `Payment error: ${errorMsg || "An unknown error occurred"}`, "error");
      navigate("/");
    } else if (path.includes("/billing/success") || params.get("success") === "true") {
      setFeedback(setApiFeedback, "Payment completed successfully! Your plan has been updated.", "success");
      void fetchSubscription();
      void fetchSubscriptionHistory();
      navigate("/");
    } else if (sessionId && path === "/") {
      void verifyStripeSession(sessionId);
    }
  }, [session.token, session.tenantId, location]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get("verify_token");
    const inviteToken = params.get("invite_token");
    const email = params.get("email");

    if (verifyToken && email) {
      handleVerifyEmail(email, verifyToken);
    }
    if (inviteToken) {
      setInviteToken(inviteToken);
      if (email) setInviteEmail(email);
      setShowInviteModal(true);
    }
  }, []);

  async function handleVerifyEmail(email, token) {
    setFeedback(setApiFeedback, "Verifying your email...", "neutral");
    try {
      await apiRequest("/api/v1/emailverification/verify", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({ email, token })
      });
      setFeedback(setApiFeedback, "Email verified successfully! You can now use all features.", "success");
      if (isSessionActive(session)) {
        setSession(prev => ({ ...prev, isEmailVerified: true }));
      }
    } catch (error) {
      setFeedback(setApiFeedback, `Verification failed: ${error.message}`, "error");
    }
  }

  async function handleInviteSubmit(e) {
    e.preventDefault();
    if (inviteForm.password !== inviteForm.confirmPassword) {
      ErrorHandler.showNotification("Passwords do not match", "error");
      return;
    }

    setApiLoading("Accepting invitation");
    try {
      await apiRequest("/api/v1/emailverification/set-password", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          email: inviteEmail,
          token: inviteToken,
          password: inviteForm.password
        })
      });
      ErrorHandler.showNotification("Invitation accepted! You can now log in.", "success");
      setShowInviteModal(false);
      window.history.replaceState({}, document.title, "/");
      setShowAuthModal(true);
      setActiveTab("login");
    } catch (error) {
      ErrorHandler.showNotification(error.message, "error");
    } finally {
      setApiLoading("");
    }
  }

  async function handleInviteUser(e) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setApiLoading("Invite user");
    try {
      await apiRequest("/api/v1/users", {
        method: "POST",
        headers: getProtectedHeaders(),
        body: JSON.stringify({
          name: inviteEmail.split('@')[0],
          email: inviteEmail,
          role: inviteRole
        })
      });
      ErrorHandler.showNotification(`Invitation sent to ${inviteEmail}`, "success");
      setInviteEmail("");
      setShowInviteUserModal(false);
    } catch (error) {
      ErrorHandler.showNotification(error.message, "error");
    } finally {
      setApiLoading("");
    }
  }

  const permissions = useMemo(() => {
    if (!session.token) return [];
    try {
      const payload = JSON.parse(atob(session.token.split(".")[1]));
      return payload.permission || payload.permissions || [];
    } catch {
      return [];
    }
  }, [session.token]);

  function getVerificationStatus(data) {
    if (data.token) {
      try {
        const payload = JSON.parse(atob(data.token.split(".")[1]));
        if (payload.IsEmailVerified !== undefined) {
          return String(payload.IsEmailVerified).toLowerCase() === "true";
        }
      } catch (e) { }
    }
    if (data.isEmailVerified !== undefined) return !!data.isEmailVerified;
    return true;
  }

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
        const data = await apiRequest("/api/v1/subscription/plans", {
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
    if (!session.token) return "No active session";
    try {
      const payload = JSON.parse(atob(session.token.split(".")[1]));
      if (payload.exp) {
        const date = new Date(payload.exp * 1000);
        return date.toLocaleString("en-IN");
      }
    } catch (e) {}
    if (!session.accessTokenExpiresAt) return "Token active (expiry unknown)";
    const date = new Date(session.accessTokenExpiresAt);
    return Number.isNaN(date.getTime()) ? session.accessTokenExpiresAt : date.toLocaleString("en-IN");
  }, [session.token, session.accessTokenExpiresAt]);

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
    if (!data.token) return;
    if (tokenManager) {
      tokenManager.setTokens(data.token, data.refreshToken);
      tokenManager.setCurrentUser({ email: data.email, role: data.role }, data.tenantId);
    }
    const isVerified = getVerificationStatus(data);
    const newSession = {
      tenantId: data.tenantId,
      tenantName: data.tenantName,
      userId: data.userId,
      email: data.email,
      role: data.role,
      token: data.token,
      refreshToken: data.refreshToken,
      isEmailVerified: isVerified,
    };
    setSession(newSession);
    localStorage.setItem("saasify_session", JSON.stringify(newSession));
  }

  function getProtectedHeaders(includeJson = true) {
    return buildHeaders({ token: session.token, tenantId: session.tenantId, includeJson });
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
      setFeedback(setApiFeedback, "Open login or register first so the app can attach your JWT and tenant header.", "error");
      return null;
    }
    setApiLoading(label);
    setApiFeedback({ message: "", tone: "neutral" });
    try {
      const data = await requestFactory();
      if (!options.silentSuccess) setFeedback(setApiFeedback, `${label} completed successfully.`, "success");
      setLastResponse({ title: label, value: data ?? "204 No Content", tone: "success" });
      return data;
    } catch (error) {
      console.error(`[API Error] ${label}:`, error);
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
    const data = await runProtectedRequest("List projects", () =>
      apiRequest(`/api/v1/projects?pageNumber=${page}&pageSize=${size}`, { headers: getProtectedHeaders() }),
      { silentSuccess: true }
    );
    if (data) {
      const items = mapProjectsResponse(data.data ?? data);
      setProjects(items);
      syncProjectDrafts(items);
      setSelectedProjectIds((current) => current.filter((projectId) => items.some((item) => item.id === projectId)));
      if (data.totalItems !== undefined) {
        setPagination({ totalItems: data.totalItems, totalPages: data.totalPages, hasPreviousPage: data.hasPreviousPage, hasNextPage: data.hasNextPage });
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
    const payload = isLogin ? authForms.login : authForms.register;
    try {
      const data = await apiRequest(`/api/v1/auth/${activeTab}`, { method: "POST", headers: buildHeaders(), body: JSON.stringify(payload) });
      applySession(data);
      setLastResponse({ title: `${activeTab} response`, value: data, tone: "success" });
      setFeedback(setAuthFeedback, isLogin ? "Login successful. Redirecting you into the API workspace." : "Registration successful! Please check your email to verify your account. Some features will be restricted until verified.", "success");
      if (!isLogin) {
        setAuthForms((current) => ({ ...current, login: { email: data.email, password: "" }, register: initialAuthForms.register }));
      } else {
        setAuthForms((current) => ({ ...current, login: { ...current.login, password: "" } }));
      }
    } catch (error) {
      setFeedback(setAuthFeedback, error.message, "error");
      setLastResponse({ title: `${activeTab} error`, value: error.body || error.message, tone: "error" });
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleCreateProject(name) {
    const data = await runProtectedRequest("Create project", () =>
      apiRequest("/api/v1/projects", { method: "POST", headers: getProtectedHeaders(), body: JSON.stringify({ name }) })
    );
    if (data) { await fetchProjects(); }
  }

  async function handleInlineUpdate(projectId) {
    const name = (projectDrafts[projectId] || "").trim();
    if (!name) { setFeedback(setApiFeedback, "Project name cannot be empty.", "error"); return; }
    const data = await runProtectedRequest(`Update project #${projectId}`, () =>
      apiRequest(`/api/v1/projects/${projectId}`, { method: "PUT", headers: getProtectedHeaders(), body: JSON.stringify({ id: Number(projectId), name }) })
    );
    if (data) await fetchProjects();
  }

  async function handleDeleteProject(projectId) {
    const ok = await runProtectedRequest(`Delete project #${projectId}`, () =>
      apiRequest(`/api/v1/projects/${projectId}`, { method: "DELETE", headers: getProtectedHeaders(false) })
    );
    if (ok !== null || apiLoading === "") await fetchProjects();
  }

  async function handleBulkUpdate() {
    if (selectedProjectIds.length === 0) return;
    for (const projectId of selectedProjectIds) {
      const name = (projectDrafts[projectId] || "").trim();
      if (!name) continue;
      await runProtectedRequest(`Update project #${projectId}`, () =>
        apiRequest(`/api/v1/projects/${projectId}`, { method: "PUT", headers: getProtectedHeaders(), body: JSON.stringify({ id: Number(projectId), name }) })
      );
    }
    setSelectedProjectIds([]);
    await fetchProjects();
  }

  async function handleBulkDelete() {
    if (selectedProjectIds.length === 0) return;
    for (const projectId of [...selectedProjectIds]) {
      await runProtectedRequest(`Delete project #${projectId}`, () =>
        apiRequest(`/api/v1/projects/${projectId}`, { method: "DELETE", headers: getProtectedHeaders(false) })
      );
    }
    setSelectedProjectIds([]);
    await fetchProjects();
  }

  async function refreshSession() {
    const data = await runProtectedRequest("Refresh token", () =>
      apiRequest("/api/v1/auth/refresh", { method: "POST", headers: buildHeaders(), body: JSON.stringify({ refreshToken: session.refreshToken }) })
    );
    if (data) applySession(data);
  }

  async function revokeSession() {
    setSigningOut(true);
    const data = await runProtectedRequest("Revoke token", () =>
      apiRequest("/api/v1/auth/revoke", { method: "POST", headers: buildHeaders(), body: JSON.stringify({ refreshToken: session.refreshToken }) })
    );
    if (data !== null || apiLoading === "") setSession(emptySession);
    setSigningOut(false);
  }

  function signOutLocally() {
    setSession(emptySession);
    setFeedback(setApiFeedback, "Local session cleared from this browser.", "success");
  }

  async function fetchSubscription() {
    const data = await runProtectedRequest("Get subscription", () => apiRequest("/api/v1/subscription/current", { headers: getProtectedHeaders() }), { silentSuccess: true });
    if (data) setSubscription(data);
  }

  async function fetchSubscriptionHistory() {
    const data = await runProtectedRequest("Subscription history", () => apiRequest("/api/v1/subscription/history", { headers: getProtectedHeaders() }), { silentSuccess: true });
    if (data) setSubscriptionHistory(Array.isArray(data) ? data : []);
  }

  async function handleUpgradePlan(planName) {
    setUpgradeLoading(planName);
    const data = await runProtectedRequest(`Upgrade to ${planName}`, () =>
      apiRequest("/api/v1/subscription/upgrade", { method: "POST", headers: getProtectedHeaders(), body: JSON.stringify({ newPlan: planName }) })
    );
    setUpgradeLoading("");
    if (data) { setSubscription(data); setShowUpgradeModal(false); await fetchSubscriptionHistory(); }
  }

  async function handleCancelSubscription() {
    const data = await runProtectedRequest("Cancel subscription", () =>
      apiRequest("/api/v1/subscription/cancel", { method: "POST", headers: getProtectedHeaders(false) })
    );
    if (data !== null) { await fetchSubscription(); await fetchSubscriptionHistory(); }
  }

  async function fetchTenantSettings() {
    const data = await runProtectedRequest("Get tenant settings", () => apiRequest("/api/v1/tenantsettings", { headers: getProtectedHeaders() }), { silentSuccess: true });
    if (data) setTenantSettings(data);
  }

  async function updateTenantSettings(updated) {
    const data = await runProtectedRequest("Update settings", () =>
      apiRequest("/api/v1/tenantsettings", { method: "PUT", headers: getProtectedHeaders(), body: JSON.stringify(updated) })
    );
    if (data) setTenantSettings(data);
  }

  async function handleCreateStripeSession(planId) {
    setIsStripeLoading(planId);
    const data = await runProtectedRequest(`Checkout ${planId}`, () =>
      apiRequest("/api/v1/stripe/create-checkout-session", {
        method: "POST",
        headers: getProtectedHeaders(),
        body: JSON.stringify({ planId, successUrl: `${window.location.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`, cancelUrl: `${window.location.origin}/billing/cancel` })
      })
    );
    setIsStripeLoading("");
    if (data?.checkoutUrl) window.location.href = data.checkoutUrl;
  }

  async function handleOpenCustomerPortal() {
    const data = await runProtectedRequest("Customer portal", () => apiRequest("/api/stripe/customer-portal", { headers: getProtectedHeaders() }));
    if (data?.portalUrl) window.location.href = data.portalUrl;
  }

  async function verifyStripeSession(sessionId) {
    const data = await runProtectedRequest("Verify payment", () => apiRequest(`/api/v1/stripe/success?session_id=${sessionId}`, { headers: getProtectedHeaders() }));
    if (data) { await fetchSubscription(); await fetchSubscriptionHistory(); window.history.replaceState({}, document.title, "/"); }
  }

  async function fetchRbacStatus() {
    if (!permissions.includes("tenant.admin")) return;
    const data = await runProtectedRequest("RBAC status", () => apiRequest("/api/v1/rbacmigration/status", { headers: getProtectedHeaders() }), { silentSuccess: true });
    if (data?.status) setRbacStatus(data.status);
  }

  function toggleProjectSelection(projectId) {
    setSelectedProjectIds((current) => current.includes(projectId) ? current.filter((id) => id !== projectId) : [...current, projectId]);
  }

  function toggleSelectAll() {
    if (selectedProjectIds.length === projects.length && projects.length > 0) setSelectedProjectIds([]);
    else setSelectedProjectIds(projects.map((p) => p.id));
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

      <NotificationsOverlay notifications={notifications} />

      <TopBar
        authenticated={authenticated}
        signingOut={signingOut}
        onRefreshProjects={fetchProjects}
        onRevokeSession={revokeSession}
        onOpenAuthModal={openAuthModal}
      />

      <SignOutOverlay signingOut={signingOut} />

      <main>
        {!authenticated ? (
          <>
            <HealthStatus health={health} microserviceHealth={microserviceHealth} />
            <LandingHero health={health} onOpenAuthModal={openAuthModal} API_BASE_URL={API_BASE_URL} />
            <PricingSection plans={plans} plansLoading={plansLoading} onOpenAuthModal={openAuthModal} />
          </>
        ) : (
          <WorkspaceHero
            session={session}
            subscription={subscription}
            projectsLoading={projectsLoading}
            onShowUpgradeModal={() => setShowUpgradeModal(true)}
            onOpenCustomerPortal={handleOpenCustomerPortal}
            onCreateProject={() => setShowCreateProjectModal(true)}
            onCreateOrder={() => setShowCreateOrderModal(true)}
            onShowInviteUserModal={() => setShowInviteUserModal(true)}
            activeWorkspaceTab={activeWorkspaceTab}
          />
        )}

        {authenticated && (
          <div className="workspace-layout">
            <article className="workspace-main">
              <WorkspaceTabs
                activeWorkspaceTab={activeWorkspaceTab}
                setActiveWorkspaceTab={setActiveWorkspaceTab}
                session={session}
              />

              <div className="workspace-main__header">
                {session.isEmailVerified === false && (activeWorkspaceTab === 'projects' || activeWorkspaceTab === 'orders') ? (
                  <div className="notice notice--warning" style={{ margin: 0, width: '100%' }}>
                    <strong>Email Verification Required</strong><br />
                    Please verify your email address to enable project and order management.
                  </div>
                ) : (
                  <>
                    {activeWorkspaceTab === 'projects' && (
                      <ProjectToolbar
                        selectedCount={selectedCount}
                        handleBulkUpdate={handleBulkUpdate}
                        handleBulkDelete={handleBulkDelete}
                      />
                    )}

                    {activeWorkspaceTab === 'users' && (
                      <UserToolbar
                        inviteEmail={inviteEmail}
                        setInviteEmail={setInviteEmail}
                        inviteRole={inviteRole}
                        setInviteRole={setInviteRole}
                        handleInviteUser={handleInviteUser}
                        apiLoading={apiLoading}
                      />
                    )}
                  </>
                )}
              </div>

              {activeWorkspaceTab === 'projects' && (
                <>
                  {apiFeedback.message ? (
                    <div className={`notice notice--${apiFeedback.tone}`}>{apiFeedback.message}</div>
                  ) : null}

                  <ProjectsGrid
                    projects={projects}
                    projectsLoading={projectsLoading}
                    selectedProjectIds={selectedProjectIds}
                    allSelected={allSelected}
                    toggleSelectAll={toggleSelectAll}
                    toggleProjectSelection={toggleProjectSelection}
                    projectDrafts={projectDrafts}
                    setProjectDrafts={setProjectDrafts}
                    handleInlineUpdate={handleInlineUpdate}
                    handleDeleteProject={handleDeleteProject}
                    apiLoading={apiLoading}
                  />

                  <Pagination
                    pagination={pagination}
                    pageNumber={pageNumber}
                    pageSize={pageSize}
                    setPageSize={setPageSize}
                    setPageNumber={setPageNumber}
                    fetchProjects={fetchProjects}
                  />
                </>
              )}

              {activeWorkspaceTab === 'orders' && (
                <div className="orders-workspace" style={{ display: 'grid', gridTemplateColumns: selectedOrderId ? '1fr 1fr' : '1fr', gap: '1.5rem', height: '100%', overflow: 'hidden' }}>
                  <div className="orders-left" style={{ overflowY: 'auto', paddingRight: '0.5rem' }}>
                    <div className="workspace-main__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                      <div className="section-heading">
                        <span className="eyebrow">ECOMMERCE</span>
                        <h2>Order Management</h2>
                      </div>
                    </div>
                    <OrderList onViewDetails={(id) => setSelectedOrderId(id)} />
                  </div>
                  {selectedOrderId && (
                    <div className="orders-right" style={{ overflowY: 'auto' }}>
                      <div className="card-header" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                        <button
                          className="button button--ghost button--small"
                          onClick={() => setSelectedOrderId(null)}
                        >
                          Close Details
                        </button>
                      </div>
                      <OrderStatusTracker orderId={selectedOrderId} />
                    </div>
                  )}
                </div>
              )}

              {activeWorkspaceTab === 'users' && (
                <div className="users-workspace">
                  <div className="notice notice--neutral">
                    <strong>User Management</strong><br />
                    Manage your team members and their roles within this tenant.
                  </div>
                  <div className="empty-state" style={{ marginTop: '2rem' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem', opacity: 0.3 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    <p>Currently showing invited users and active members.</p>
                    <p className="small muted">Use the toolbar above to invite new members to your tenant.</p>
                  </div>
                </div>
              )}
            </article>

            <aside className="workspace-side">
              <SessionDetails
                session={session}
                permissions={permissions}
                sessionExpiryLabel={sessionExpiryLabel}
                toCurlBlock={toCurlBlock}
                API_BASE_URL={API_BASE_URL}
                onShowInviteUserModal={() => setShowInviteUserModal(true)}
                onRefreshToken={refreshSession}
                onRevokeSession={revokeSession}
                onSignOutLocally={signOutLocally}
                lastResponse={lastResponse}
              />

              <SubscriptionCard
                subscription={subscription}
                onShowUpgradeModal={() => setShowUpgradeModal(true)}
                onCancelSubscription={handleCancelSubscription}
              />

              <SubscriptionHistory history={subscriptionHistory} />

              <TenantSettings
                tenantSettings={tenantSettings}
                updateTenantSettings={updateTenantSettings}
                permissions={permissions}
              />
            </aside>
          </div>
        )}
      </main>

      <AuthModal
        show={showAuthModal}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        authForms={authForms}
        updateAuthForm={updateAuthForm}
        handleAuthSubmit={handleAuthSubmit}
        authLoading={authLoading}
        authFeedback={authFeedback}
        onClose={() => setShowAuthModal(false)}
      />

      <UpgradeModal
        show={showUpgradeModal}
        plans={plans}
        subscription={subscription}
        upgradeLoading={upgradeLoading}
        isStripeLoading={isStripeLoading}
        handleUpgradePlan={handleUpgradePlan}
        handleCreateStripeSession={handleCreateStripeSession}
        onClose={() => setShowUpgradeModal(false)}
      />

      <InviteUserModal
        show={showInviteUserModal}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        inviteRole={inviteRole}
        setInviteRole={setInviteRole}
        handleInviteUser={handleInviteUser}
        apiLoading={apiLoading}
        onClose={() => setShowInviteUserModal(false)}
      />

      <CreateProjectModal
        show={showCreateProjectModal}
        handleCreateProject={handleCreateProject}
        apiLoading={apiLoading}
        onClose={() => setShowCreateProjectModal(false)}
      />

      <CreateOrderModal
        show={showCreateOrderModal}
        onOrderCreated={(newOrder) => {
          setShowCreateOrderModal(false);
          ErrorHandler.showNotification(`Order #${newOrder.orderId} created!`, "success");
        }}
        onClose={() => setShowCreateOrderModal(false)}
      />

      <InviteAcceptModal
        show={showInviteModal}
        inviteForm={inviteForm}
        setInviteForm={setInviteForm}
        handleInviteSubmit={handleInviteSubmit}
        apiLoading={apiLoading}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  );
}
