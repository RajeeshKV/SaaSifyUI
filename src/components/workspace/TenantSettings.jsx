import React from 'react';

const TenantSettings = ({ 
  tenantSettings, 
  updateTenantSettings, 
  permissions 
}) => {
  if (!permissions.includes("tenant.admin")) return null;

  return (
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
            <strong>{tenantSettings.maxProjects === -1 ? "Unlimited" : tenantSettings.maxProjects}</strong>
          </div>
        </div>
      ) : (
        <div className="muted small">Loading settings...</div>
      )}
    </div>
  );
};

export default TenantSettings;
