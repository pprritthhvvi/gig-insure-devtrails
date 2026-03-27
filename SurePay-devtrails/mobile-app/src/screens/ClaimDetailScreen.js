import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { setSelectedClaim } from '../store/claimsSlice';
import { claimsService } from '../services/api';

const DISRUPTION_ICONS = {
  RAIN: { icon: 'cloud-queue', color: '#1565C0' },
  HEAT: { icon: 'wb-sunny', color: '#E65100' },
  AQI: { icon: 'cloud', color: '#6A1B9A' },
  CURFEW: { icon: 'lock-outline', color: '#C62828' },
  APP_CRASH: { icon: 'error', color: '#F57F17' },
};

const SEVERITY_COLORS = {
  LOW: '#4CAF50',
  MODERATE: '#FF9800',
  HIGH: '#F44336',
  SEVERE: '#B71C1C',
  HAZARDOUS: '#4A148C',
};

export default function ClaimDetailScreen({ route }) {
  const [loading, setLoading] = useState(true);
  const [fraudData, setFraudData] = useState(null);
  const [fraudLoading, setFraudLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useDispatch();
  const selectedClaim = useSelector((state) => state.claims.selectedClaim);

  useEffect(() => {
    loadClaimDetails();
  }, [route.params?.claimId]);

  const loadClaimDetails = async () => {
    try {
      const response = await claimsService.getClaimDetails(route.params?.claimId);
      dispatch(setSelectedClaim(response.data));
      // Also load fraud details
      loadFraudDetails(route.params?.claimId);
    } catch (error) {
      if (!selectedClaim) {
        Alert.alert('Error', 'Failed to load claim details');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadFraudDetails = async (claimId) => {
    setFraudLoading(true);
    try {
      const response = await claimsService.getFraudDetails(claimId || route.params?.claimId);
      setFraudData(response.data);
    } catch (error) {
      console.warn('Could not load fraud details:', error.message);
    } finally {
      setFraudLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClaimDetails();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  if (!selectedClaim) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="error-outline" size={48} color="#ccc" />
        <Text style={styles.errorText}>Claim not found</Text>
      </View>
    );
  }

  const statusColor = getStatusColor(selectedClaim.status);
  const evidence = fraudData?.disruption_evidence;
  const weather = fraudData?.weather_at_zone;
  const evaluation = fraudData?.evaluation_summary;
  const checks = fraudData?.fraud_details?.checks || [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1976D2']} />
      }
    >
      {/* Status Header */}
      <View style={[styles.header, { backgroundColor: statusColor }]}>
        <MaterialIcons name={getStatusIcon(selectedClaim.status)} size={36} color="#fff" />
        <Text style={styles.statusText}>{selectedClaim.status}</Text>
        <Text style={styles.statusSubtext}>
          {selectedClaim.status === 'APPROVED'
            ? 'Your claim has been approved'
            : selectedClaim.status === 'PENDING'
            ? 'Your claim is under review'
            : selectedClaim.status === 'REJECTED'
            ? 'Your claim was not approved'
            : 'Claim is being processed'}
        </Text>
      </View>

      {/* Disruption Evidence Card */}
      {evidence && (
        <View style={styles.card}>
          <View style={styles.evidenceHeader}>
            <Text style={styles.evidenceIcon}>{evidence.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.evidenceTitle}>{evidence.title}</Text>
              <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLORS[evidence.severity] || '#757575' }]}>
                <Text style={styles.severityText}>{evidence.severity}</Text>
              </View>
            </View>
          </View>

          <View style={styles.readingsRow}>
            <View style={styles.readingBox}>
              <Text style={styles.readingLabel}>Current Reading</Text>
              <Text style={[styles.readingValue, { color: evidence.is_above_threshold ? '#F44336' : '#4CAF50' }]}>
                {evidence.current_reading}
              </Text>
            </View>
            <View style={styles.readingDivider} />
            <View style={styles.readingBox}>
              <Text style={styles.readingLabel}>Threshold</Text>
              <Text style={styles.readingValue}>{evidence.threshold}</Text>
            </View>
          </View>

          <Text style={styles.evidenceDesc}>{evidence.description}</Text>

          <View style={[styles.impactBanner, { backgroundColor: evidence.is_above_threshold ? '#FFF3E0' : '#E8F5E9' }]}>
            <MaterialIcons
              name={evidence.is_above_threshold ? 'warning' : 'check-circle'}
              size={16}
              color={evidence.is_above_threshold ? '#E65100' : '#2E7D32'}
            />
            <Text style={[styles.impactText, { color: evidence.is_above_threshold ? '#E65100' : '#2E7D32' }]}>
              {evidence.impact}
            </Text>
          </View>

          {/* Sensor Data Points */}
          {evidence.data_points && Object.keys(evidence.data_points).length > 0 && (
            <View style={styles.dataPointsGrid}>
              {Object.entries(evidence.data_points).map(([key, val]) => (
                <View key={key} style={styles.dataPoint}>
                  <Text style={styles.dataPointLabel}>{key.replace(/_/g, ' ')}</Text>
                  <Text style={styles.dataPointValue}>{String(val)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Weather at Zone (fallback if no evidence) */}
      {!evidence && weather && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weather at {weather.zone}</Text>
          <View style={styles.weatherRow}>
            <View style={styles.weatherItem}>
              <MaterialIcons name="thermostat" size={20} color="#E65100" />
              <Text style={styles.weatherValue}>{weather.temperature}°C</Text>
            </View>
            <View style={styles.weatherItem}>
              <MaterialIcons name="water-drop" size={20} color="#1565C0" />
              <Text style={styles.weatherValue}>{weather.rain_mm}mm</Text>
            </View>
            <View style={styles.weatherItem}>
              <MaterialIcons name="air" size={20} color="#6A1B9A" />
              <Text style={styles.weatherValue}>AQI {weather.aqi}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Amount Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Amount Details</Text>
        <View style={styles.amountRow}>
          <View>
            <Text style={styles.amountLabel}>Claimed</Text>
            <Text style={styles.amountBig}>₹{selectedClaim.claimed_amount?.toFixed(0) || '0'}</Text>
          </View>
          <MaterialIcons name="arrow-forward" size={20} color="#ccc" />
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.amountLabel}>Payout</Text>
            <Text style={[styles.amountBig, selectedClaim.payout_amount > 0 && { color: '#4CAF50' }]}>
              ₹{selectedClaim.payout_amount?.toFixed(0) || '0'}
            </Text>
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Payout Status</Text>
          <Text style={[
            styles.value,
            selectedClaim.payout_status === 'PROCESSING' && { color: '#FF9800' },
            selectedClaim.payout_status === 'COMPLETED' && { color: '#4CAF50' },
            selectedClaim.payout_status === 'REJECTED' && { color: '#F44336' },
          ]}>
            {selectedClaim.payout_status || 'PENDING'}
          </Text>
        </View>
      </View>

      {/* Fraud Analysis Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Fraud Analysis</Text>

        {/* Score Bar */}
        <View style={styles.scoreSection}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreLabel}>Fraud Score</Text>
            <Text style={[styles.scoreBig, { color: getFraudColor(selectedClaim.fraud_score) }]}>
              {selectedClaim.fraud_score || 0}/100
            </Text>
          </View>
          <View style={styles.scoreBarBg}>
            <View style={[styles.scoreBarFill, {
              width: `${Math.min(selectedClaim.fraud_score || 0, 100)}%`,
              backgroundColor: getFraudColor(selectedClaim.fraud_score),
            }]} />
          </View>
          <View style={[styles.riskBadge, { backgroundColor: getFraudColor(selectedClaim.fraud_score) }]}>
            <Text style={styles.riskBadgeText}>
              {getRiskLabel(selectedClaim.fraud_score)}
            </Text>
          </View>
        </View>

        {/* Individual Checks */}
        {fraudLoading && (
          <View style={{ padding: 16, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#1976D2" />
            <Text style={{ color: '#999', fontSize: 12, marginTop: 4 }}>Loading checks...</Text>
          </View>
        )}

        {checks.length > 0 && (
          <View style={styles.checksContainer}>
            {checks.map((check, idx) => (
              <View key={idx} style={styles.checkRow}>
                <View style={styles.checkInfo}>
                  <Text style={styles.checkName}>
                    {check.check_type === 'GPS_ANTI_SPOOF' ? '🛡️ ' : ''}
                    {check.check_type.replace(/_/g, ' ')}
                  </Text>
                  <Text style={styles.checkDetail}>{check.details}</Text>
                </View>
                <View style={styles.checkRight}>
                  <Text style={styles.checkScore}>{check.score}/{check.max_score}</Text>
                  <View style={[styles.checkBadge, { backgroundColor: check.result === 'PASS' ? '#E8F5E9' : '#FFEBEE' }]}>
                    <Text style={[styles.checkBadgeText, { color: check.result === 'PASS' ? '#2E7D32' : '#C62828' }]}>
                      {check.result}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Anti-Spoof Verdict */}
        {evaluation?.anti_spoof_verdict && evaluation.anti_spoof_verdict !== 'NO_DATA' && (
          <View style={[styles.verdictBanner, {
            backgroundColor: evaluation.anti_spoof_verdict === 'CLEAN' ? '#E8F5E9' : '#FFEBEE',
          }]}>
            <MaterialIcons
              name={evaluation.anti_spoof_verdict === 'CLEAN' ? 'verified-user' : 'gpp-bad'}
              size={18}
              color={evaluation.anti_spoof_verdict === 'CLEAN' ? '#2E7D32' : '#C62828'}
            />
            <Text style={[styles.verdictText, {
              color: evaluation.anti_spoof_verdict === 'CLEAN' ? '#2E7D32' : '#C62828',
            }]}>
              GPS Verification: {evaluation.anti_spoof_verdict}
            </Text>
          </View>
        )}
      </View>

      {/* Evaluation Summary */}
      {evaluation && (
        <View style={[styles.card, {
          borderLeftWidth: 4,
          borderLeftColor: evaluation.recommendation === 'AUTO_APPROVE' ? '#4CAF50' :
            evaluation.recommendation === 'APPROVE_WITH_NOTE' ? '#2196F3' :
            evaluation.recommendation === 'MANUAL_REVIEW' ? '#FF9800' : '#F44336',
        }]}>
          <Text style={styles.cardTitle}>Evaluation Result</Text>
          <View style={[styles.recommendBadge, {
            backgroundColor: evaluation.recommendation === 'AUTO_APPROVE' ? '#E8F5E9' :
              evaluation.recommendation === 'APPROVE_WITH_NOTE' ? '#E3F2FD' :
              evaluation.recommendation === 'MANUAL_REVIEW' ? '#FFF3E0' : '#FFEBEE',
          }]}>
            <Text style={[styles.recommendText, {
              color: evaluation.recommendation === 'AUTO_APPROVE' ? '#2E7D32' :
                evaluation.recommendation === 'APPROVE_WITH_NOTE' ? '#1565C0' :
                evaluation.recommendation === 'MANUAL_REVIEW' ? '#E65100' : '#C62828',
            }]}>
              {evaluation.recommendation?.replace(/_/g, ' ')}
            </Text>
          </View>
          <Text style={styles.verdictExplanation}>{evaluation.verdict_explanation}</Text>
          <View style={styles.checksCount}>
            <Text style={styles.checksCountText}>
              ✅ {evaluation.checks_passed}/{evaluation.total_checks} checks passed
              {evaluation.checks_flagged > 0 ? ` • ⚠️ ${evaluation.checks_flagged} flagged` : ''}
            </Text>
          </View>
        </View>
      )}

      {/* Claim Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Claim Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Claim ID</Text>
          <Text style={styles.value}>{selectedClaim.id?.slice(0, 8)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Disruption Type</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons
              name={DISRUPTION_ICONS[selectedClaim.disruption_type]?.icon || 'warning'}
              size={16}
              color={DISRUPTION_ICONS[selectedClaim.disruption_type]?.color || '#999'}
            />
            <Text style={[styles.value, { marginLeft: 4 }]}>{selectedClaim.disruption_type}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Filed</Text>
          <Text style={styles.value}>
            {new Date(selectedClaim.triggered_at).toLocaleDateString()} {new Date(selectedClaim.triggered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function getStatusColor(status) {
  switch (status) {
    case 'APPROVED': return '#4CAF50';
    case 'PENDING': return '#FF9800';
    case 'REJECTED': return '#F44336';
    default: return '#2196F3';
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'APPROVED': return 'check-circle';
    case 'PENDING': return 'schedule';
    case 'REJECTED': return 'cancel';
    default: return 'info';
  }
}

function getFraudColor(score) {
  if (!score || score < 10) return '#4CAF50';
  if (score < 25) return '#8BC34A';
  if (score < 40) return '#FF9800';
  return '#F44336';
}

function getRiskLabel(score) {
  if (!score || score < 10) return 'LOW RISK';
  if (score < 25) return 'MEDIUM RISK';
  if (score < 40) return 'HIGH RISK';
  return 'CRITICAL RISK';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#999', marginTop: 8 },

  header: { paddingVertical: 24, alignItems: 'center' },
  statusText: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  statusSubtext: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },

  card: {
    backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10,
    borderRadius: 12, padding: 14, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 12,
    paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },

  // Evidence
  evidenceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  evidenceIcon: { fontSize: 28, marginRight: 10 },
  evidenceTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  severityBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  severityText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  readingsRow: { flexDirection: 'row', backgroundColor: '#FAFAFA', borderRadius: 8, padding: 12, marginBottom: 10 },
  readingBox: { flex: 1, alignItems: 'center' },
  readingDivider: { width: 1, backgroundColor: '#e0e0e0', marginHorizontal: 8 },
  readingLabel: { fontSize: 11, color: '#999', marginBottom: 4 },
  readingValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  evidenceDesc: { fontSize: 12, color: '#555', lineHeight: 18, marginBottom: 8 },
  impactBanner: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 6, marginBottom: 8 },
  impactText: { fontSize: 12, fontWeight: '600', marginLeft: 6, flex: 1 },
  dataPointsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  dataPoint: { width: '50%', paddingVertical: 4 },
  dataPointLabel: { fontSize: 10, color: '#999', textTransform: 'capitalize' },
  dataPointValue: { fontSize: 12, fontWeight: '600', color: '#333' },

  // Weather
  weatherRow: { flexDirection: 'row', justifyContent: 'space-around' },
  weatherItem: { alignItems: 'center' },
  weatherValue: { fontSize: 13, fontWeight: '600', color: '#333', marginTop: 4 },

  // Amount
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  amountLabel: { fontSize: 11, color: '#999', marginBottom: 2 },
  amountBig: { fontSize: 20, fontWeight: 'bold', color: '#333' },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
  label: { fontSize: 13, color: '#666' },
  value: { fontSize: 13, fontWeight: '600', color: '#333' },

  // Fraud
  scoreSection: { marginBottom: 12 },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  scoreLabel: { fontSize: 13, color: '#666' },
  scoreBig: { fontSize: 18, fontWeight: 'bold' },
  scoreBarBg: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  scoreBarFill: { height: '100%', borderRadius: 4 },
  riskBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 4 },
  riskBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  checksContainer: { marginTop: 4 },
  checkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
  checkInfo: { flex: 1, marginRight: 8 },
  checkName: { fontSize: 12, fontWeight: '600', color: '#333', textTransform: 'capitalize' },
  checkDetail: { fontSize: 10, color: '#999', marginTop: 2 },
  checkRight: { alignItems: 'flex-end' },
  checkScore: { fontSize: 11, color: '#666', marginBottom: 2 },
  checkBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3 },
  checkBadgeText: { fontSize: 9, fontWeight: 'bold' },

  verdictBanner: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 6, marginTop: 8 },
  verdictText: { fontSize: 12, fontWeight: '600', marginLeft: 6 },

  // Evaluation
  recommendBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 8 },
  recommendText: { fontSize: 12, fontWeight: 'bold' },
  verdictExplanation: { fontSize: 12, color: '#555', lineHeight: 18, marginBottom: 8 },
  checksCount: { marginTop: 4 },
  checksCountText: { fontSize: 12, color: '#666' },
});
