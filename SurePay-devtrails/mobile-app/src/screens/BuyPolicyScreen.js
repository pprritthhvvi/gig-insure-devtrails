import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { workerService, policiesService } from '../services/api';
import { addPolicy } from '../store/policiesSlice';

const PAYOUT_OPTIONS = [1500, 2000, 3000, 5000];
const COVERAGE_WEEKS = [4, 8, 12, 26];

export default function BuyPolicyScreen({ navigation }) {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  const [maxPayout, setMaxPayout] = useState(2000);
  const [weeks, setWeeks] = useState(4);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchQuote();
  }, [maxPayout]);

  const fetchQuote = async () => {
    setQuoteLoading(true);
    try {
      const zone = user?.zone || 'Mumbai';
      const platform = user?.platform || 'Zomato';
      const response = await workerService.getPremiumQuote(zone, platform, maxPayout);
      setQuote(response.data);
    } catch (error) {
      console.warn('Failed to fetch quote:', error.message);
    } finally {
      setQuoteLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!quote) {
      Alert.alert('Error', 'Please wait for the premium quote to load');
      return;
    }

    const workerId = user?.id || user?.worker_id;
    if (!workerId) {
      Alert.alert('Error', 'Worker profile not found. Please re-login.');
      return;
    }

    setPurchasing(true);
    try {
      const now = new Date();
      const coverageStart = now.toISOString().split('T')[0];
      const end = new Date(now);
      end.setDate(end.getDate() + weeks * 7);
      const coverageEnd = end.toISOString().split('T')[0];

      const response = await policiesService.createPolicy({
        worker_id: workerId,
        coverage_start: coverageStart,
        coverage_end: coverageEnd,
        max_payout_per_week: maxPayout,
      });

      dispatch(addPolicy(response.data));

      Alert.alert(
        'Policy Purchased! 🎉',
        `Your GigGuard shield is now active.\n\nPremium: ₹${quote.final_premium}/week\nMax Payout: ₹${maxPayout}/week\nCoverage: ${weeks} weeks`,
        [{ text: 'View Policies', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to purchase policy');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Hero */}
      <View style={styles.hero}>
        <MaterialIcons name="verified-user" size={48} color="#fff" />
        <Text style={styles.heroTitle}>GigGuard Shield</Text>
        <Text style={styles.heroSubtitle}>
          Income protection for weather & platform disruptions
        </Text>
      </View>

      {/* What's Covered */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>What's Covered</Text>
        <View style={styles.coverageGrid}>
          {[
            { icon: 'cloud-queue', label: 'Heavy Rain', amount: '₹1,200' },
            { icon: 'wb-sunny', label: 'Extreme Heat', amount: '₹1,000' },
            { icon: 'cloud', label: 'Severe AQI', amount: '₹1,500' },
            { icon: 'lock-outline', label: 'Curfew', amount: '₹2,000' },
            { icon: 'error', label: 'App Outage', amount: '₹800' },
          ].map((item, idx) => (
            <View key={idx} style={styles.coverageItem}>
              <MaterialIcons name={item.icon} size={22} color="#1976D2" />
              <Text style={styles.coverageLabel}>{item.label}</Text>
              <Text style={styles.coverageAmount}>{item.amount}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Max Payout Selector */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Max Weekly Payout</Text>
        <Text style={styles.hint}>Higher payout = higher premium</Text>
        <View style={styles.optionsRow}>
          {PAYOUT_OPTIONS.map((val) => (
            <TouchableOpacity
              key={val}
              style={[styles.optionButton, maxPayout === val && styles.optionButtonActive]}
              onPress={() => setMaxPayout(val)}
            >
              <Text style={[styles.optionText, maxPayout === val && styles.optionTextActive]}>
                ₹{val.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Coverage Duration */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Coverage Duration</Text>
        <View style={styles.optionsRow}>
          {COVERAGE_WEEKS.map((w) => (
            <TouchableOpacity
              key={w}
              style={[styles.optionButton, weeks === w && styles.optionButtonActive]}
              onPress={() => setWeeks(w)}
            >
              <Text style={[styles.optionText, weeks === w && styles.optionTextActive]}>
                {w} weeks
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Premium Quote */}
      <View style={styles.quoteCard}>
        <Text style={styles.quoteTitle}>Your Premium Quote</Text>

        {quoteLoading ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#1976D2" />
            <Text style={{ color: '#999', fontSize: 12, marginTop: 4 }}>Calculating...</Text>
          </View>
        ) : quote ? (
          <>
            <View style={styles.quoteMain}>
              <Text style={styles.quotePriceLabel}>Weekly Premium</Text>
              <Text style={styles.quotePrice}>₹{quote.final_premium}</Text>
              <Text style={styles.quotePer}>/week</Text>
            </View>

            <View style={styles.quoteDivider} />

            {/* SHAP Explainability Breakdown */}
            <View style={{ marginBottom: 8, marginTop: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 8 }}>
                Why this price?
              </Text>
              {quote.shap_waterfall && quote.shap_waterfall.map((item, idx) => (
                <View key={idx} style={{ marginBottom: 6 }}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{item.feature}</Text>
                    <Text style={[styles.breakdownValue, {
                      color: item.impact > 100 ? '#333' : (item.impact > 0 ? '#F44336' : (item.impact < 0 ? '#4CAF50' : '#888')),
                    }]}>
                      {item.feature === 'Base Premium' 
                        ? `₹${item.impact}` 
                        : (item.impact > 0 ? `+₹${item.impact}` : (item.impact < 0 ? `-₹${Math.abs(item.impact)}` : '₹0'))}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 10, color: '#999', marginTop: -2 }}>
                    {item.description}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.quoteDivider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Total for {weeks} weeks
              </Text>
              <Text style={styles.totalValue}>
                ₹{(quote.final_premium * weeks).toLocaleString()}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="info-outline" size={14} color="#1976D2" />
              <Text style={styles.infoText}>
                {user?.zone || 'Mumbai'} • {user?.platform || 'Zomato'} • Max ₹{maxPayout.toLocaleString()}/week
              </Text>
            </View>
          </>
        ) : (
          <Text style={{ color: '#999', textAlign: 'center', padding: 16 }}>
            Could not load quote. Tap to retry.
          </Text>
        )}
      </View>

      {/* Purchase Button */}
      <TouchableOpacity
        style={[styles.purchaseButton, purchasing && styles.purchaseButtonDisabled]}
        onPress={handlePurchase}
        disabled={purchasing || !quote}
      >
        {purchasing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <MaterialIcons name="verified-user" size={20} color="#fff" />
            <Text style={styles.purchaseText}>
              Activate Shield — ₹{quote ? (quote.final_premium * weeks).toLocaleString() : '...'} for {weeks} weeks
            </Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        By purchasing, you agree to GigGuard Terms of Service. Payouts are subject
        to fraud verification and weather confirmation.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  hero: {
    backgroundColor: '#1976D2', paddingVertical: 28, alignItems: 'center',
    paddingHorizontal: 20,
  },
  heroTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4, textAlign: 'center' },

  card: {
    backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10, borderRadius: 10,
    padding: 14, elevation: 1,
  },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  hint: { fontSize: 11, color: '#999', marginBottom: 8 },

  coverageGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  coverageItem: { width: '48%', backgroundColor: '#F5F7FA', borderRadius: 8, padding: 10, marginBottom: 8, alignItems: 'center' },
  coverageLabel: { fontSize: 11, color: '#555', marginTop: 4 },
  coverageAmount: { fontSize: 13, fontWeight: 'bold', color: '#1976D2', marginTop: 2 },

  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionButton: {
    flex: 1, minWidth: '22%', paddingVertical: 10, paddingHorizontal: 4,
    borderRadius: 8, borderWidth: 2, borderColor: '#e0e0e0',
    alignItems: 'center', backgroundColor: '#fff',
  },
  optionButtonActive: { borderColor: '#1976D2', backgroundColor: '#E3F2FD' },
  optionText: { fontSize: 12, fontWeight: '600', color: '#666' },
  optionTextActive: { color: '#1976D2' },

  quoteCard: {
    backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10, borderRadius: 10,
    padding: 14, elevation: 2, borderWidth: 1, borderColor: '#E3F2FD',
  },
  quoteTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  quoteMain: { alignItems: 'center', paddingVertical: 8 },
  quotePriceLabel: { fontSize: 12, color: '#999' },
  quotePrice: { fontSize: 36, fontWeight: 'bold', color: '#1976D2' },
  quotePer: { fontSize: 12, color: '#999' },
  quoteDivider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 10 },

  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  breakdownLabel: { fontSize: 12, color: '#666', textTransform: 'capitalize' },
  breakdownValue: { fontSize: 12, fontWeight: '600', color: '#333' },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  totalLabel: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#1976D2' },

  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  infoText: { fontSize: 11, color: '#1976D2', marginLeft: 4 },

  purchaseButton: {
    flexDirection: 'row', backgroundColor: '#1976D2', marginHorizontal: 12,
    marginTop: 16, paddingVertical: 15, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', elevation: 3,
  },
  purchaseButtonDisabled: { opacity: 0.6 },
  purchaseText: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginLeft: 8 },

  disclaimer: { fontSize: 10, color: '#999', textAlign: 'center', padding: 12, lineHeight: 16 },
});
