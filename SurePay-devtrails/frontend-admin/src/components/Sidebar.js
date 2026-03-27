import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Button,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assessment as AssessmentIcon,
  Description as DescriptionIcon,
  People as PeopleIcon,
  Logout as LogoutIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function Sidebar() {
  const location = useLocation();
  const { logout } = useAuthStore();

  const menuItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { label: 'Claims', icon: <AssessmentIcon />, path: '/claims' },
    { label: 'Policies', icon: <DescriptionIcon />, path: '/policies' },
    { label: 'Workers', icon: <PeopleIcon />, path: '/workers' },
    { label: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
    { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          bgcolor: '#1e3a8a',
          color: 'white',
          mt: 8,
          height: 'calc(100vh - 64px)',
          position: 'fixed',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          🛡️ GigGuard
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          Admin Dashboard — Phase 2
        </Typography>
      </Box>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
      <List sx={{ flex: 1 }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.path}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            sx={{
              '&.Mui-selected': {
                bgcolor: 'rgba(255,255,255,0.1)',
                borderLeft: '4px solid #60a5fa',
                pl: '12px',
              },
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.05)',
              },
              transition: 'all 0.2s',
            }}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={logout}
          sx={{
            color: 'white',
            borderColor: 'rgba(255,255,255,0.3)',
            '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
          }}
          size="small"
        >
          Logout
        </Button>
      </Box>
    </Drawer>
  );
}
