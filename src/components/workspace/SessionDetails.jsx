import React from 'react';
import ResponsePanel from '../ResponsePanel';

const SessionDetails = ({ 
  session, 
  permissions, 
  sessionExpiryLabel, 
  toCurlBlock, 
  API_BASE_URL, 
  onShowInviteUserModal, 
  onRefreshToken, 
  onRevokeSession, 
  onSignOutLocally,
  lastResponse
}) => {
  return (
    <>
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
          <pre>{toCurlBlock(session, API_BASE_URL)}</pre>
        </div>

        <div className="stack-actions">
          {permissions.includes("tenant.admin") && (
            <button
              className="button button--primary button--wide button--sm"
              type="button"
              onClick={onShowInviteUserModal}
              style={{ marginBottom: "0.5rem" }}
            >
              + Add Team Member
            </button>
          )}
          <button className="button button--ghost button--wide button--sm" type="button" onClick={onRefreshToken}>
            Refresh Token
          </button>
          <button className="button button--ghost button--wide button--sm" type="button" onClick={onRevokeSession}>
            Revoke Token
          </button>
          <button className="button button--subtle button--wide button--sm" type="button" onClick={onSignOutLocally}>
            Clear Local Session
          </button>
        </div>
      </div>

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
    </>
  );
};

export default SessionDetails;
