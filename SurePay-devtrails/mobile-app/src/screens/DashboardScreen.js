import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { setPolicies } from '../store/policiesSlice';
import { setClaims } from '../store/claimsSlice';
import { policiesService, claimsService, weatherService } from '../services/api';

export default function DashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weather, setWeather] = useState(null);
  const dispatch = useDispatch();
  const policies = useSelector((state) => state.policies.items);
  const claims = useSelector((state) => state.claims.items);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [policiesRes, claimsRes] = await Promise.all([
        policiesService.getMyPolicies().catch(() => ({ data: [] })),
        claimsService.getMyClaims().catch(() => ({ data: [] })),
      ]);

      dispatch(setPolicies(policiesRes.data || []));
      dispatch(setClaims(claimsRes.data || []));

      const zone = user?.zone || 'Mumbai';
      try {
        const weatherRes = await weatherService.getCurrentConditions(zone);
        setWeather(weatherRes.data);
      } catch {
        // Weather data is optional
      }
    } catch (error) {
      console.warn('Dashboard data load error:', error);
      // Don't show error alert - just use empty data
      dispatch(setPolicies([]));
      dispatch(setClaims([]));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  const activePolicies = policies.filter((p) => p.status === 'ACTIVE').length;
  const pendingClaims = claims.filter((c) => c.status === 'PENDING').length;
  const approvedClaims = claims.filter((c) => c.status === 'APPROVED').length;
  const totalPayouts = claims
    .filter((c) => c.status === 'APPROVED')
    .reduce((sum, c) => sum + (c.payout_amount || 0), 0);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hello, {user?.name || 'Worker'}!
        </Text>
        {weather && (
          <View style={styles.weatherCard}>
            <MaterialIcons
              name={weather.is_disrupted ? 'warning' : 'cloud'}
              size={20}
              color={weather.is_disrupted ? '#FF9800' : '#fff'}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.weatherText}>
                {weather.condition} — {weather.temperature?.toFixed(1)}°C
              </Text>
              <Text style={[styles.weatherText, { fontSize: 11, opacity: 0.8 }]}>
                💧 {weather.rain_mm || 0}mm  |  🌬️ AQI {weather.aqi || 0}
              </Text>
            </View>
            {weather.is_disrupted && (
              <View style={styles.disruptionBadge}>
                <Text style={styles.disruptionText}>⚠️</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.statsGrid}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate('PoliciesTab')}
        >
          {/* FIXED HERE */}
          <MaterialIcons name="shield" size={32} color="#1976D2" />
          <Text style={styles.statValue}>{activePolicies}</Text>
          <Text style={styles.statLabel}>Active Policies</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate('ClaimsTab')}
        >
          {/* FIXED HERE */}
          <MaterialIcons name="assignment" size={32} color="#FF9800" />
          <Text style={styles.statValue}>{pendingClaims}</Text>
          <Text style={styles.statLabel}>Pending Claims</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          {/* FIXED HERE */}
          <MaterialIcons name="check-circle" size={32} color="#4CAF50" />
          <Text style={styles.statValue}>{approvedClaims}</Text>
          <Text style={styles.statLabel}>Approved Claims</Text>
        </View>

        <View style={styles.statCard}>
          {/* FIXED HERE */}
          <MaterialIcons name="trending-up" size={32} color="#2196F3" />
          <Text style={styles.statValue}>₹{totalPayouts.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Total Payouts</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Claims</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ClaimsTab')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {claims.length > 0 ? (
          claims.slice(0, 3).map((claim) => (
            <TouchableOpacity
              key={claim.id}
              style={styles.claimCard}
              onPress={() => {
                navigation.navigate('ClaimsTab', {
                  screen: 'ClaimDetail',
                  params: { claimId: claim.id },
                });
              }}
            >
              <View style={styles.claimInfo}>
                <Text style={styles.claimType}>{claim.disruption_type}</Text>
                <Text style={styles.claimAmount}>₹{claim.claimed_amount}</Text>
              </View>
              <View style={[
                styles.claimStatus,
                claim.status === 'APPROVED' && styles.statusApproved,
                claim.status === 'PENDING' && styles.statusPending,
                claim.status === 'REJECTED' && styles.statusRejected,
              ]}>
                <Text style={styles.claimStatusText}>{claim.status}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No claims yet</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => navigation.navigate('ClaimsTab', {
          screen: 'FileClaim',
        })}
      >
        {/* FIXED HERE */}
        <MaterialIcons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#1976D2',
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  weatherCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    width: '100%',
  },
  weatherText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1976D2',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  section: {
    padding: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAll: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '600',
  },
  claimCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  claimInfo: {
    flex: 1,
  },
  claimType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  claimAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginTop: 4,
  },
  claimStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  statusApproved: {
    backgroundColor: '#C8E6C9',
  },
  statusPending: {
    backgroundColor: '#FFE0B2',
  },
  statusRejected: {
    backgroundColor: '#FFCDD2',
  },
  claimStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 20,
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  disruptionBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  disruptionText: {
    fontSize: 16,
  },
});