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
import { formatCurrency, formatDate } from '../utils/helpers';

const statusColors = {
  ACTIVE: 'success',
  EXPIRED: 'error',
  CANCELLED: 'warning',
};

export default function PoliciesManagement() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [policies, setPolicies] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ status: '' });

  useEffect(() => {
    fetchPolicies();
  }, [page, rowsPerPage, filters]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        limit: rowsPerPage,
        offset: page * rowsPerPage,
      };
      const response = await adminAPI.getPolicies(params);
      setPolicies(response.data.policies || []);
      setTotal(response.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  if (loading && policies.length === 0) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Policies Management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <Card sx={{ mb: 2, p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Status"
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setPage(0);
              }}
              SelectProps={{ native: true }}
            >
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
            </TextField>
          </Grid>
        </Grid>
      </Card>

      <TableContainer component={Card}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><strong>Policy ID</strong></TableCell>
              <TableCell><strong>Worker</strong></TableCell>
              <TableCell align="right"><strong>Premium</strong></TableCell>
              <TableCell><strong>Coverage Start</strong></TableCell>
              <TableCell><strong>Coverage End</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Claims</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {policies.map((policy) => (
              <TableRow key={policy.policy_id} hover>
                <TableCell>{policy.policy_id?.slice(-8)}</TableCell>
                <TableCell>{policy.worker_id?.slice(-8)}</TableCell>
                <TableCell align="right">{formatCurrency(policy.premium_amount)}</TableCell>
                <TableCell>{formatDate(policy.coverage_start)}</TableCell>
                <TableCell>{formatDate(policy.coverage_end)}</TableCell>
                <TableCell>
                  <Chip
                    label={policy.status}
                    color={statusColors[policy.status]}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">{policy.claims_filed || 0}</TableCell>
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
