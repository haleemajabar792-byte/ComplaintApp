import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation, onLogout }) {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userInstitute, setUserInstitute] = useState('');
  const [phone, setPhone] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const results = await AsyncStorage.multiGet([
        'name', 'email', 'institute', 'phone', 'complaints',
      ]);

      const nameVal = results[0][1] || '';
      const emailVal = results[1][1] || '';
      const instVal = results[2][1] || '';
      const phoneVal = results[3][1] || '';
      const complaintsRaw = results[4][1];

      setUserName(nameVal);
      setUserEmail(emailVal);
      setUserInstitute(instVal);
      setPhone(phoneVal);

      const complaints = complaintsRaw ? JSON.parse(complaintsRaw) : [];
      setStats({
        total: complaints.length,
        pending: complaints.filter(c => (c.status || '').toLowerCase() === 'pending').length,
        inProgress: complaints.filter(c => {
          const s = (c.status || '').toLowerCase();
          return s === 'in-progress' || s === 'in progress';
        }).length,
        resolved: complaints.filter(c => (c.status || '').toLowerCase() === 'resolved').length,
      });
    } catch (err) {
      console.error('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userName.trim()) {
      Alert.alert('Required', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await AsyncStorage.multiSet([
        ['name', userName.trim()],
        ['phone', phone.trim()],
      ]);
      Alert.alert('Saved!', 'Your profile has been updated.');
      setIsEditing(false);
    } catch (_) {
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(['token', 'studentId', 'name', 'email', 'institute', 'phone']);
            onLogout && onLogout();
          } catch (_) {
            Alert.alert('Error', 'Failed to log out.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    );
  }

  const initials = userName
    ? userName.split(' ').map(w => w.charAt(0).toUpperCase()).slice(0, 2).join('')
    : 'U';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.nameText}>{userName || 'Student'}</Text>
          <Text style={styles.emailText}>{userEmail || 'No email set'}</Text>
          {userInstitute ? (
            <View style={styles.instituteBadge}>
              <Ionicons name="school-outline" size={13} color="#6366f1" />
              <Text style={styles.instituteText}>{userInstitute}</Text>
            </View>
          ) : null}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatItem icon="layers-outline" value={stats.total} label="Total" color="#6366f1" />
          <StatItem icon="time-outline" value={stats.pending} label="Pending" color="#f59e0b" />
          <StatItem icon="hourglass-outline" value={stats.inProgress} label="Active" color="#3b82f6" />
          <StatItem icon="checkmark-circle-outline" value={stats.resolved} label="Resolved" color="#10b981" />
        </View>

        {/* Profile Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editBtn}>
                <Ionicons name="create-outline" size={16} color="#6366f1" />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <ProfileField
            icon="person-outline"
            label="Full Name"
            value={userName}
            onChangeText={setUserName}
            editable={isEditing}
          />
          <ProfileField
            icon="mail-outline"
            label="Email"
            value={userEmail}
            editable={false}
            hint="Email cannot be changed"
          />
          <ProfileField
            icon="call-outline"
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            editable={isEditing}
            keyboardType="phone-pad"
            placeholder="Add phone number"
          />
          <ProfileField
            icon="business-outline"
            label="Institute"
            value={userInstitute}
            editable={false}
          />

          {isEditing && (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.saveBtn, saving && styles.btnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <Text style={styles.actionBtnText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.cancelBtn]}
                onPress={() => { setIsEditing(false); loadData(); }}
              >
                <Ionicons name="close" size={16} color="#9ca3af" />
                <Text style={[styles.actionBtnText, { color: '#9ca3af' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Preferences Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preferences</Text>

          <View style={styles.prefRow}>
            <View style={styles.prefLeft}>
              <Ionicons name="notifications-outline" size={18} color="#6366f1" style={styles.prefIcon} />
              <View>
                <Text style={styles.prefLabel}>Push Notifications</Text>
                <Text style={styles.prefSub}>Get updates about your complaints</Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#1f2937', true: 'rgba(99,102,241,0.4)' }}
              thumbColor={notifications ? '#6366f1' : '#4b5563'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.prefRow}>
            <View style={styles.prefLeft}>
              <Ionicons name="mail-outline" size={18} color="#6366f1" style={styles.prefIcon} />
              <View>
                <Text style={styles.prefLabel}>Email Updates</Text>
                <Text style={styles.prefSub}>Receive email about changes</Text>
              </View>
            </View>
            <Switch
              value={emailUpdates}
              onValueChange={setEmailUpdates}
              trackColor={{ false: '#1f2937', true: 'rgba(99,102,241,0.4)' }}
              thumbColor={emailUpdates ? '#6366f1' : '#4b5563'}
            />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.82}>
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>InstiSolve v1.0.0</Text>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ icon, value, label, color }) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ProfileField({ icon, label, value, onChangeText, editable, keyboardType, placeholder, hint }) {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldLabel}>
        <Ionicons name={icon} size={16} color="#4b5563" style={{ marginRight: 8 }} />
        <Text style={styles.fieldLabelText}>{label}</Text>
      </View>
      {editable ? (
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || label}
          placeholderTextColor="#374151"
          keyboardType={keyboardType || 'default'}
          autoCapitalize="words"
        />
      ) : (
        <Text style={styles.fieldValue}>{value || '—'}</Text>
      )}
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
  },
  avatarRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  nameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 10,
  },
  instituteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99,102,241,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
  },
  instituteText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
    marginLeft: 5,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    marginHorizontal: -4,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#131929',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
    marginTop: 2,
  },

  // Card
  card: {
    backgroundColor: '#131929',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f3f4f6',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99,102,241,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editBtnText: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Profile Field
  fieldContainer: {
    marginBottom: 14,
  },
  fieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  fieldInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    color: '#ffffff',
    fontSize: 14,
  },
  fieldValue: {
    fontSize: 14,
    color: '#e5e7eb',
    fontWeight: '500',
    paddingVertical: 4,
  },
  fieldHint: {
    fontSize: 11,
    color: '#374151',
    marginTop: 3,
    fontStyle: 'italic',
  },

  // Edit Actions
  editActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  saveBtn: {
    backgroundColor: '#6366f1',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  btnDisabled: { opacity: 0.6 },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },

  // Preferences
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  prefLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  prefIcon: {
    marginRight: 12,
  },
  prefLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 2,
  },
  prefSub: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    color: '#1f2937',
    fontSize: 12,
    fontWeight: '500',
  },
});
