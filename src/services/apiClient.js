import axios from 'axios';
import tokenManager from './tokenManager';

const SAASIFY_API_URL = import.meta.env.VITE_SAASIFY_API_URL || 'https://saasifyapi.rajeesh.online';

const apiClient = axios.create({
  baseURL: SAASIFY_API_URL,
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
    // Handle both object {id} or direct ID value
    const tenantId = typeof tenant === 'object' ? tenant.id : tenant;
    if (tenantId) {
      config.headers['X-Tenant-Id'] = String(tenantId);
    }
  }
  return config;
};

apiClient.interceptors.request.use(addAuthHeaders);

// Token Refresh Logic
const refreshAccessToken = async () => {
  try {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');
    
    // Use a separate axios instance to avoid infinite loop with interceptor
    const response = await axios.post(`${SAASIFY_API_URL}/api/Auth/refresh`, { refreshToken });
    
    const { accessToken, refreshToken: newRefreshToken } = response.data;
    tokenManager.setTokens(accessToken, newRefreshToken);
    return accessToken;
  } catch (error) {
    tokenManager.clearTokens();
    tokenManager.clearCurrentUser();
    window.dispatchEvent(new CustomEvent('auth:expired'));
    throw error;
  }
};

// Response Interceptor - Handle Token Refresh
const handleTokenRefresh = async (error) => {
  const originalRequest = error.config;
  if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;
    try {
      const newToken = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
  return Promise.reject(error);
};

apiClient.interceptors.response.use(null, handleTokenRefresh);

export default apiClient;
