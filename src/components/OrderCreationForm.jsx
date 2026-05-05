import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import tokenManager from '../services/tokenManager';
import { createOrderCheckoutSession } from '../api/orders';

const OrderCreationForm = ({ onOrderCreated }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    customerEmail: '',
  });
  const [error, setError] = useState('');

  const { user } = tokenManager.getCurrentUser();

  const handleNextStep = async (e) => {
    e.preventDefault();
    setError('');
    
    if (parseFloat(formData.amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    const orderData = {
      id: null,
      amount: parseFloat(formData.amount),
      description: formData.description,
      customerEmail: formData.customerEmail || user?.email,
      items: [
        { name: formData.description, quantity: 1, price: parseFloat(formData.amount) }
      ]
    };

    console.log("Initiating order checkout...");

    try {
      // 1. Call the backend to create a Stripe session (exactly like subscriptions)
      const response = await createOrderCheckoutSession({
        amount: parseFloat(formData.amount),
        currency: 'usd',
        orderId: null,
        description: formData.description,
        customerEmail: formData.customerEmail || user?.email
      });

      if (response?.checkoutUrl) {
        // 2. Redirect to Stripe immediately
        window.location.href = response.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error("Checkout failed:", err);
      setError(err.message || "Failed to start checkout");
    }
  };

  return (
    <div className="order-creation-form">
      {error && <div className="notice notice--error" style={{ marginBottom: '1rem' }}>{error}</div>}
      <form onSubmit={handleNextStep} className="form-grid">
        <label>
          <span className="muted small uppercase" style={{ display: 'block', marginBottom: '0.25rem' }}>Amount ($)</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            placeholder="0.00"
            required
          />
        </label>
        <label>
          <span className="muted small uppercase" style={{ display: 'block', marginBottom: '0.25rem' }}>Description</span>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="What is this order for?"
            required
            rows="2"
          />
        </label>
        <label>
          <span className="muted small uppercase" style={{ display: 'block', marginBottom: '0.25rem' }}>Customer Email</span>
          <input
            type="email"
            value={formData.customerEmail}
            onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
            placeholder={user?.email || "customer@example.com"}
            required
          />
        </label>
        <button type="submit" className="button button--primary button--wide">
          Next: Review & Payment
        </button>
      </form>
    </div>
  );
};

export default OrderCreationForm;
