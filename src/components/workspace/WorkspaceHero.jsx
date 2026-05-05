import React from 'react';

const WorkspaceHero = ({ 
  session, 
  subscription, 
  projectsLoading, 
  onShowUpgradeModal, 
  onOpenCustomerPortal,
  onCreateProject,
  onCreateOrder,
  onShowInviteUserModal,
  activeWorkspaceTab
}) => {
  return (
    <section className="workspace-hero">
      <div>
        <span className="eyebrow">PROJECT WORKSPACE</span>
        <h1>
          {session.tenantName}
        </h1>
        {subscription && (
          <div className="plan-badge" style={{ marginTop: "0.5rem" }}>
            <span className="plan-badge__dot" />
            <span className="plan-badge__plan">{subscription.plan} Plan</span>
            <span className="plan-badge__expiry">
              {subscription.isActive
                ? `Expires ${new Date(subscription.endDate).toLocaleDateString("en-IN")}`
                : "Inactive"}
            </span>
          </div>
        )}
      </div>
      <div className="workspace-hero__actions">
        {activeWorkspaceTab === 'projects' && (
          <button 
            className="button button--primary button--sm" 
            type="button" 
            onClick={onCreateProject}
            disabled={!session.isEmailVerified}
          >
            + Create Project
          </button>
        )}
        {activeWorkspaceTab === 'orders' && (
          <button 
            className="button button--primary button--sm" 
            type="button" 
            onClick={onCreateOrder}
            disabled={!session.isEmailVerified}
          >
            + Create Order
          </button>
        )}
        <button className="button button--ghost button--sm" type="button" onClick={onShowUpgradeModal}>
          Upgrade Plan
        </button>
        {subscription?.isActive && subscription?.plan !== "Free" && (
          <button className="button button--ghost button--sm" type="button" onClick={onOpenCustomerPortal}>
            Billing Portal
          </button>
        )}
        <button className="button button--primary button--sm" type="button" onClick={onShowInviteUserModal}>
          + Add Team Member
        </button>
      </div>
    </section>
  );
};

export default WorkspaceHero;
