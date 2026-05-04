import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { API_BASE_URL } from '../lib/api';

// Placeholder key - User should update this in .env (VITE_STRIPE_PUBLIC_KEY)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51BTjS5CHpS0oXCu56H4S8H9hJ0H9H9H9H9H9H9H9');

function StripePaymentForm({ amount, onSuccess, onError, token, tenantId }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);

    try {
      // 1. Create payment intent via backend
      const response = await fetch(`${API_BASE_URL}/api/Orders/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-Id': String(tenantId)
        },
        body: JSON.stringify({ amount, currency: 'usd' })
      });
      
      if (!response.ok) throw new Error('Failed to create payment intent');
      const { clientSecret, paymentIntentId } = await response.json();
      
      // 2. Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (error) {
        onError(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntentId);
      }
    } catch (error) {
      onError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-grid">
      <div className="card-element-container" style={{ 
        padding: '1rem', 
        background: 'rgba(255,255,255,0.05)', 
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '1.5rem'
      }}>
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#fff',
              '::placeholder': { color: '#aab7c4' },
            },
            invalid: { color: '#ff4d4d' },
          }
        }} />
      </div>
      
      <button 
        type="submit" 
        disabled={processing || !stripe}
        className="button button--primary button--wide"
      >
        {processing ? 'Processing Payment...' : `Pay $${amount}`}
      </button>
    </form>
  );
}

export default function PaymentWrapper(props) {
  return (
    <Elements stripe={stripePromise}>
      <StripePaymentForm {...props} />
    </Elements>
  );
}
