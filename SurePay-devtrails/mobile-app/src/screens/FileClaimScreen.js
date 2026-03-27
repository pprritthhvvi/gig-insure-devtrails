import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { addClaim } from '../store/claimsSlice';
import { claimsService, policiesService } from '../services/api';

// Preset payout amounts per disruption type (INR)
const DISRUPTION_PAYOUTS = {
  RAIN:      { amount: 1200, hours: 4, label: '~4 hrs lost income' },
  HEAT:      { amount: 1000, hours: 3, label: '~3 hrs lost income' },
  AQI:       { amount: 1500, hours: 5, label: '~5 hrs lost income' },
  CURFEW:    { amount: 2000, hours: 8, label: 'Full day lost income' },
  APP_CRASH: { amount: 800,  hours: 2, label: '~2 hrs lost income' },
};

export default function FileClaimScreen({ navigation }) {
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [disruptionType, setDisruptionType] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policies, setPolicies] = useState([]);

  const dispatch = useDispatch();

  const disruptionTypes = [
    { id: 'RAIN',      label: 'Heavy Rain',        icon: 'cloud-queue',   desc: 'Rainfall >20mm/hr blocking deliveries' },
    { id: 'HEAT',      label: 'Extreme Heat',       icon: 'wb-sunny',      desc: 'Temperature >42°C, unsafe outdoors' },
    { id: 'AQI',       label: 'Severe Pollution',    icon: 'cloud',         desc: 'AQI >300, hazardous air quality' },
    { id: 'CURFEW',    label: 'Curfew / Strike',     icon: 'lock-outline',  desc: 'Government-ordered shutdown' },
    { id: 'APP_CRASH', label: 'Platform Outage',     icon: 'error',         desc: 'Delivery app unreachable >30 min' },
  ];

  React.useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      const response = await policiesService.getMyPolicies();
      const activePolicies = (response.data || []).filter(p => p.status === 'ACTIVE');
      setPolicies(activePolicies);
    } catch (error) {
      console.warn('Failed to load policies:', error);
      setPolicies([]);
    }
  };

  const getPresetAmount = () => {
    if (!disruptionType) return 0;
    const preset = DISRUPTION_PAYOUTS[disruptionType];
    if (!preset) return 1000;
    // Cap to policy max if available
    const maxPayout = selectedPolicy?.max_payout_per_week || 5000;
    return Math.min(preset.amount, maxPayout);
  };

  const validateForm = () => {
    if (!selectedPolicy) {
      Alert.alert('Error', 'Please select a policy');
      return false;
    }
    if (!disruptionType) {
      Alert.alert('Error', 'Please select a disruption type');
      return false;
    }
    return true;
  };

  const handleFileClaim = async () => {
    if (!validateForm()) return;

    const amount = getPresetAmount();

    setLoading(true);
    try {
      const response = await claimsService.fileClaim({
        policy_id: selectedPolicy.id,
        disruption_type: disruptionType,
        claimed_amount: amount,
        description,
      });

      dispatch(addClaim(response.data));

      const statusMsg = response.data.status === 'APPROVED'
        ? `Claim approved! ₹${response.data.payout_amount?.toFixed(0) || amount} will be credited soon.`
        : response.data.status === 'PENDING'
        ? 'Claim filed and is under review.'
        : 'Claim filed. Our system will evaluate it shortly.';

      Alert.alert('Claim Filed ✅', statusMsg, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to file claim');
    } finally {
      setLoading(false);
    }
  };

  const presetAmount = getPresetAmount();
  const selectedPreset = disruptionType ? DISRUPTION_PAYOUTS[disruptionType] : null;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>File a New Claim</Text>
      <Text style={styles.subtitle}>
        Claim income loss from weather or platform disruptions
      </Text>

      {/* Policy Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Policy *</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowPolicyModal(true)}
        >
          <View style={styles.selectContent}>
            <MaterialIcons name="description" size={20} color="#1976D2" />
            <Text style={styles.selectText}>
              {selectedPolicy
                ? `Policy #${selectedPolicy.id.slice(0, 8)}`
                : 'Tap to select policy'}
            </Text>
          </View>
          <MaterialIcons name="arrow-drop-down" size={24} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Disruption Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Disruption Type *</Text>

        {disruptionTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeButton,
              disruptionType === type.id && styles.typeButtonSelected,
            ]}
            onPress={() => setDisruptionType(type.id)}
          >
            <MaterialIcons
              name={type.icon}
              size={24}
              color={disruptionType === type.id ? '#1976D2' : '#999'}
            />
            <View style={styles.typeInfo}>
              <Text
                style={[
                  styles.typeButtonText,
                  disruptionType === type.id && styles.typeButtonTextSelected,
                ]}
              >
                {type.label}
              </Text>
              <Text style={styles.typeDesc}>{type.desc}</Text>
            </View>
            <Text style={[
              styles.typeAmount,
              disruptionType === type.id && styles.typeAmountSelected,
            ]}>
              ₹{DISRUPTION_PAYOUTS[type.id]?.amount || 0}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Preset Amount Display (read-only) */}
      {disruptionType && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Claim Amount</Text>
          <View style={styles.amountCard}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Payout Amount</Text>
              <Text style={styles.amountValue}>₹{presetAmount.toLocaleString()}</Text>
            </View>
            {selectedPreset && (
              <>
                <View style={styles.amountDivider} />
                <View style={styles.amountRow}>
                  <Text style={styles.amountDetailLabel}>Estimated lost hours</Text>
                  <Text style={styles.amountDetailValue}>{selectedPreset.hours} hrs</Text>
                </View>
                <View style={styles.amountRow}>
                  <Text style={styles.amountDetailLabel}>Calculation basis</Text>
                  <Text style={styles.amountDetailValue}>{selectedPreset.label}</Text>
                </View>
                {selectedPolicy && (
                  <View style={styles.amountRow}>
                    <Text style={styles.amountDetailLabel}>Policy max/week</Text>
                    <Text style={styles.amountDetailValue}>
                      ₹{selectedPolicy.max_payout_per_week?.toFixed(0) || '5000'}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
          <View style={styles.infoBox}>
            <MaterialIcons name="info" size={16} color="#1976D2" />
            <Text style={styles.infoText}>
              Amount is determined by disruption type. You cannot set a custom amount.
            </Text>
          </View>
        </View>
      )}

      {/* Description (Optional) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Details (Optional)</Text>
        <TextInput
          style={styles.descriptionInput}
          placeholder="Describe the situation..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          editable={!loading}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleFileClaim}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <MaterialIcons name="check" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>
              File Claim{presetAmount > 0 ? ` — ₹${presetAmount.toLocaleString()}` : ''}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Policy Selection Modal */}
      <Modal
        visible={showPolicyModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Policy</Text>
              <TouchableOpacity onPress={() => setShowPolicyModal(false)}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {policies.length > 0 ? (
                policies.map((policy) => (
                  <TouchableOpacity
                    key={policy.id}
                    style={styles.modalOption}
                    onPress={() => {
                      setSelectedPolicy(policy);
                      setShowPolicyModal(false);
                    }}
                  >
                    <View>
                      <Text style={styles.modalOptionText}>
                        Policy #{policy.id.slice(0, 8)}
                      </Text>
                      <Text style={styles.modalOptionSubtext}>
                        ₹{policy.premium_amount?.toFixed(0) || '0'}/week • Max ₹{policy.max_payout_per_week?.toFixed(0) || '0'}
                      </Text>
                    </View>
                    {selectedPolicy?.id === policy.id && (
                      <MaterialIcons name="check" size={20} color="#1976D2" />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noDataText}>No active policies available</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  section: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    elevation: 1,
  },
  selectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  typeButtonSelected: {
    borderColor: '#1976D2',
    backgroundColor: '#E3F2FD',
  },
  typeInfo: {
    flex: 1,
    marginLeft: 10,
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  typeButtonTextSelected: {
    color: '#1976D2',
  },
  typeDesc: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  typeAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
  },
  typeAmountSelected: {
    color: '#1976D2',
  },
  amountCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  amountLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  amountValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  amountDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  amountDetailLabel: {
    fontSize: 12,
    color: '#888',
  },
  amountDetailValue: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
    flex: 1,
  },
  descriptionInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#1976D2',
    marginHorizontal: 12,
    marginVertical: 20,
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9',
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  modalOptionSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 20,
  },
});
