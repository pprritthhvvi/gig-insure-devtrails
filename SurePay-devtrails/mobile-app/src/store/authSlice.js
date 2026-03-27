import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isAuthenticated: false,
    user: null,
    token: null,
    loading: false,
    error: null,
  },
  reducers: {
    setAuth: (state, action) => {
      state.isAuthenticated = action.payload.isAuthenticated;
      state.token = action.payload.token;
      state.user = action.payload.user || null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
    },
  },
});

export const { setAuth, setUser, setLoading, setError, logout } = authSlice.actions;
export default authSlice.reducer;
