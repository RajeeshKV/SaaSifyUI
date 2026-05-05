import { apiRequest } from '../lib/api';

export const createOrderCheckoutSession = async (orderData) => {
  const token = localStorage.getItem('saasify-ui-session')
    ? JSON.parse(localStorage.getItem('saasify-ui-session')).token
    : null;

  return apiRequest('/api/v1/orders/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  });
};

export const getOrderSessionDetails = async (sessionId) => {
  const token = localStorage.getItem('saasify-ui-session')
    ? JSON.parse(localStorage.getItem('saasify-ui-session')).token
    : null;

  return apiRequest(`/api/v1/orders/success?session_id=${sessionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};
