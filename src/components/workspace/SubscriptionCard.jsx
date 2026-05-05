import React from 'react';

const SubscriptionCard = ({ 
  subscription, 
  onShowUpgradeModal, 
  onCancelSubscription 
}) => {
  if (!subscription) return null;

  return (
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
          <dl className="sub-card__detail">
            <dt>Started</dt>
            <dd>{new Date(subscription.startDate).toLocaleDateString("en-IN")}</dd>
          </dl>
          <dl className="sub-card__detail">
            <dt>Currency</dt>
            <dd>{subscription.currency}</dd>
          </dl>
        </div>
        <div className="stack-actions">
          <button
            className="button button--primary button--wide button--sm"
            type="button"
            onClick={onShowUpgradeModal}
          >
            Change Plan
          </button>
          {subscription.isActive && subscription.plan !== "Free" && (
            <button
              className="button button--danger button--wide button--sm"
              type="button"
              onClick={onCancelSubscription}
            >
              Cancel Subscription
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCard;
