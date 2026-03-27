import { useState, useCallback } from 'react';

export const useTable = (initialLimit = 10) => {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const handlePageChange = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleLimitChange = useCallback((event) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  return {
    page,
    limit,
    total,
    setTotal,
    handlePageChange,
    handleLimitChange,
    offset: page * limit,
  };
};

export const useFilters = (initialFilters = {}) => {
  const [filters, setFilters] = useState(initialFilters);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  return {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
  };
};

export const useAsyncData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(async (apiCall) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      setData(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    data,
    setData,
    execute,
    clearError: () => setError(null),
  };
};
