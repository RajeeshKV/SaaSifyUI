import { apiRequest } from '../lib/api';

export const createOrderCheckoutSession = async (orderData) => {
  const token = localStorage.getItem('saasify-ui-session') 
    ? JSON.parse(localStorage.getItem('saasify-ui-session')).token 
    : null;
  
  return apiRequest('/api/Orders/create-checkout-session', {
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
  
  return apiRequest(`/api/orders/session/${sessionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};
