import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { adminAPI, weatherAPI } from '../services/api';
import { formatCurrency, getRiskScoreColor } from '../utils/helpers';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState(null);
  const [lossRatio, setLossRatio] = useState(null);
  const [weatherData, setWeatherData] = useState({});
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [fraudDialogOpen, setFraudDialogOpen] = useState(false);
  const [fraudOverride, setFraudOverride] = useState({ claim_id: '', new_fraud_score: 0, override_reason: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [revRes, lossRes, zonesRes] = await Promise.all([
        adminAPI.getRevenue().catch(() => ({ data: {} })),
        adminAPI.getLossRatio().catch(() => ({ data: {} })),
        weatherAPI.getZones().catch(() => ({ data: { zones: [] } })),
      ]);
      setRevenue(revRes.data);
      setLossRatio(lossRes.data);
      setZones(zonesRes.data?.zones || []);

      // Fetch weather for first 3 zones
      const zoneList = zonesRes.data?.zones?.slice(0, 4) || [];
      const weatherPromises = zoneList.map(z =>
        weatherAPI.getCurrentConditions(z).catch(() => ({ data: {} }))
      );
      const weatherResults = await Promise.all(weatherPromises);
      const weatherMap = {};
      zoneList.forEach((z, i) => {
        weatherMap[z] = weatherResults[i].data;
      });
      setWeatherData(weatherMap);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFraudOverride = async () => {
    try {
      await adminAPI.overrideFraudScore(fraudOverride);
      setFraudDialogOpen(false);
      setFraudOverride({ claim_id: '', new_fraud_score: 0, override_reason: '' });
      alert('Fraud score overridden successfully');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to override');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  const COLORS = ['#1976d2', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4'];

  const typeData = (revenue?.claims_by_type || []).map(ct => ({
    name: ct.type,
    claims: ct.count,
    claimed: ct.total_claimed,
    paid: ct.total_paid,
  }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Analytics & Intelligence
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setFraudDialogOpen(true)}
        >
          Fraud Override
        </Button>
      </Box>

      {/* Financial KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #1976d2' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Premium Collected</Typography>
              <Typography variant="h5" fontWeight="bold">
                {formatCurrency(revenue?.total_premium_collected || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #f44336' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total Payouts</Typography>
              <Typography variant="h5" fontWeight="bold">
                {formatCurrency(revenue?.total_payouts || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: `4px solid ${(revenue?.net_revenue || 0) >= 0 ? '#4caf50' : '#f44336'}` }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Net Revenue</Typography>
              <Typography variant="h5" fontWeight="bold" color={(revenue?.net_revenue || 0) >= 0 ? 'success.main' : 'error.main'}>
                {formatCurrency(revenue?.net_revenue || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #ff9800' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Loss Ratio</Typography>
              <Typography variant="h5" fontWeight="bold">
                {((lossRatio?.overall_loss_ratio || 0) * 100).toFixed(1)}%
              </Typography>
              <Chip
                label={lossRatio?.overall_loss_ratio < 0.5 ? 'Healthy' : 'At Risk'}
                color={lossRatio?.overall_loss_ratio < 0.5 ? 'success' : 'error'}
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Claims by Type */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Claims Distribution by Type
              </Typography>
              {typeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={50}
                      fill="#8884d8"
                      dataKey="claims"
                      label={({ name, claims }) => `${name}: ${claims}`}
                    >
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                  <Typography color="text.secondary">No claims data</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Loss Ratio by Zone Table */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Loss Ratio by Zone
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Zone</strong></TableCell>
                      <TableCell align="right"><strong>Premium</strong></TableCell>
                      <TableCell align="right"><strong>Payouts</strong></TableCell>
                      <TableCell align="right"><strong>Loss Ratio</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(lossRatio?.loss_ratios || []).map((lr, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{lr.zone}</TableCell>
                        <TableCell align="right">{formatCurrency(lr.premium_collected)}</TableCell>
                        <TableCell align="right">{formatCurrency(lr.claims_paid)}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${(lr.loss_ratio * 100).toFixed(1)}%`}
                            size="small"
                            color={lr.loss_ratio < 0.4 ? 'success' : lr.loss_ratio < 0.7 ? 'warning' : 'error'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!lossRatio?.loss_ratios || lossRatio.loss_ratios.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No zone data available</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Live Weather Monitoring */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            🌦️ Live Weather Monitoring
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(weatherData).map(([zone, data]) => (
              <Grid item xs={12} sm={6} md={3} key={zone}>
                <Card
                  variant="outlined"
                  sx={{
                    bgcolor: data?.is_disrupted ? 'rgba(244,67,54,0.05)' : 'rgba(76,175,80,0.05)',
                    borderColor: data?.is_disrupted ? '#f44336' : '#4caf50',
                  }}
                >
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="subtitle2" fontWeight="bold">{zone}</Typography>
                    <Typography variant="h6">{data?.temperature?.toFixed(1) || '--'}°C</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {data?.condition || 'Unknown'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                      <Chip label={`💧 ${data?.rain_mm || 0}mm`} size="small" variant="outlined" />
                      <Chip label={`🌬️ AQI ${data?.aqi || 0}`} size="small" variant="outlined" />
                    </Box>
                    {data?.is_disrupted && (
                      <Chip
                        label="⚠️ DISRUPTION"
                        color="error"
                        size="small"
                        sx={{ mt: 1, fontWeight: 'bold' }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {Object.keys(weatherData).length === 0 && (
              <Grid item xs={12}>
                <Typography color="text.secondary" textAlign="center">
                  Weather monitoring data not available
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Fraud Override Dialog */}
      <Dialog open={fraudDialogOpen} onClose={() => setFraudDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Override Fraud Score</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Claim ID"
            value={fraudOverride.claim_id}
            onChange={(e) => setFraudOverride({ ...fraudOverride, claim_id: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
            placeholder="Enter claim UUID"
          />
          <TextField
            fullWidth
            label="New Fraud Score (0-100)"
            type="number"
            value={fraudOverride.new_fraud_score}
            onChange={(e) => setFraudOverride({ ...fraudOverride, new_fraud_score: parseInt(e.target.value) || 0 })}
            sx={{ mb: 2 }}
            inputProps={{ min: 0, max: 100 }}
          />
          <TextField
            fullWidth
            label="Override Reason"
            value={fraudOverride.override_reason}
            onChange={(e) => setFraudOverride({ ...fraudOverride, override_reason: e.target.value })}
            multiline
            rows={3}
            placeholder="Explain why the fraud score should be changed"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFraudDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleFraudOverride} variant="contained" color="primary">
            Override Score
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
