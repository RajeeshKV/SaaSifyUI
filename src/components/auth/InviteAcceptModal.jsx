import React from 'react';

const InviteAcceptModal = ({ 
  show, 
  inviteForm, 
  setInviteForm, 
  handleInviteSubmit, 
  apiLoading, 
  onClose 
}) => {
  if (!show) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="auth-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal__header">
          <div>
            <span className="eyebrow">INVITATION</span>
            <h2>Join your team</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose}>
            ×
          </button>
        </div>
        <p className="muted" style={{ marginBottom: '1.5rem' }}>Please set your password to complete your account setup.</p>
        <form className="form-grid" onSubmit={handleInviteSubmit}>
          <label>
            <span>New Password</span>
            <input
              type="password"
              value={inviteForm.password}
              onChange={(e) => setInviteForm(prev => ({ ...prev, password: e.target.value }))}
              placeholder="********"
              required
            />
          </label>
          <label>
            <span>Confirm Password</span>
            <input
              type="password"
              value={inviteForm.confirmPassword}
              onChange={(e) => setInviteForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="********"
              required
            />
          </label>
          <button className="button button--primary button--wide" disabled={apiLoading === "Accepting invitation"}>
            {apiLoading === "Accepting invitation" ? "Processing..." : "Set Password & Log In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InviteAcceptModal;
