import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { setSelectedPolicy } from '../store/policiesSlice';
import { policiesService, claimsService } from '../services/api';

export default function PolicyDetailScreen({ route }) {
  const [loading, setLoading] = useState(true);
  const [policyClaims, setPolicyClaims] = useState([]);
  const dispatch = useDispatch();
  const selectedPolicy = useSelector((state) => state.policies.selectedPolicy);

  useEffect(() => {
    loadPolicyDetails();
  }, [route.params?.policyId]);

  const loadPolicyDetails = async () => {
    try {
      const response = await policiesService.getPolicyDetails(route.params?.policyId);
      dispatch(setSelectedPolicy(response.data));

      try {
        const claimsResponse = await claimsService.getClaimHistory(route.params?.policyId);
        setPolicyClaims(claimsResponse.data || []);
      } catch {
        setPolicyClaims([]);
      }
    } catch (error) {
      if (!selectedPolicy) {
        Alert.alert('Error', 'Failed to load policy details');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  if (!selectedPolicy) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Policy not found</Text>
      </View>
    );
  }

  const daysRemaining = Math.ceil(
    (new Date(selectedPolicy.coverage_end) - new Date()) / (1000 * 60 * 60 * 24)
  );

  const approvedAmount = policyClaims
    .filter((c) => c.status === 'APPROVED')
    .reduce((sum, c) => sum + (c.payout_amount || 0), 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="shield" size={40} color="#1976D2" />
        <Text style={styles.policyId}>Policy #{selectedPolicy.id?.slice(0, 8)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Coverage & Premium</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Premium</Text>
          <Text style={styles.value}>₹{selectedPolicy.premium_amount?.toFixed(0) || '0'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Coverage Period</Text>
          <Text style={styles.value}>
            {new Date(selectedPolicy.coverage_start).toLocaleDateString()} -
            {new Date(selectedPolicy.coverage_end).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Days Remaining</Text>
          <Text style={[
            styles.value,
            daysRemaining < 7 && styles.warningText,
          ]}>
            {daysRemaining} days
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Max Weekly Payout</Text>
          <Text style={styles.value}>₹{selectedPolicy.max_payout_per_week?.toFixed(0) || '0'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <View style={[
            styles.statusBadge,
            selectedPolicy.status === 'ACTIVE' && { backgroundColor: '#4CAF50' },
          ]}>
            <Text style={styles.statusText}>{selectedPolicy.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payouts Summary</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Approved Claims</Text>
          <Text style={[styles.value, styles.greenText]}>₹{approvedAmount.toFixed(0)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Total Claims Filed</Text>
          <Text style={styles.value}>{policyClaims.length}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Pending Claims</Text>
          <Text style={[styles.value, styles.orangeText]}>
            {policyClaims.filter((c) => c.status === 'PENDING').length}
          </Text>
        </View>
      </View>

      {policyClaims.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Claims</Text>

          {policyClaims.slice(0, 5).map((claim) => (
            <View key={claim.id} style={styles.claimRow}>
              <View style={styles.claimInfo}>
                <Text style={styles.claimType}>{claim.disruption_type}</Text>
                <Text style={styles.claimDate}>
                  {new Date(claim.triggered_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.claimAmount}>
                <Text style={styles.amount}>₹{claim.claimed_amount?.toFixed(0) || '0'}</Text>
                <Text style={[
                  styles.claimStatus,
                  claim.status === 'APPROVED' && styles.statusApproved,
                  claim.status === 'PENDING' && styles.statusPending,
                  claim.status === 'REJECTED' && styles.statusRejected,
                ]}>
                  {claim.status}
                </Text>
              </View>
            </View>
          ))}
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
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  header: {
    backgroundColor: '#1976D2',
    paddingVertical: 30,
    alignItems: 'center',
  },
  policyId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 10,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  warningText: {
    color: '#FF9800',
  },
  greenText: {
    color: '#4CAF50',
  },
  orangeText: {
    color: '#FF9800',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#ddd',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  claimRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9',
  },
  claimInfo: {
    flex: 1,
  },
  claimType: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  claimDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  claimAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  claimStatus: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusApproved: {
    backgroundColor: '#C8E6C9',
    color: '#2E7D32',
  },
  statusPending: {
    backgroundColor: '#FFE0B2',
    color: '#E65100',
  },
  statusRejected: {
    backgroundColor: '#FFCDD2',
    color: '#B71C1C',
  },
});
