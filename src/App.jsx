import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import tokenManager from "./services/tokenManager";
import OrderSuccessPage from "./pages/order/success";
import OrderCancelPage from "./pages/order/cancel";
import OrderCheckoutPage from "./pages/order/checkout";
import Workspace from "./components/workspace/Workspace";
import { loadStoredSession, SESSION_STORAGE_KEY } from "./constants/session";
import "./styles/pages/order.css";

export default function App() {
  const [session, setSession] = useState(() => loadStoredSession());

  useEffect(() => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    if (session.token) {
      tokenManager.setTokens(session.token, session.refreshToken);
      tokenManager.setCurrentUser({ email: session.email, role: session.role }, session.tenantId);
    }
  }, [session]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/order/success" element={<OrderSuccessPage />} />
        <Route path="/order/cancel" element={<OrderCancelPage />} />
        <Route path="/order/checkout" element={<OrderCheckoutPage />} />
        <Route path="*" element={<Workspace session={session} setSession={setSession} />} />
      </Routes>
    </BrowserRouter>
  );
}
