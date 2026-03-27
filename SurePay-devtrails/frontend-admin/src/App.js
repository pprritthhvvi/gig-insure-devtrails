import React, { useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClaimsManagement from './pages/ClaimsManagement';
import PoliciesManagement from './pages/PoliciesManagement';
import WorkersManagement from './pages/WorkersManagement';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import useAuthStore from './store/authStore';

function App() {
  const { token } = useAuthStore();

  if (!token) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <CssBaseline />
      <TopBar />
      <Box sx={{ display: 'flex', mt: 8 }}>
        <Sidebar />
        <Box sx={{ flex: 1, ml: 35, p: 3, bgcolor: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/claims" element={<ClaimsManagement />} />
            <Route path="/policies" element={<PoliciesManagement />} />
            <Route path="/workers" element={<WorkersManagement />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Box>
      </Box>
    </BrowserRouter>
  );
}

export default App;
