import apiClient from './apiClient';
import orderApiClient from './orderApiClient';

export const orderService = {
  // Main SaaSify API endpoints (for Stripe Checkout)
  createCheckoutSession: async (orderData) => {
    // This typically still goes to the main API for Stripe integration
    const response = await apiClient.post('/api/v1/orders/checkout', orderData);
    return response.data;
  },

  // OrderService Microservice endpoints (v1 camelCase)
  createOrder: async (orderData) => {
    const response = await orderApiClient.post('/api/v1/orders', orderData);
    return response.data;
  },

  getOrder: async (id) => {
    const response = await orderApiClient.get(`/api/v1/orders/${id}`);
    return response.data;
  },

  getOrders: async (page = 1, pageSize = 10) => {
    const response = await orderApiClient.get('/api/v1/orders', {
      params: { page, pageSize }
    });
    return response.data;
  },

  updateOrderStatus: async (id, status) => {
    const response = await orderApiClient.put(`/api/v1/orders/${id}/status`, { status });
    return response.data;
  },

  checkOrderServiceHealth: async () => {
    try {
      const response = await orderApiClient.get('/api/v1/orders/health');
      return response.status === 200 ? { status: 'Healthy' } : { status: 'Unhealthy' };
    } catch (err) {
      return { status: 'Unreachable', error: err.message };
    }
  },

  getDetailedHealth: async () => {
    const response = await orderApiClient.get('/api/health');
    return response.data;
  }
};

export default orderService;
