import React, { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import { startOrderStatusPolling } from '../services/pollingService';

const OrderStatusTracker = ({ orderId }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [poller, setPoller] = useState(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const orderData = await orderService.getOrder(orderId);
        setOrder(orderData);
        
        // Start polling if order is still processing
        if (!['Completed', 'Failed'].includes(orderData.status)) {
          const orderPoller = startOrderStatusPolling(
            orderId,
            (updatedOrder) => setOrder(updatedOrder),
            (completedOrder) => setOrder(completedOrder),
            (err) => setError(err.message)
          );
          setPoller(orderPoller);
        }
      } catch (error) {
        setError(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    return () => {
      if (poller) {
        poller.stop();
      }
    };
  }, [orderId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#ff9800';
      case 'Processing': return '#2196f3';
      case 'Completed': return '#4caf50';
      case 'Failed': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return '⏳';
      case 'Processing': return '⚙️';
      case 'Completed': return '✅';
      case 'Failed': return '❌';
      default: return '❓';
    }
  };

  if (loading) {
    return <div className="loading card">Loading order details...</div>;
  }

  if (error) {
    return <div className="error card">Error: {error}</div>;
  }

  if (!order) {
    return <div className="no-order card">Order not found</div>;
  }

  return (
    <div className="order-status-tracker card">
      <h3>Order Status</h3>
      
      <div className="order-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div className="order-id">
          <strong>Order ID:</strong> {order.orderId}
        </div>
        <div className="order-amount">
          <strong>Amount:</strong> ${order.amount}
        </div>
      </div>
      
      <div className="status-indicator" style={{ textAlign: 'center', margin: '2rem 0' }}>
        <div 
          className="status-badge"
          style={{ 
            backgroundColor: getStatusColor(order.status),
            padding: '1rem 2rem',
            borderRadius: '50px',
            color: 'white',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '1.2rem',
            fontWeight: 'bold'
          }}
        >
          <span className="status-icon">{getStatusIcon(order.status)}</span>
          <span className="status-text">{order.status}</span>
        </div>
      </div>
      
      <div className="order-details">
        <div className="detail-row" style={{ marginBottom: '0.5rem' }}>
          <strong>Description:</strong> {order.description}
        </div>
        <div className="detail-row" style={{ marginBottom: '0.5rem' }}>
          <strong>Customer Email:</strong> {order.customerEmail}
        </div>
        <div className="detail-row" style={{ marginBottom: '0.5rem' }}>
          <strong>Created:</strong> {new Date(order.createdAt).toLocaleString()}
        </div>
        {order.updatedAt && (
          <div className="detail-row" style={{ marginBottom: '0.5rem' }}>
            <strong>Last Updated:</strong> {new Date(order.updatedAt).toLocaleString()}
          </div>
        )}
      </div>
      
      {(order.status === 'Processing' || order.status === 'Pending') && (
        <div className="processing-indicator" style={{ marginTop: '2rem', textAlign: 'center' }}>
          <div className="spinner spinner-medium"></div>
          <p className="muted">Processing your order... This usually takes 2-5 minutes.</p>
        </div>
      )}
    </div>
  );
};

export default OrderStatusTracker;
