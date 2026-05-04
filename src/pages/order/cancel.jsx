import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function OrderCancelPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const sessionId = urlParams.get('session_id');

    if (sessionId) {
      const savedOrder = localStorage.getItem(`pending_order_${sessionId}`);
      if (savedOrder) {
        setOrderData(JSON.parse(savedOrder));
      }
    }
  }, [location]);

  return (
    <div className="order-cancel-container">
      <div className="cancel-header">
        <div className="cancel-icon">✕</div>
        <h1>Payment Cancelled</h1>
        <p>Your order payment was cancelled. No charges were made.</p>
      </div>
      
      <div className="explanation">
        <h2>What happened?</h2>
        <p>The payment process was interrupted or cancelled. This could happen if:</p>
        <ul className="muted list--bullets">
          <li>You closed the payment window</li>
          <li>Your payment was declined</li>
          <li>You chose to cancel the payment</li>
          <li>There was a technical issue</li>
        </ul>
      </div>

      <div className="next-steps">
        <h2>Your options:</h2>
        <div className="options-grid">
          <div className="option-card glass-card">
            <h3>Try Again</h3>
            <p className="muted small">Complete your order with the same or different payment method</p>
            <button className="button button--primary button--wide" onClick={() => navigate('/')}>
              Retry Order
            </button>
          </div>
          
          <div className="option-card glass-card">
            <h3>Contact Support</h3>
            <p className="muted small">Get help if you encountered technical issues</p>
            <button className="button button--ghost button--wide" onClick={() => navigate('/')}>
              Get Help
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
