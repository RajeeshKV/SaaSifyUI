import React, { useState } from 'react';
import { orderService } from '../services/orderService';
import PaymentWrapper from './StripePaymentForm';
import tokenManager from '../services/tokenManager';

const OrderCreationForm = ({ onOrderCreated }) => {
  const [step, setStep] = useState('details'); // 'details' | 'payment'
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    customerEmail: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { tenant } = tokenManager.getCurrentUser();
  const token = tokenManager.getAccessToken();

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');
    if (parseFloat(formData.amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    setStep('payment');
  };

  const handlePaymentSuccess = async (paymentIntentId) => {
    setLoading(true);
    try {
      const orderData = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        customerEmail: formData.customerEmail,
        paymentIntentId, // Attach Stripe payment ID
        metadata: {
          source: 'web',
          timestamp: new Date().toISOString()
        }
      };

      const response = await orderService.createOrder(orderData);
      if (onOrderCreated) onOrderCreated(response);
      
      // Reset form
      setFormData({ amount: '', description: '', customerEmail: '' });
      setStep('details');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setStep('details'); // Go back to fix details if needed
    } finally {
      setLoading(false);
    }
  };

  if (step === 'payment') {
    return (
      <div className="order-creation-form">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Complete Payment</h2>
          <button className="button button--ghost button--sm" onClick={() => setStep('details')}>Back</button>
        </div>
        <div className="notice notice--neutral" style={{ marginBottom: '1.5rem' }}>
          Paying <strong>${formData.amount}</strong> for {formData.description}
        </div>
        <PaymentWrapper 
          amount={parseFloat(formData.amount)} 
          token={token}
          tenantId={tenant?.id || tenant}
          onSuccess={handlePaymentSuccess}
          onError={(msg) => setError(msg)}
        />
        {error && <div className="notice notice--error" style={{ marginTop: '1rem' }}>{error}</div>}
        {loading && <div className="muted small" style={{ marginTop: '1rem', textAlign: 'center' }}>Finalizing order...</div>}
      </div>
    );
  }

  return (
    <div className="order-creation-form">
      <h2 style={{ marginBottom: '1.5rem' }}>Create New Order</h2>
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
            placeholder="customer@example.com"
            required
          />
        </label>
        <button type="submit" className="button button--primary button--wide">
          Next: Secure Payment
        </button>
      </form>
    </div>
  );
};

export default OrderCreationForm;
