import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getOrderSessionDetails } from '../../api/orders';

export default function OrderSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const sessionId = urlParams.get('session_id');
    const success = urlParams.get('success');

    if (sessionId && (success === 'true' || urlParams.has('session_id'))) {
      fetchOrderDetails(sessionId);
    } else {
      setError('Invalid session parameters');
      setLoading(false);
    }
  }, [location]);

  const fetchOrderDetails = async (sessionId) => {
    try {
      const data = await getOrderSessionDetails(sessionId);
      setOrderData(data);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      setError('Unable to load order details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container" style={{ margin: '2rem', padding: '2rem', background: 'rgba(255,0,0,0.1)', borderRadius: '12px', textAlign: 'center' }}>
        <h1>Error</h1>
        <p>{error}</p>
        <button className="button button--primary" onClick={() => navigate('/')}>
          Go back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="order-success-container">
      <div className="success-header">
        <div className="success-icon">✓</div>
        <h1>Order Payment Successful!</h1>
        <p>Your order has been processed successfully.</p>
      </div>
      
      <div className="order-details">
        <h2>Order Details</h2>
        {orderData && (
          <div className="order-info">
            <div className="detail-row">
              <span className="label">Order ID:</span>
              <span className="value">#{orderData.orderId}</span>
            </div>
            <div className="detail-row">
              <span className="label">Amount:</span>
              <span className="value">${orderData.amount} {orderData.currency}</span>
            </div>
            <div className="detail-row">
              <span className="label">Date:</span>
              <span className="value">{new Date(orderData.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="detail-row">
              <span className="label">Status:</span>
              <span className="status-badge status-paid">Paid</span>
            </div>
          </div>
        )}
      </div>

      {orderData?.items && orderData.items.length > 0 && (
        <div className="order-items">
          <h2>Order Items</h2>
          <div className="items-list">
            {orderData.items.map((item, index) => (
              <div key={index} className="item-row">
                <span className="item-name">{item.name}</span>
                <span className="item-quantity">x{item.quantity}</span>
                <span className="item-price">${item.price}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="next-steps">
        <h2>What's Next?</h2>
        <ul>
          <li>Check your email for order confirmation</li>
          <li>View your order history</li>
          <li>Download your receipt</li>
        </ul>
      </div>

      <div className="action-buttons">
        <button className="button button--primary" onClick={() => navigate('/')}>
          Go to Dashboard
        </button>
        <button className="button button--ghost" onClick={() => window.print()}>
          Print Receipt
        </button>
      </div>
    </div>
  );
}
