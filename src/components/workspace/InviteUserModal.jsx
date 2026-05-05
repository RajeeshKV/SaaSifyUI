import React from 'react';

const InviteUserModal = ({ 
  show, 
  inviteEmail, 
  setInviteEmail, 
  inviteRole, 
  setInviteRole, 
  handleInviteUser, 
  apiLoading, 
  onClose 
}) => {
  if (!show) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="auth-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal__header">
          <div>
            <span className="eyebrow">ADMIN</span>
            <h2>Add Team Member</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose}>
            ×
          </button>
        </div>
        <p className="muted" style={{ marginBottom: "1.5rem" }}>
          Send an invitation to a new team member to join your tenant.
        </p>
        <form className="form-grid" onSubmit={handleInviteUser}>
          <label>
            <span>Email Address</span>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              required
            />
          </label>
          <label>
            <span>Role</span>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="input"
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--radius-sm)", color: "white", padding: "0.5rem" }}
            >
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
          </label>
          <button
            className="button button--primary button--wide"
            disabled={apiLoading === "Invite user"}
            type="submit"
          >
            {apiLoading === "Invite user" ? "Sending..." : "Send Invitation"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InviteUserModal;
