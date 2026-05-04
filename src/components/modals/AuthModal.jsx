import React from 'react';

const AuthModal = ({ 
  show, 
  onClose, 
  activeTab, 
  setActiveTab, 
  authForms, 
  onUpdateForm, 
  onSubmit, 
  loading, 
  feedback 
}) => {
  if (!show) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="auth-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal__header">
          <div>
            <span className="eyebrow">AUTH ACCESS</span>
            <h2>{activeTab === "login" ? "Welcome back." : "Create your tenant."}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose}>×</button>
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

        <form className="form-grid" onSubmit={onSubmit}>
          {activeTab === "register" && (
            <>
              <label>
                <span>Tenant name</span>
                <input
                  value={authForms.register.tenantName}
                  onChange={(e) => onUpdateForm("register", "tenantName", e.target.value)}
                  placeholder="Acme Labs"
                  required
                />
              </label>
              <label>
                <span>Your Name</span>
                <input
                  value={authForms.register.name}
                  onChange={(e) => onUpdateForm("register", "name", e.target.value)}
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
              onChange={(e) => onUpdateForm(activeTab, "email", e.target.value)}
              placeholder="user@example.com"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={authForms[activeTab].password}
              onChange={(e) => onUpdateForm(activeTab, "password", e.target.value)}
              placeholder="password123"
              required
            />
          </label>

          <button className="button button--primary button--wide" disabled={loading}>
            {loading ? 'Processing...' : (activeTab === "login" ? "Enter Workspace" : "Create Tenant & Enter")}
          </button>
        </form>

        {feedback.message && (
          <div className={`notice notice--${feedback.tone}`}>{feedback.message}</div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
