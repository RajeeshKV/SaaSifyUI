import apiClient from './apiClient';
import orderApiClient from './orderApiClient';

export const orderService = {
  // SaaSify API endpoints
  createOrder: async (orderData) => {
    const response = await apiClient.post('/api/Orders', orderData);
    return response.data;
  },

  getOrder: async (orderId) => {
    const response = await apiClient.get(`/api/Orders/${orderId}`);
    return response.data;
  },

  getOrders: async (page = 1, pageSize = 10, status = null) => {
    const params = { pageNumber: page, pageSize };
    if (status) params.status = status;
    
    const response = await apiClient.get('/api/Orders', { params });
    return response.data;
  },

  // OrderService endpoints
  getOrderServiceOrder: async (orderId) => {
    const response = await orderApiClient.get(`/api/Orders/${orderId}`);
    return response.data;
  },

  getOrderServiceOrders: async (page = 1, pageSize = 10) => {
    const response = await orderApiClient.get('/api/Orders', {
      params: { page, pageSize }
    });
    return response.data;
  },

  checkOrderServiceHealth: async () => {
    const response = await orderApiClient.get('/Health');
    return response.data;
  },

  getDetailedHealth: async () => {
    const response = await orderApiClient.get('/Healthz');
    return response.data;
  }
};

export default orderService;
