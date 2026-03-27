// Pagination utilities
export const getPaginationParams = (page, limit = 10) => ({
  offset: page * limit,
  limit,
});

// Date formatting
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Currency formatting
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

// Risk score color
export const getRiskScoreColor = (score) => {
  if (score < 30) return '#4caf50'; // Green
  if (score < 60) return '#ff9800'; // Orange
  return '#f44336'; // Red
};

// Status badge colors
export const getStatusColor = (status) => {
  const colors = {
    APPROVED: '#4caf50',
    REJECTED: '#f44336',
    UNDER_REVIEW: '#ff9800',
    FILED: '#2196f3',
    PAID: '#4caf50',
    ACTIVE: '#4caf50',
    EXPIRED: '#9e9e9e',
    CANCELLED: '#ff9800',
    VERIFIED: '#4caf50',
    PENDING: '#2196f3',
  };
  return colors[status] || '#2196f3';
};

// Error message extraction
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.detail) return error.response.data.detail;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return 'An error occurred';
};
