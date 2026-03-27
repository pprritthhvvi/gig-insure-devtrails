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
import { setClaims, setSelectedClaim } from '../store/claimsSlice';
import { claimsService } from '../services/api';

export default function ClaimsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const dispatch = useDispatch();
  const claims = useSelector((state) => state.claims.items);

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    try {
      const response = await claimsService.getMyClaims();
      dispatch(setClaims(response.data || []));
    } catch (error) {
      console.warn('Failed to load claims:', error);
      dispatch(setClaims([]));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClaims();
  };

  const handleClaimPress = (claim) => {
    dispatch(setSelectedClaim(claim));
    navigation.navigate('ClaimDetail', { claimId: claim.id });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return '#4CAF50';
      case 'PENDING':
        return '#FF9800';
      case 'REJECTED':
        return '#F44336';
      default:
        return '#2196F3';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'check-circle';
      case 'PENDING':
        return 'schedule';
      case 'REJECTED':
        return 'cancel';
      default:
        return 'info';
    }
  };

  const filteredClaims = filterStatus === 'ALL'
    ? claims
    : claims.filter((c) => c.status === filterStatus);

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
        <Text style={styles.title}>My Claims</Text>
        <TouchableOpacity
          style={styles.fileClaimButton}
          onPress={() => navigation.navigate('FileClaim')}
        >
          <MaterialIcons name="add" size={20} color="#fff" />
          <Text style={styles.fileClaimText}>File Claim</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              filterStatus === status && styles.filterButtonActive,
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterStatus === status && styles.filterButtonTextActive,
              ]}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredClaims.length > 0 ? (
        filteredClaims.map((claim) => (
          <TouchableOpacity
            key={claim.id}
            style={styles.claimCard}
            onPress={() => handleClaimPress(claim)}
          >
            <View style={styles.claimHeader}>
              <View style={styles.claimTypeBadge}>
                <Text style={styles.claimTypeText}>{claim.disruption_type}</Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(claim.status) },
              ]}>
                <MaterialIcons
                  name={getStatusIcon(claim.status)}
                  size={16}
                  color="#fff"
                />
              </View>
            </View>

            <View style={styles.claimBody}>
              <View style={styles.amountSection}>
                <Text style={styles.amountLabel}>Claimed Amount</Text>
                <Text style={styles.amount}>₹{claim.claimed_amount?.toFixed(0) || '0'}</Text>
              </View>

              {claim.payout_amount > 0 && (
                <View style={styles.amountSection}>
                  <Text style={styles.amountLabel}>Approved Payout</Text>
                  <Text style={[styles.amount, styles.payoutAmount]}>
                    ₹{claim.payout_amount?.toFixed(0) || '0'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.claimFooter}>
              <View style={styles.dateSection}>
                <MaterialIcons name="access-time" size={14} color="#999" />
                <Text style={styles.dateText}>
                  {new Date(claim.triggered_at).toLocaleDateString()}
                </Text>
              </View>
              {claim.payout_status && claim.payout_status !== 'PENDING' && (
                <View style={[styles.payoutBadge, {
                  backgroundColor: claim.payout_status === 'COMPLETED' ? '#E8F5E9' :
                    claim.payout_status === 'PROCESSING' ? '#FFF3E0' : '#FFEBEE',
                }]}>
                  <MaterialIcons
                    name={claim.payout_status === 'COMPLETED' ? 'account-balance-wallet' :
                      claim.payout_status === 'PROCESSING' ? 'hourglass-top' : 'block'}
                    size={12}
                    color={claim.payout_status === 'COMPLETED' ? '#2E7D32' :
                      claim.payout_status === 'PROCESSING' ? '#E65100' : '#C62828'}
                  />
                  <Text style={[styles.payoutBadgeText, {
                    color: claim.payout_status === 'COMPLETED' ? '#2E7D32' :
                      claim.payout_status === 'PROCESSING' ? '#E65100' : '#C62828',
                  }]}>
                    {claim.payout_status}
                  </Text>
                </View>
              )}
              <View style={styles.fraudScore}>
                <Text style={styles.fraudScoreText}>
                  Risk: {claim.fraud_score}%
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="assignment" size={64} color="#ddd" />
          <Text style={styles.emptyText}>No claims found</Text>
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
  header: {
    backgroundColor: '#1976D2',
    padding: 16,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  fileClaimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fileClaimText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  filterContainer: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  filterButton: {
    marginHorizontal: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  claimCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  claimTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
  },
  claimTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  amountSection: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  payoutAmount: {
    color: '#4CAF50',
  },
  claimFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  fraudScore: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  fraudScoreText: {
    fontSize: 11,
    color: '#666',
  },
  payoutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  payoutBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 3,
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
  },
});
