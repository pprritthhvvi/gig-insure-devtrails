import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://10.48.228.88:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      SecureStore.deleteItemAsync('authToken');
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (phone, password) =>
    apiClient.post('/auth/login', { phone, password }),
  register: (userData) =>
    apiClient.post('/auth/register', userData),
  logout: () =>
    apiClient.post('/auth/logout'),
};

export const workerService = {
  getProfile: () =>
    apiClient.get('/workers/profile'),
  updateProfile: (data) =>
    apiClient.put('/workers/profile', data),
  getPremiumQuote: (zone, platform, maxPayout) =>
    apiClient.get('/workers/premium-quote', {
      params: { zone, platform, max_payout: maxPayout },
    }),
};

export const policiesService = {
  getMyPolicies: () =>
    apiClient.get('/policies/my'),
  getPolicyDetails: (policyId) =>
    apiClient.get(`/policies/${policyId}`),
  createPolicy: (data) =>
    apiClient.post('/policies/create', data),
  updatePolicy: (policyId, data) =>
    apiClient.put(`/policies/${policyId}`, data),
};

export const claimsService = {
  getMyClaims: () =>
    apiClient.get('/claims/my'),
  getClaimDetails: (claimId) =>
    apiClient.get(`/claims/${claimId}`),
  fileClaim: (data) =>
    apiClient.post('/claims', data),
  updateClaim: (claimId, data) =>
    apiClient.put(`/claims/${claimId}`, data),
  getClaimHistory: (policyId) =>
    apiClient.get(`/claims/policy/${policyId}`),
  getFraudDetails: (claimId) =>
    apiClient.get(`/claims/${claimId}/fraud-details`),
};

export const weatherService = {
  getCurrentConditions: (zone) =>
    apiClient.get('/weather/current', { params: { zone } }),
  getForecast: (zone, days = 7) =>
    apiClient.get('/weather/forecast', { params: { zone, days } }),
  checkDisruption: (zone) =>
    apiClient.get('/weather/check-disruption', { params: { zone } }),
  getZones: () =>
    apiClient.get('/weather/zones'),
};

export const paymentsService = {
  initiatePayout: (claimId, paymentMethod = 'UPI') =>
    apiClient.post('/payments/initiate-payout', {
      claim_id: claimId,
      payment_method: paymentMethod,
    }),
  getPaymentStatus: (paymentId) =>
    apiClient.get(`/payments/${paymentId}`),
  getMyPayments: (workerId) =>
    apiClient.get(`/payments/worker/${workerId}`),
};

export default apiClient;
