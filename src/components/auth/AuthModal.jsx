import React from 'react';

const AuthModal = ({ 
  show, 
  activeTab, 
  setActiveTab, 
  authForms, 
  updateAuthForm, 
  handleAuthSubmit, 
  authLoading, 
  authFeedback, 
  onClose 
}) => {
  if (!show) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="auth-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="auth-modal__header">
          <div>
            <span className="eyebrow">AUTH ACCESS</span>
            <h2>{activeTab === "login" ? "Welcome back." : "Create your tenant."}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose}>
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
            <>
              <label>
                <span>Tenant name</span>
                <input
                  value={authForms.register.tenantName}
                  onChange={(event) => updateAuthForm("register", "tenantName", event.target.value)}
                  placeholder="Acme Labs"
                  required
                />
              </label>
              <label>
                <span>Your Name</span>
                <input
                  value={authForms.register.name}
                  onChange={(event) => updateAuthForm("register", "name", event.target.value)}
                  placeholder="John Doe"
                  required
                />
              </label>
            </>
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
  );
};

export default AuthModal;
