import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  Divider,
  LinearProgress,
  CircularProgress,
  Alert,
} from '@mui/material';
import { formatDateTime, formatCurrency, getRiskScoreColor } from '../utils/helpers';
import { adminAPI } from '../services/api';

// Severity color mapping
const severityColors = {
  LOW: '#4caf50',
  MODERATE: '#ff9800',
  HIGH: '#f44336',
  SEVERE: '#b71c1c',
  HAZARDOUS: '#4a148c',
  CRITICAL: '#b71c1c',
  UNHEALTHY: '#e65100',
};

// Status colors
const statusColors = {
  APPROVED: 'success',
  REJECTED: 'error',
  PENDING: 'warning',
  FILED: 'info',
};

export default function ClaimDetailsDialog({ open, claim, onClose }) {
  const [fraudData, setFraudData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && claim?.claim_id) {
      fetchFraudDetails();
    } else {
      setFraudData(null);
      setError(null);
    }
  }, [open, claim?.claim_id]);

  const fetchFraudDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getClaimFraudDetails(claim.claim_id);
      setFraudData(response.data);
    } catch (err) {
      setError('Failed to load claim evaluation details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!claim) return null;

  const evidence = fraudData?.disruption_evidence;
  const weather = fraudData?.weather_at_zone;
  const evaluation = fraudData?.evaluation_summary;
  const checks = fraudData?.fraud_details?.checks || [];
  const worker = fraudData?.worker;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" component="span">Claim Evaluation</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
            ID: {claim.claim_id?.slice(0, 8)}...
          </Typography>
        </Box>
        <Chip
          label={claim.status}
          color={statusColors[claim.status] || 'default'}
          size="small"
        />
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Loading claim evaluation...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error} — Showing basic details below.
          </Alert>
        )}

        {/* ── DISRUPTION EVIDENCE CARD ── */}
        {evidence && (
          <Box sx={{
            bgcolor: evidence.is_above_threshold ? '#fff3e0' : '#e8f5e9',
            border: `2px solid ${evidence.is_above_threshold ? '#ff9800' : '#4caf50'}`,
            borderRadius: 2,
            p: 2,
            mb: 2,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h5" component="span">{evidence.icon}</Typography>
              <Typography variant="subtitle1" fontWeight="bold">
                {evidence.title}
              </Typography>
              <Chip
                label={evidence.severity}
                size="small"
                sx={{
                  ml: 'auto',
                  bgcolor: severityColors[evidence.severity] || '#757575',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              />
            </Box>

            <Grid container spacing={2} sx={{ mb: 1.5 }}>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">Current Reading</Typography>
                <Typography variant="h6" fontWeight="bold" color={evidence.is_above_threshold ? 'error.main' : 'success.main'}>
                  {evidence.current_reading}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">Threshold</Typography>
                <Typography variant="h6" fontWeight="bold">
                  {evidence.threshold}
                </Typography>
              </Grid>
            </Grid>

            <Typography variant="body2" sx={{ mb: 1 }}>
              {evidence.description}
            </Typography>

            <Typography variant="body2" fontWeight="bold" color={evidence.is_above_threshold ? 'error.main' : 'success.main'}>
              Impact: {evidence.impact}
            </Typography>

            {/* Data Points */}
            {evidence.data_points && Object.keys(evidence.data_points).length > 0 && (
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5, display: 'block' }}>
                  Sensor Readings
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(evidence.data_points).map(([key, val]) => (
                    <Chip
                      key={key}
                      label={`${key.replace(/_/g, ' ')}: ${val}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* ── WEATHER CONDITIONS ── */}
        {weather && !evidence && (
          <Box sx={{ bgcolor: '#f5f5f5', borderRadius: 2, p: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Weather at {weather.zone}</Typography>
            <Typography variant="body2">
              {weather.condition} | {weather.temperature}°C | Rain: {weather.rain_mm}mm | AQI: {weather.aqi}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 1.5 }} />

        {/* ── CLAIM + WORKER INFO ── */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="textSecondary">Claimed</Typography>
            <Typography variant="body1" fontWeight="bold">{formatCurrency(claim.claimed_amount)}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="textSecondary">Payout</Typography>
            <Typography variant="body1" fontWeight="bold" color="success.main">
              {formatCurrency(fraudData?.payout_amount ?? claim.payout_amount ?? 0)}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="textSecondary">Filed At</Typography>
            <Typography variant="body2">{formatDateTime(claim.created_at)}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="textSecondary">Disruption</Typography>
            <Chip label={claim.disruption_type} size="small" />
          </Grid>
        </Grid>

        {worker && worker.name && (
          <Box sx={{ bgcolor: '#e3f2fd', borderRadius: 1, p: 1.5, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Worker Profile</Typography>
            <Typography variant="body2">
              {worker.name} • {worker.phone} • {worker.platform} • Zone: {worker.zone}
              {worker.risk_score != null && ` • Risk: ${worker.risk_score}`}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 1.5 }} />

        {/* ── FRAUD SCORE & BREAKDOWN ── */}
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Fraud Analysis
        </Typography>

        {/* Score Bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2">
              Fraud Score: <strong>{claim.fraud_score}</strong>/100
            </Typography>
            <Chip
              label={fraudData?.fraud_details?.risk_level || (claim.fraud_score < 10 ? 'LOW' : claim.fraud_score < 25 ? 'MEDIUM' : claim.fraud_score < 40 ? 'HIGH' : 'CRITICAL')}
              size="small"
              sx={{
                bgcolor: getRiskScoreColor(claim.fraud_score),
                color: 'white',
                fontWeight: 'bold',
              }}
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(claim.fraud_score, 100)}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                bgcolor: getRiskScoreColor(claim.fraud_score),
                borderRadius: 5,
              },
            }}
          />
        </Box>

        {/* Individual Checks */}
        {checks.length > 0 && (
          <Box sx={{ bgcolor: '#fafafa', borderRadius: 1, p: 1.5, mb: 2 }}>
            {checks.map((check, idx) => (
              <Box key={idx} sx={{ mb: idx < checks.length - 1 ? 1.5 : 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3 }}>
                  <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem' }}>
                    {check.check_type === 'GPS_ANTI_SPOOF' ? '🛡️ ' : ''}
                    {check.check_type.replace(/_/g, ' ')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" color="textSecondary">
                      {check.score}/{check.max_score}
                    </Typography>
                    <Chip
                      label={check.result}
                      size="small"
                      color={check.result === 'PASS' ? 'success' : 'error'}
                      sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(check.score / check.max_score) * 100}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: '#e0e0e0',
                    mb: 0.3,
                    '& .MuiLinearProgress-bar': {
                      bgcolor: check.result === 'PASS' ? '#4caf50' : '#f44336',
                      borderRadius: 2,
                    },
                  }}
                />
                <Typography variant="caption" color="textSecondary">
                  {check.details}
                </Typography>
                {check.check_type === 'GPS_ANTI_SPOOF' && check.verdict && (
                  <Chip
                    label={`Anti-Spoof: ${check.verdict}`}
                    size="small"
                    sx={{
                      ml: 1,
                      height: 18,
                      fontSize: '0.6rem',
                      bgcolor: check.verdict === 'CLEAN' ? '#e8f5e9' : '#ffebee',
                      color: check.verdict === 'CLEAN' ? '#2e7d32' : '#c62828',
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
        )}

        {/* ── EVALUATION SUMMARY ── */}
        {evaluation && (
          <Alert
            severity={
              evaluation.recommendation === 'AUTO_APPROVE' ? 'success' :
              evaluation.recommendation === 'APPROVE_WITH_NOTE' ? 'info' :
              evaluation.recommendation === 'MANUAL_REVIEW' ? 'warning' : 'error'
            }
            sx={{ mt: 1 }}
          >
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              {evaluation.recommendation.replace(/_/g, ' ')}
            </Typography>
            <Typography variant="caption">
              {evaluation.verdict_explanation}
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
