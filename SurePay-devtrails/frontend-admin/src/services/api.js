import axios from 'axios';
import useAuthStore from '../store/authStore';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => apiClient.post('/auth/admin-login', { email, password }),
};

// Admin API
export const adminAPI = {
  // Dashboard
  getDashboard: () => apiClient.get('/admin/dashboard'),

  // Claims Management
  getClaims: (params) => apiClient.get('/admin/claims', { params }),
  approveClaim: (claimId, data) => apiClient.post(`/admin/claims/${claimId}/approve`, data),
  rejectClaim: (claimId, data) => apiClient.post(`/admin/claims/${claimId}/reject`, data),

  // Policies
  getPolicies: (params) => apiClient.get('/admin/policies', { params }),

  // Workers
  getWorkers: (params) => apiClient.get('/admin/workers', { params }),

  // Analytics
  getLossRatio: () => apiClient.get('/admin/analytics/loss-ratio'),
  getClaimsTrend: (days = 30) => apiClient.get('/admin/analytics/claims-trend', { params: { days } }),
  getRevenue: () => apiClient.get('/admin/analytics/revenue'),

  // Fraud Management
  overrideFraudScore: (data) => apiClient.post('/admin/fraud/override', data),
  getClaimFraudDetails: (claimId) => apiClient.get(`/claims/${claimId}/fraud-details`),

  // Database Management
  initDatabase: () => apiClient.post('/admin/init-database'),
  seedDemoData: () => apiClient.post('/admin/seed-demo-data'),
  clearData: () => apiClient.post('/admin/clear-data'),
};

// Weather API
export const weatherAPI = {
  getCurrentConditions: (zone) => apiClient.get('/weather/current', { params: { zone } }),
  getZones: () => apiClient.get('/weather/zones'),
  checkDisruption: (zone) => apiClient.get('/weather/check-disruption', { params: { zone } }),
};

// Payments API
export const paymentsAPI = {
  initiatePayout: (claimId, method = 'UPI') =>
    apiClient.post('/payments/initiate-payout', { claim_id: claimId, payment_method: method }),
  getPaymentStatus: (paymentId) => apiClient.get(`/payments/${paymentId}`),
  completePayment: (paymentId) => apiClient.post(`/payments/${paymentId}/complete`),
};

export default apiClient;
