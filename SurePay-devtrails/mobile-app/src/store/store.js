import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import policiesReducer from './policiesSlice';
import claimsReducer from './claimsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    policies: policiesReducer,
    claims: claimsReducer,
  },
});

export default store;
