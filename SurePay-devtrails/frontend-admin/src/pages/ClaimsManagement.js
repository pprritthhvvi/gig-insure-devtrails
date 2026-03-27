import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Typography,
  TablePagination,
  TextField,
} from '@mui/material';
import { adminAPI } from '../services/api';
import ActionDialog from '../components/ActionDialog';
import ClaimDetailsDialog from '../components/ClaimDetailsDialog';
import { formatCurrency, formatDateTime } from '../utils/helpers';

const statusColors = {
  FILED: 'warning',
  PENDING: 'info',
  UNDER_REVIEW: 'info',
  APPROVED: 'success',
  REJECTED: 'error',
  PAID: 'success',
};

export default function ClaimsManagement() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claims, setClaims] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionDialog, setActionDialog] = useState({ open: false, action: null, loading: false });
  const [filters, setFilters] = useState({ status: '', disruption_type: '' });

  useEffect(() => {
    fetchClaims();
  }, [page, rowsPerPage, filters]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        limit: rowsPerPage,
        offset: page * rowsPerPage,
      };
      const response = await adminAPI.getClaims(params);
      setClaims(response.data.claims || []);
      setTotal(response.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reason) => {
    setActionDialog({ ...actionDialog, loading: true });
    try {
      await adminAPI.approveClaim(selectedClaim.claim_id, { approval_reason: reason });
      fetchClaims();
      setActionDialog({ open: false, action: null, loading: false });
      setSelectedClaim(null);
      setDetailsOpen(false);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to approve claim');
      setActionDialog({ ...actionDialog, loading: false });
    }
  };

  const handleReject = async (reason) => {
    setActionDialog({ ...actionDialog, loading: true });
    try {
      await adminAPI.rejectClaim(selectedClaim.claim_id, { rejection_reason: reason });
      fetchClaims();
      setActionDialog({ open: false, action: null, loading: false });
      setSelectedClaim(null);
      setDetailsOpen(false);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to reject claim');
      setActionDialog({ ...actionDialog, loading: false });
    }
  };

  if (loading && claims.length === 0) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Claims Management
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
              <option value="FILED">Filed</option>
              <option value="PENDING">Pending Review</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="PAID">Paid</option>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Disruption"
              value={filters.disruption_type}
              onChange={(e) => {
                setFilters({ ...filters, disruption_type: e.target.value });
                setPage(0);
              }}
              SelectProps={{ native: true }}
            >
              <option value="">All</option>
              <option value="RAIN">Rain</option>
              <option value="HEAT">Heat</option>
              <option value="AQI">AQI</option>
              <option value="CURFEW">Curfew</option>
              <option value="OUTAGE">Outage</option>
            </TextField>
          </Grid>
        </Grid>
      </Card>

      {/* Claims Table */}
      <TableContainer component={Card}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><strong>Claim ID</strong></TableCell>
              <TableCell><strong>Worker</strong></TableCell>
              <TableCell><strong>Disruption</strong></TableCell>
              <TableCell align="right"><strong>Amount</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Fraud Score</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {claims.map((claim) => (
              <TableRow key={claim.claim_id} hover>
                <TableCell
                  onClick={() => {
                    setSelectedClaim(claim);
                    setDetailsOpen(true);
                  }}
                  sx={{ cursor: 'pointer', color: '#1976d2', textDecoration: 'underline' }}
                >
                  {claim.claim_id?.slice(-8)}
                </TableCell>
                <TableCell>{claim.worker_id?.slice(-8)}</TableCell>
                <TableCell>{claim.disruption_type}</TableCell>
                <TableCell align="right">{formatCurrency(claim.claimed_amount)}</TableCell>
                <TableCell>
                  <Chip
                    label={claim.status}
                    color={statusColors[claim.status]}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Chip
                    label={`${claim.fraud_score}%`}
                    color={claim.fraud_score > 50 ? 'error' : 'success'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  {(claim.status === 'FILED' || claim.status === 'PENDING') && (
                    <>
                      <Button
                        size="small"
                        color="success"
                        onClick={() => {
                          setSelectedClaim(claim);
                          setActionDialog({ open: true, action: 'approve', loading: false });
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => {
                          setSelectedClaim(claim);
                          setActionDialog({ open: true, action: 'reject', loading: false });
                        }}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </TableCell>
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

      {/* Claim Details Dialog */}
      <ClaimDetailsDialog
        open={detailsOpen}
        claim={selectedClaim}
        onClose={() => setDetailsOpen(false)}
      />

      {/* Action Dialog */}
      <ActionDialog
        open={actionDialog.open}
        title={actionDialog.action === 'approve' ? 'Approve Claim' : 'Reject Claim'}
        action={actionDialog.action}
        loading={actionDialog.loading}
        onConfirm={actionDialog.action === 'approve' ? handleApprove : handleReject}
        onCancel={() => setActionDialog({ open: false, action: null, loading: false })}
      />
    </Box>
  );
}

