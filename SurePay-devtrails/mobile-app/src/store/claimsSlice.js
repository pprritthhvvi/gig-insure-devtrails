import { createSlice } from '@reduxjs/toolkit';

const claimsSlice = createSlice({
  name: 'claims',
  initialState: {
    items: [],
    selectedClaim: null,
    loading: false,
    error: null,
  },
  reducers: {
    setClaims: (state, action) => {
      state.items = action.payload;
    },
    setSelectedClaim: (state, action) => {
      state.selectedClaim = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    addClaim: (state, action) => {
      state.items.unshift(action.payload);
    },
    updateClaim: (state, action) => {
      const index = state.items.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
  },
});

export const {
  setClaims,
  setSelectedClaim,
  setLoading,
  setError,
  addClaim,
  updateClaim,
} = claimsSlice.actions;

export default claimsSlice.reducer;
