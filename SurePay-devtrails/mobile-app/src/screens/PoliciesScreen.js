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
import { setPolicies, setSelectedPolicy } from '../store/policiesSlice';
import { policiesService } from '../services/api';

export default function PoliciesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useDispatch();
  const policies = useSelector((state) => state.policies.items);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      const response = await policiesService.getMyPolicies();
      dispatch(setPolicies(response.data || []));
    } catch (error) {
      console.warn('Failed to load policies:', error);
      dispatch(setPolicies([]));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPolicies();
  };

  const handlePolicyPress = (policy) => {
    dispatch(setSelectedPolicy(policy));
    navigation.navigate('PolicyDetail', { policyId: policy.id });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return '#4CAF50';
      case 'INACTIVE':
        return '#999';
      case 'EXPIRED':
        return '#F44336';
      default:
        return '#2196F3';
    }
  };

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
      <Text style={styles.title}>My Insurance Policies</Text>

      {/* Buy Policy Button */}
      <TouchableOpacity
        style={styles.buyBanner}
        onPress={() => navigation.navigate('BuyPolicy')}
      >
        <MaterialIcons name="add-circle" size={22} color="#fff" />
        <Text style={styles.buyBannerText}>Get Protected — Buy New Policy</Text>
        <MaterialIcons name="arrow-forward" size={18} color="rgba(255,255,255,0.8)" />
      </TouchableOpacity>

      {policies.length > 0 ? (
        policies.map((policy) => (
          <TouchableOpacity
            key={policy.id}
            style={styles.policyCard}
            onPress={() => handlePolicyPress(policy)}
          >
            <View style={styles.policyHeader}>
              <View>
                <Text style={styles.policyId}>Policy #{policy.id.slice(0, 8)}</Text>
                <Text style={styles.policyPremium}>
                  ₹{policy.premium_amount?.toFixed(0) || '0'}/week
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(policy.status) },
                ]}
              >
                <Text style={styles.statusText}>{policy.status}</Text>
              </View>
            </View>

            <View style={styles.policyDetails}>
              <View style={styles.detailRow}>
                <MaterialIcons name="calendar-today" size={16} color="#666" />
                <Text style={styles.detailText}>
                  {new Date(policy.coverage_start).toLocaleDateString()} -{' '}
                  {new Date(policy.coverage_end).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <MaterialIcons name="trending-up" size={16} color="#666" />
                <Text style={styles.detailText}>
                  Max payout: ₹{policy.max_payout_per_week?.toFixed(0) || '0'}/week
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => handlePolicyPress(policy)}
            >
              <Text style={styles.viewButtonText}>View Details</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#1976D2" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="shield" size={64} color="#ddd" />
          <Text style={styles.emptyText}>No active policies yet</Text>
          <TouchableOpacity style={styles.buyButton} onPress={() => navigation.navigate('BuyPolicy')}>
            <Text style={styles.buyButtonText}>Buy Policy</Text>
          </TouchableOpacity>
        </View>
      )}
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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    padding: 16,
    paddingBottom: 12,
  },
  policyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  policyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  policyId: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  policyPremium: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  policyDetails: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    paddingVertical: 12,
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 13,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  viewButtonText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
  },
  buyButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  buyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976D2',
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 14,
    borderRadius: 10,
    elevation: 2,
  },
  buyBannerText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
