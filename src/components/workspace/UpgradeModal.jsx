import React from 'react';

const UpgradeModal = ({ 
  show, 
  plans, 
  subscription, 
  upgradeLoading, 
  isStripeLoading, 
  handleUpgradePlan, 
  handleCreateStripeSession, 
  onClose 
}) => {
  if (!show) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="upgrade-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="upgrade-modal__header">
          <div>
            <span className="eyebrow">SUBSCRIPTION</span>
            <h2>Choose your plan</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="upgrade-grid">
          {plans.map((plan) => {
            const isCurrent = subscription?.plan === plan.name;
            return (
              <div
                key={plan.name}
                className={`plan-card${isCurrent ? " plan-card--current" : ""}${plan.name === "Professional" && !isCurrent ? " plan-card--featured" : ""}`}
              >
                {plan.name === "Professional" && !isCurrent && (
                  <span className="plan-card__badge">Popular</span>
                )}
                <div className="plan-card__name">{plan.name}</div>
                <div className="plan-card__price">
                  {plan.monthlyPrice === 0 ? "Free" : `$${plan.monthlyPrice}`}
                  {plan.monthlyPrice > 0 && <span>/mo</span>}
                </div>
                <div className="plan-card__desc">{plan.description}</div>
                <div className="plan-card__meta">
                  <div className="plan-card__meta-item">
                    <strong>{plan.maxUsers === -1 ? "Unlimited" : plan.maxUsers}</strong> users
                  </div>
                  <div className="plan-card__meta-item">
                    <strong>{plan.rateLimitPerMinute === -1 ? "Unlimited" : plan.rateLimitPerMinute}</strong> req/min
                  </div>
                </div>
                <ul className="plan-card__features">
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <button
                  className={`button ${isCurrent ? "button--subtle" : "button--primary"} button--wide button--sm`}
                  type="button"
                  disabled={isCurrent || upgradeLoading === plan.name || isStripeLoading === plan.name}
                  onClick={() => {
                    if (plan.name === "Free") handleUpgradePlan(plan.name);
                    else handleCreateStripeSession(plan.name);
                  }}
                >
                  {isCurrent
                    ? "Current Plan"
                    : (upgradeLoading === plan.name || isStripeLoading === plan.name)
                      ? "Processing..."
                      : `Switch to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
