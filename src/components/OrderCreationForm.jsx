import React, { useState } from 'react';
import { orderService } from '../services/orderService';

const OrderCreationForm = ({ onOrderCreated }) => {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    customerEmail: '',
    metadata: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const orderData = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        customerEmail: formData.customerEmail,
        metadata: {
          source: 'web',
          timestamp: new Date().toISOString()
        }
      };

      const response = await orderService.createOrder(orderData);
      if (onOrderCreated) onOrderCreated(response);
      
      // Reset form
      setFormData({
        amount: '',
        description: '',
        customerEmail: '',
        metadata: {}
      });
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-creation-form card">
      <h2>Create New Order</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="amount">Amount ($)</label>
          <input
            type="number"
            id="amount"
            step="0.01"
            min="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            required
            className="input"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
            className="input"
            rows="3"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="customerEmail">Customer Email</label>
          <input
            type="email"
            id="customerEmail"
            value={formData.customerEmail}
            onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
            required
            className="input"
          />
        </div>
        
        <button type="submit" className="button button--primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Order'}
        </button>
      </form>
    </div>
  );
};

export default OrderCreationForm;
