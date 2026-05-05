import React from 'react';

const LandingHero = ({ health, onOpenAuthModal, API_BASE_URL }) => {
  return (
    <section className="hero hero--landing" id="home">
      <div className="hero__copy">
        <span className="eyebrow">MULTI-TENANT SAAS PLATFORM</span>
        <h1>Tenant isolation. JWT auth. Project management. One clean UI.</h1>
        <p>
          Saasify is a full-stack multi-tenant SaaS platform built on .NET with
          tenant-scoped data isolation, secure JWT authentication with refresh
          token rotation, and a React workspace for managing resources across tenants.
        </p>
        <div className="hero__actions">
          <button className="button button--primary" type="button" onClick={() => onOpenAuthModal("login")}>
            Get Started
          </button>
        </div>
      </div>

      <div className="terminal-card">
        <div className="terminal-card__header">
          <span />
          <span />
          <span />
          <strong>saasify-api.sh</strong>
        </div>
        <div className="terminal-card__body">
          <p>$ curl {API_BASE_URL}/api/health</p>
          <p className="muted">
            {health.data
              ? JSON.stringify(health.data)
              : health.error || "Waiting for response..."}
          </p>
          <p>$ POST /api/Auth/login</p>
          <p className="muted">JWT + refresh token issued, tenant context set.</p>
          <p>$ GET /api/projects</p>
          <p className="success">Tenant-scoped project list returned.</p>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
