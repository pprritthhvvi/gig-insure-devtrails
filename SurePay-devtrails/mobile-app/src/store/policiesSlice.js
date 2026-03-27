import { createSlice } from '@reduxjs/toolkit';

const policiesSlice = createSlice({
  name: 'policies',
  initialState: {
    items: [],
    selectedPolicy: null,
    loading: false,
    error: null,
  },
  reducers: {
    setPolicies: (state, action) => {
      state.items = action.payload;
    },
    setSelectedPolicy: (state, action) => {
      state.selectedPolicy = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    addPolicy: (state, action) => {
      state.items.push(action.payload);
    },
    updatePolicy: (state, action) => {
      const index = state.items.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
  },
});

export const {
  setPolicies,
  setSelectedPolicy,
  setLoading,
  setError,
  addPolicy,
  updatePolicy,
} = policiesSlice.actions;

export default policiesSlice.reducer;
