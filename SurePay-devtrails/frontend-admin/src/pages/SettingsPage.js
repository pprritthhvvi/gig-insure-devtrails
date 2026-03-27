import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  Snackbar,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Storage as StorageIcon,
  PlayArrow as SeedIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { adminAPI } from '../services/api';

export default function SettingsPage() {
  const [loading, setLoading] = useState('');
  const [message, setMessage] = useState({ text: '', severity: 'success' });
  const [snackOpen, setSnackOpen] = useState(false);

  const handleAction = async (action, label) => {
    setLoading(label);
    try {
      let res;
      switch (action) {
        case 'init':
          res = await adminAPI.initDatabase();
          break;
        case 'seed':
          res = await adminAPI.seedDemoData();
          break;
        default:
          return;
      }
      setMessage({ text: res.data?.message || `${label} completed!`, severity: 'success' });
    } catch (err) {
      setMessage({ text: err.response?.data?.detail || `${label} failed`, severity: 'error' });
    } finally {
      setLoading('');
      setSnackOpen(true);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Settings & Administration
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Database Management
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Initialize database tables. Run this once when setting up the backend.
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={loading === 'Init DB' ? <CircularProgress size={20} /> : <StorageIcon />}
                    onClick={() => handleAction('init', 'Init DB')}
                    disabled={!!loading}
                  >
                    Initialize Database
                  </Button>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Seed demo data (5 workers, 5 policies, 10 claims). Clears existing data first.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={loading === 'Seed Data' ? <CircularProgress size={20} color="inherit" /> : <SeedIcon />}
                    onClick={() => handleAction('seed', 'Seed Data')}
                    disabled={!!loading}
                  >
                    Seed Demo Data
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                API Configuration
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Backend API URL
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                {process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                Environment
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                {process.env.NODE_ENV || 'development'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={message.severity} onClose={() => setSnackOpen(false)}>
          {message.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}
