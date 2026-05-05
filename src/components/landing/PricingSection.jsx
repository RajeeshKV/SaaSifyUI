import React from 'react';

const PricingSection = ({ plans, plansLoading, onOpenAuthModal }) => {
  return (
    <div className="pricing-section">
      <div className="pricing-section__title">
        <span className="eyebrow">SUBSCRIPTION PLANS</span>
        <h2>Choose the right plan for your team</h2>
      </div>
      {plansLoading ? (
        <div className="pricing-grid">
          {[1, 2, 3].map((i) => (
            <div className="plan-card" key={i}>
              <div className="skeleton-row" style={{ width: "40%", marginBottom: "0.5rem" }} />
              <div className="skeleton-row" style={{ width: "60%", marginBottom: "0.4rem" }} />
              <div className="skeleton-row" style={{ width: "80%", marginBottom: "1rem" }} />
              <div className="skeleton-row" style={{ width: "100%", height: "2.5rem" }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="pricing-grid">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`plan-card${plan.name === "Professional" ? " plan-card--featured" : ""}`}
            >
              {plan.name === "Professional" && (
                <span className="plan-card__badge">Most Popular</span>
              )}
              <div className="plan-card__name">{plan.name}</div>
              <div className="plan-card__price">
                {plan.monthlyPrice === 0 ? "Free" : `$${plan.monthlyPrice}`}
                {plan.monthlyPrice > 0 && <span>/mo</span>}
              </div>
              <div className="plan-card__desc">{plan.description}</div>
              <div className="plan-card__meta">
                <div className="plan-card__meta-item">
                  <strong>{plan.maxUsers}</strong> users
                </div>
                <div className="plan-card__meta-item">
                  <strong>{plan.rateLimitPerMinute}</strong> req/min
                </div>
              </div>
              <ul className="plan-card__features">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <button
                className={`button ${plan.name === "Professional" ? "button--primary" : "button--ghost"} button--wide`}
                type="button"
                onClick={() => onOpenAuthModal("register")}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PricingSection;
