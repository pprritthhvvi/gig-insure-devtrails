import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Typography,
  TablePagination,
  Grid,
  TextField,
} from '@mui/material';
import { adminAPI } from '../services/api';
import { getRiskScoreColor } from '../utils/helpers';

const kycStatusColors = {
  VERIFIED: 'success',
  UNDER_REVIEW: 'warning',
  REJECTED: 'error',
  PENDING: 'default',
};

export default function WorkersManagement() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workers, setWorkers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ kyc_status: '', platform: '' });

  useEffect(() => {
    fetchWorkers();
  }, [page, rowsPerPage, filters]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        limit: rowsPerPage,
        offset: page * rowsPerPage,
      };
      const response = await adminAPI.getWorkers(params);
      setWorkers(response.data.workers || []);
      setTotal(response.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load workers');
    } finally {
      setLoading(false);
    }
  };

  if (loading && workers.length === 0) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Workers Management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <Card sx={{ mb: 2, p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="KYC Status"
              value={filters.kyc_status}
              onChange={(e) => {
                setFilters({ ...filters, kyc_status: e.target.value });
                setPage(0);
              }}
              SelectProps={{ native: true }}
            >
              <option value="">All</option>
              <option value="VERIFIED">Verified</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="REJECTED">Rejected</option>
              <option value="PENDING">Pending</option>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Platform"
              value={filters.platform}
              onChange={(e) => {
                setFilters({ ...filters, platform: e.target.value });
                setPage(0);
              }}
              SelectProps={{ native: true }}
            >
              <option value="">All</option>
              <option value="ZOMATO">Zomato</option>
              <option value="SWIGGY">Swiggy</option>
              <option value="BLINKIT">Blinkit</option>
            </TextField>
          </Grid>
        </Grid>
      </Card>

      <TableContainer component={Card}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><strong>Worker ID</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Phone</strong></TableCell>
              <TableCell><strong>Platform</strong></TableCell>
              <TableCell><strong>KYC Status</strong></TableCell>
              <TableCell align="right"><strong>Risk Score</strong></TableCell>
              <TableCell align="right"><strong>Active Policies</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workers.map((worker) => (
              <TableRow key={worker.worker_id} hover>
                <TableCell>{worker.worker_id?.slice(-8)}</TableCell>
                <TableCell>{worker.name}</TableCell>
                <TableCell>{worker.phone}</TableCell>
                <TableCell>{worker.platform}</TableCell>
                <TableCell>
                  <Chip
                    label={worker.kyc_status}
                    color={kycStatusColors[worker.kyc_status]}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Box
                    sx={{
                      display: 'inline-block',
                      bgcolor: getRiskScoreColor(worker.risk_score),
                      color: 'white',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.875rem',
                    }}
                  >
                    {worker.risk_score?.toFixed(1)}%
                  </Box>
                </TableCell>
                <TableCell align="right">{worker.active_policies || 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>
    </Box>
  );
}
