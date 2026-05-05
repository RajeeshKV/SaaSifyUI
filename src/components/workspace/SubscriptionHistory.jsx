import React from 'react';

const SubscriptionHistory = ({ history }) => {
  if (!history || history.length === 0) return null;

  return (
    <div className="glass-card">
      <div className="section-heading section-heading--compact">
        <span className="eyebrow">HISTORY</span>
        <h2>Plan Changes</h2>
      </div>
      <div className="history-list" style={{ marginTop: "0.5rem" }}>
        {history.map((item) => (
          <div className="history-item" key={item.id}>
            <span className="history-item__plan">{item.plan}</span>
            <span className="history-item__date">
              {new Date(item.createdAt).toLocaleDateString("en-IN")}
            </span>
            <span
              className={`history-item__status history-item__status--${item.isActive ? "active" : "inactive"}`}
            >
              {item.isActive ? "Active" : "Ended"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionHistory;
