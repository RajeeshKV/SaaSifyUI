import apiClient from './apiClient';
import orderApiClient from './orderApiClient';

export const orderService = {
  // SaaSify API endpoints
  createOrder: async (orderData) => {
    const response = await apiClient.post('/api/orders', orderData);
    return response.data;
  },

  getOrder: async (orderId) => {
    const response = await apiClient.get(`/api/orders/${orderId}`);
    return response.data;
  },

  getOrders: async (page = 1, pageSize = 10, status = null) => {
    const params = { page, pageSize };
    if (status) params.status = status;
    
    const response = await apiClient.get('/api/orders', { params });
    return response.data;
  },

  // OrderService endpoints
  getOrderServiceOrder: async (orderId) => {
    const response = await orderApiClient.get(`/api/orders/${orderId}`);
    return response.data;
  },

  getOrderServiceOrders: async (page = 1, pageSize = 10) => {
    const response = await orderApiClient.get('/api/orders', {
      params: { page, pageSize }
    });
    return response.data;
  },

  checkOrderServiceHealth: async () => {
    const response = await orderApiClient.get('/health');
    return response.data;
  },

  getDetailedHealth: async () => {
    const response = await orderApiClient.get('/healthz');
    return response.data;
  }
};

export default orderService;
