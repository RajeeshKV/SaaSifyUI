import React from 'react';

const HealthStatus = ({ health, microserviceHealth }) => {
  return (
    <div className="health-status-container" style={{ display: 'flex', gap: '1rem', padding: '0.5rem 1.5rem', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--line)' }}>
      <div className={`health-bar health-bar--${health.data ? "online" : health.loading ? "checking" : "offline"}`} style={{ border: 'none', background: 'none', padding: 0 }}>
        <span className="health-bar__dot" />
        <span className="health-bar__label" style={{ fontSize: '0.7rem' }}>API: {health.loading ? "..." : health.data ? "Online" : "Offline"}</span>
      </div>
      <div className={`health-bar health-bar--${microserviceHealth.data ? "online" : microserviceHealth.loading ? "checking" : "offline"}`} style={{ border: 'none', background: 'none', padding: 0 }}>
        <span className="health-bar__dot" />
        <span className="health-bar__label" style={{ fontSize: '0.7rem' }}>Micro: {microserviceHealth.loading ? "..." : microserviceHealth.data ? "Online" : "Offline"}</span>
      </div>
    </div>
  );
};

export default HealthStatus;
