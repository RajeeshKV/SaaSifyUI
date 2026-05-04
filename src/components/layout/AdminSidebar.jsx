import React from 'react';

const AdminSidebar = ({ 
  session, 
  permissions, 
  subscription, 
  onUpgrade, 
  onInviteMember,
  tenantSettings,
  onUpdateSettings,
  onRefreshSession,
  onRevokeSession,
  onSignOut
}) => {
  return (
    <aside className="workspace-sidebar">
      <div className="glass-card">
        <div className="section-heading section-heading--compact">
          <span className="eyebrow">CONTROLS</span>
          <h2>Actions</h2>
        </div>
        <div className="stack-actions">
          {permissions.includes("tenant.admin") && (
            <button 
              className="button button--primary button--wide button--sm" 
              type="button" 
              onClick={onInviteMember}
              style={{ marginBottom: "0.5rem" }}
            >
              + Add Team Member
            </button>
          )}
          <button className="button button--ghost button--wide button--sm" onClick={onRefreshSession}>
            Refresh Token
          </button>
          <button className="button button--ghost button--wide button--sm" onClick={onRevokeSession}>
            Revoke Token
          </button>
          <button className="button button--subtle button--wide button--sm" onClick={onSignOut}>
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
            </div>
            <div className="stack-actions">
              <button className="button button--primary button--wide button--sm" onClick={onUpgrade}>
                Manage / Upgrade
              </button>
            </div>
          </div>
        </div>
      )}

      {permissions.includes("tenant.admin") && (
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
                  onChange={(e) => onUpdateSettings({ ...tenantSettings, enableAdvancedFeatures: e.target.checked })}
                />
                <span>Advanced Features</span>
              </label>
              <div className="setting-limit">
                <span className="muted">Max Projects:</span>
                <strong>{tenantSettings.maxProjects === -1 ? "Unlimited" : tenantSettings.maxProjects}</strong>
              </div>
            </div>
          ) : (
            <div className="muted small">Loading settings...</div>
          )}
        </div>
      )}
    </aside>
  );
};

export default AdminSidebar;
