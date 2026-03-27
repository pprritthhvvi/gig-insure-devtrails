import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import * as SecureStore from 'expo-secure-store';
import { MaterialIcons } from '@expo/vector-icons';
import { logout } from '../store/authSlice';

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await SecureStore.deleteItemAsync('authToken');
            dispatch(logout());
          } catch (error) {
            Alert.alert('Error', 'Failed to logout');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={60} color="#1976D2" />
        </View>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Platform Information</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="store" size={20} color="#1976D2" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Delivery Platform</Text>
              <Text style={styles.infoValue}>{user?.platform || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color="#1976D2" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Operating Zone</Text>
              <Text style={styles.infoValue}>{user?.zone || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="trending-up" size={20} color="#1976D2" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Risk Score</Text>
              <Text style={styles.infoValue}>{user?.risk_score || 0}%</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Account Status</Text>
              <Text style={styles.infoValue}>{user?.status || 'ACTIVE'}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings & Help</Text>

        <TouchableOpacity style={styles.settingRow}>
          <View style={styles.settingIcon}>
            <MaterialIcons name="notifications" size={20} color="#1976D2" />
          </View>
          <Text style={styles.settingText}>Notifications</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow}>
          <View style={styles.settingIcon}>
            <MaterialIcons name="security" size={20} color="#1976D2" />
          </View>
          <Text style={styles.settingText}>Privacy & Security</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow}>
          <View style={styles.settingIcon}>
            <MaterialIcons name="help" size={20} color="#1976D2" />
          </View>
          <Text style={styles.settingText}>Help & Support</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow}>
          <View style={styles.settingIcon}>
            <MaterialIcons name="info" size={20} color="#1976D2" />
          </View>
          <Text style={styles.settingText}>About GigGuard</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <MaterialIcons name="logout" size={20} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    backgroundColor: '#1976D2',
    paddingVertical: 30,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoContent: {
    flex: 1,
    marginLeft: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  settingRow: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#F44336',
    marginHorizontal: 12,
    marginVertical: 20,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
