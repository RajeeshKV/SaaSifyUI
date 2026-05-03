import axios from 'axios';
import tokenManager from './tokenManager';

const ORDERSERVICE_API_URL = import.meta.env.VITE_ORDERSERVICE_API_URL || 'https://saasifyapi-client.rajeesh.online';

const orderApiClient = axios.create({
  baseURL: ORDERSERVICE_API_URL,
  timeout: 10000
});

// Request Interceptor - Add Auth and Tenant Headers
const addAuthHeaders = (config) => {
  const token = tokenManager.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  const { tenant } = tokenManager.getCurrentUser();
  if (tenant) {
    const tenantId = typeof tenant === 'object' ? tenant.id : tenant;
    if (tenantId) {
      config.headers['X-Tenant-Id'] = String(tenantId);
    }
  }
  return config;
};

orderApiClient.interceptors.request.use(addAuthHeaders);

// Note: OrderService might not have a refresh endpoint, it relies on the same token.
// The SaaSify apiClient handles the actual refresh.

export default orderApiClient;
