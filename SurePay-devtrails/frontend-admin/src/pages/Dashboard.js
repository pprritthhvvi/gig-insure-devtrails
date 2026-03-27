import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
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
  AreaChart,
  Area,
} from 'recharts';
import { adminAPI } from '../services/api';
import { formatCurrency } from '../utils/helpers';

const StatCard = ({ title, value, subtitle, color = '#1976d2', icon }) => (
  <Card
    sx={{
      bgcolor: color,
      color: 'white',
      height: '100%',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 },
    }}
  >
    <CardContent>
      <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [claimsTrend, setClaimsTrend] = useState([]);
  const [lossRatio, setLossRatio] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [dashRes, revRes, trendRes, lossRes] = await Promise.all([
        adminAPI.getDashboard().catch(() => ({ data: {} })),
        adminAPI.getRevenue().catch(() => ({ data: {} })),
        adminAPI.getClaimsTrend(30).catch(() => ({ data: { trend: [] } })),
        adminAPI.getLossRatio().catch(() => ({ data: {} })),
      ]);
      setStats(dashRes.data);
      setRevenue(revRes.data);
      setClaimsTrend(trendRes.data?.trend || []);
      setLossRatio(lossRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;

  const pieData = [
    { name: 'Approved', value: stats?.approved_claims || 0 },
    { name: 'Pending', value: stats?.pending_claims || 0 },
    { name: 'Rejected', value: Math.max(0, (stats?.total_claims || 0) - (stats?.approved_claims || 0) - (stats?.pending_claims || 0)) },
  ].filter(d => d.value > 0);

  const COLORS = ['#4caf50', '#ff9800', '#f44336'];

  const lossRatioData = (lossRatio?.loss_ratios || []).map(lr => ({
    zone: lr.zone || 'Unknown',
    premium: lr.premium_collected,
    payouts: lr.claims_paid,
    ratio: (lr.loss_ratio * 100).toFixed(1),
  }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Dashboard
        </Typography>
        <Chip
          label="Live Data"
          color="success"
          variant="outlined"
          size="small"
          sx={{ animation: 'pulse 2s infinite' }}
        />
      </Box>

      {/* Top Stats Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Workers"
            value={stats?.total_workers || 0}
            subtitle="Registered on platform"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Policies"
            value={stats?.active_policies || 0}
            subtitle="Currently insured"
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Claims"
            value={stats?.total_claims || 0}
            subtitle={`${stats?.approval_rate?.toFixed(1) || 0}% approval rate`}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Net Revenue"
            value={formatCurrency(revenue?.net_revenue || 0)}
            subtitle={`${((revenue?.profit_margin || 0) * 100).toFixed(1)}% margin`}
            color={revenue?.net_revenue >= 0 ? '#1565c0' : '#c62828'}
          />
        </Grid>
      </Grid>

      {/* Revenue Summary Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Revenue Summary
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Premium Collected</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    {formatCurrency(revenue?.total_premium_collected || 0)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Total Payouts</Typography>
                  <Typography variant="body2" fontWeight="bold" color="error.main">
                    {formatCurrency(revenue?.total_payouts || 0)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pt: 1, borderTop: '1px solid #eee' }}>
                  <Typography variant="body2" fontWeight="bold">Net Revenue</Typography>
                  <Typography variant="body2" fontWeight="bold" color={revenue?.net_revenue >= 0 ? 'success.main' : 'error.main'}>
                    {formatCurrency(revenue?.net_revenue || 0)}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Loss Ratio
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min((lossRatio?.overall_loss_ratio || 0) * 100, 100)}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: (lossRatio?.overall_loss_ratio || 0) < 0.5 ? '#4caf50' : '#f44336',
                    borderRadius: 5,
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {((lossRatio?.overall_loss_ratio || 0) * 100).toFixed(1)}% — {(lossRatio?.overall_loss_ratio || 0) < 0.5 ? 'Healthy' : 'At Risk'}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                Avg Fraud Score
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {revenue?.avg_fraud_score || 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Claims by Disruption Type
              </Typography>
              {revenue?.claims_by_type && revenue.claims_by_type.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={revenue.claims_by_type}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'total_claimed' || name === 'total_paid'
                          ? formatCurrency(value)
                          : value,
                        name === 'count' ? 'Claims' : name === 'total_claimed' ? 'Claimed' : 'Paid',
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="count" name="Claims" fill="#1976d2" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total_paid" name="Paid (₹)" fill="#4caf50" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 250 }}>
                  <Typography color="text.secondary">No claims data yet. Seed demo data from Settings.</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Claims Trend
              </Typography>
              {claimsTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={claimsTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="filed" name="Filed" stroke="#1976d2" fill="#1976d2" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="approved" name="Approved" stroke="#4caf50" fill="#4caf50" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="rejected" name="Rejected" stroke="#f44336" fill="#f44336" fillOpacity={0.15} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                  <Typography color="text.secondary">No trend data available yet</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Claims Status Distribution
              </Typography>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={90}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
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
      </Grid>

      {/* Loss Ratio by Zone */}
      {lossRatioData.length > 0 && (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Loss Ratio by Zone
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={lossRatioData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                    <YAxis dataKey="zone" type="category" width={120} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Legend />
                    <Bar dataKey="premium" name="Premium" fill="#1976d2" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="payouts" name="Payouts" fill="#f44336" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
