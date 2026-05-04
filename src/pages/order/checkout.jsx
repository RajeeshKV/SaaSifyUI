import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createOrderCheckoutSession } from '../../api/orders';

export default function OrderCheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const orderData = location.state?.orderData || JSON.parse(localStorage.getItem('pending_order_data')) || {
    id: 'ORD-' + Date.now(),
    amount: 99.99,
    description: 'Sample Order',
    items: [
      { name: 'Sample Product', quantity: 1, price: 99.99 }
    ]
  };

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await createOrderCheckoutSession({
        Amount: orderData.amount,
        Currency: 'usd',
        OrderId: orderData.id,
        Description: orderData.description
      });

      if (response?.checkoutUrl) {
        // Save order data for potential retry
        localStorage.setItem(`pending_order_${response.sessionId}`, JSON.stringify(orderData));
        // Redirect to Stripe
        window.location.href = response.checkoutUrl;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Payment failed:', error);
      setError('Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-checkout-container">
      <div className="checkout-header">
        <h1>Complete Your Order</h1>
        <p>Review your order details and proceed to payment</p>
      </div>

      <div className="order-summary glass-card">
        <h2>Order Summary</h2>
        <div className="summary-content">
          <div className="order-info">
            <p><strong>Order ID:</strong> {orderData.id}</p>
            <p><strong>Description:</strong> {orderData.description}</p>
          </div>
          
          <div className="items-list">
            {orderData.items.map((item, index) => (
              <div key={index} className="item-row">
                <span className="item-name">{item.name}</span>
                <span className="item-quantity">x{item.quantity}</span>
                <span className="item-price">${item.price}</span>
              </div>
            ))}
          </div>
          
          <div className="total-row" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--line)' }}>
            <span className="total-label">Total:</span>
            <span className="total-amount" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>${orderData.amount}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="notice notice--error" style={{ margin: '1.5rem 0' }}>
          {error}
        </div>
      )}

      <div className="action-buttons" style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button 
          className="button button--ghost" 
          onClick={() => navigate('/')}
          disabled={loading}
        >
          Back to Dashboard
        </button>
        <button 
          className="button button--primary button--wide" 
          onClick={handlePayment}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Proceed to Payment'}
        </button>
      </div>

      <div className="security-info muted small" style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
        <h3 className="uppercase eyebrow" style={{ marginBottom: '0.5rem' }}>Secure Payment</h3>
        <ul className="list--bullets">
          <li>Payment processed by Stripe (PCI-DSS compliant)</li>
          <li>Your card details are never stored on our servers</li>
          <li>256-bit SSL encryption</li>
        </ul>
      </div>
    </div>
  );
}
