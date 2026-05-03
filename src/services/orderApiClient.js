import axios from 'axios';
import tokenManager from './tokenManager';

const ORDERSERVICE_API_URL = import.meta.env.VITE_ORDERSERVICE_API_URL || 'https://orderservice.onrender.com';

const orderApiClient = axios.create({
  baseURL: ORDERSERVICE_API_URL,
  timeout: 10000
});

// Request Interceptor - Add JWT Token
const addAuthHeader = (config) => {
  const token = tokenManager.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

orderApiClient.interceptors.request.use(addAuthHeader);

// Note: OrderService might not have a refresh endpoint, it relies on the same token.
// The SaaSify apiClient handles the actual refresh.

export default orderApiClient;
