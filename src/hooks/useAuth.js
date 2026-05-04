import { useState, useEffect, useMemo, useCallback } from "react";
import { apiRequest, buildHeaders } from "../lib/api";
import tokenManager from "../services/tokenManager";
import { orderWS } from "../services/orderWebSocketManager";
import ErrorHandler from "../utils/errorHandler";

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
  isEmailVerified: true,
};

export function useAuth() {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.isEmailVerified === undefined) parsed.isEmailVerified = true;
      return parsed;
    }
    return emptySession;
  });

  const [authLoading, setAuthLoading] = useState(false);
  const [authFeedback, setAuthFeedback] = useState({ message: "", tone: "neutral" });

  // Sync session to storage
  useEffect(() => {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    if (session.token) {
      tokenManager.setTokens(session.token, session.refreshToken);
      tokenManager.setCurrentUser({ email: session.email, role: session.role }, session.tenantId);
      orderWS.connect(session.token);
    } else {
      orderWS.disconnect();
    }
  }, [session]);

  const permissions = useMemo(() => {
    if (!session.token) return [];
    try {
      const payload = JSON.parse(atob(session.token.split(".")[1]));
      return payload.permission || payload.permissions || [];
    } catch {
      return [];
    }
  }, [session.token]);

  const applySession = useCallback((data) => {
    if (!data.token) return;

    // JWT Verification Status Check
    let isVerified = true;
    try {
      const payload = JSON.parse(atob(data.token.split(".")[1]));
      if (payload.IsEmailVerified !== undefined) {
        isVerified = String(payload.IsEmailVerified).toLowerCase() === "true";
      } else if (data.isEmailVerified !== undefined) {
        isVerified = !!data.isEmailVerified;
      }
    } catch (e) {
      isVerified = true;
    }

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
  }, []);

  const logout = useCallback(() => {
    setSession(emptySession);
    tokenManager.clearTokens();
    tokenManager.clearCurrentUser();
  }, []);

  return {
    session,
    setSession,
    permissions,
    authLoading,
    setAuthLoading,
    authFeedback,
    setAuthFeedback,
    applySession,
    logout,
  };
}
