// Token Storage
const tokenManager = {
  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('current_user');
    const tenant = localStorage.getItem('current_tenant');
    return {
      user: user ? JSON.parse(user) : null,
      tenant: tenant ? JSON.parse(tenant) : null
    };
  },
  setCurrentUser: (user, tenant) => {
    localStorage.setItem('current_user', JSON.stringify(user));
    localStorage.setItem('current_tenant', JSON.stringify(tenant));
  },
  clearCurrentUser: () => {
    localStorage.removeItem('current_user');
    localStorage.removeItem('current_tenant');
  }
};

export default tokenManager;
