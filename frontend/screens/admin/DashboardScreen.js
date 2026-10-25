import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
  RefreshControl, StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../../config/api';

// ─── StatCard component ──────────────────────────────────────────
function StatCard({ label, value, icon, color, bg }) {
  return (
    <View style={[styles.card, { borderColor: color + '33' }]}>
      <View style={[styles.cardIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.cardValue}>{value ?? '—'}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

// ─── Recent complaint row ────────────────────────────────────────
function RecentRow({ item, onPress }) {
  const statusColor = {
    pending:     '#f59e0b',
    'in progress': '#6366f1',
    resolved:    '#10b981',
  }[item.status?.toLowerCase()] || '#6b7280';

  return (
    <TouchableOpacity style={styles.recentRow} onPress={() => onPress(item)} activeOpacity={0.75}>
      <View style={[styles.recentDot, { backgroundColor: statusColor }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.recentTitle} numberOfLines={1}>{item.title || item.subject || 'Untitled'}</Text>
        <Text style={styles.recentMeta}>{item.category || 'General'} · {item.studentName || 'Student'}</Text>
      </View>
      <Text style={[styles.recentStatus, { color: statusColor }]}>
        {item.status || 'Pending'}
      </Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen({ navigation, onLogout }) {
  const [stats,      setStats]      = useState(null);
  const [recent,     setRecent]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminName,  setAdminName]  = useState('Admin');

  // ── Load admin name from storage ───────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem('name').then(n => n && setAdminName(n));
  }, []);

  // ── Fetch stats ────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, complaintsRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/stats`,      { headers, timeout: 6000 }),
        axios.get(`${API_URL}/api/admin/complaints`, { headers, timeout: 6000,
          params: { limit: 5, sort: 'newest' } }),
      ]);

      const statsPayload = statsRes.data.stats || statsRes.data;
      setStats(statsPayload);
      setRecent(complaintsRes.data.complaints || complaintsRes.data || []);
    } catch (error) {
      console.error('Dashboard fetch error:', error.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: onLogout },
    ]);
  };

  const goToDetail = (item) =>
    navigation.navigate('Complaints', {
      screen: 'ComplaintDetailAdmin',
      params: { complaint: item },
    });

  // ── Render ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.name}>{adminName} 👋</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#f87171" />
          </TouchableOpacity>
        </View>

        {/* ── Admin badge ── */}
        <View style={styles.badge}>
          <Ionicons name="shield-checkmark-outline" size={13} color="#f59e0b" />
          <Text style={styles.badgeText}>Admin Panel</Text>
        </View>

        {/* ── Stat cards ── */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.cardGrid}>
          <StatCard label="Total"       value={stats?.total}      icon="layers-outline"          color="#6366f1" />
          <StatCard label="Pending"     value={stats?.pending}    icon="time-outline"            color="#f59e0b" />
          <StatCard label="In Progress" value={stats?.inProgress} icon="reload-circle-outline"   color="#3b82f6" />
          <StatCard label="Resolved"    value={stats?.resolved}   icon="checkmark-circle-outline" color="#10b981" />
        </View>

        {/* ── Recent complaints ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Complaints</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Complaints')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentBox}>
          {recent.length === 0 ? (
            <Text style={styles.empty}>No complaints yet.</Text>
          ) : (
            recent.map((item, i) => (
              <React.Fragment key={item._id || i}>
                <RecentRow item={item} onPress={goToDetail} />
                {i < recent.length - 1 && <View style={styles.rowDivider} />}
              </React.Fragment>
            ))
          )}
        </View>

        {/* ── Quick actions ── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Complaints')}
          >
            <Ionicons name="list-outline" size={20} color="#6366f1" />
            <Text style={styles.actionText}>All Complaints</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Assign')}
          >
            <Ionicons name="git-branch-outline" size={20} color="#f59e0b" />
            <Text style={styles.actionText}>Assign</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Reports')}
          >
            <Ionicons name="bar-chart-outline" size={20} color="#10b981" />
            <Text style={styles.actionText}>Reports</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#0b0f19' },
  center: { flex: 1, backgroundColor: '#0b0f19', justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginTop: 16, marginBottom: 12,
  },
  greeting: { fontSize: 13, color: '#9ca3af', fontWeight: '500' },
  name:     { fontSize: 22, color: '#ffffff', fontWeight: '800', marginTop: 2 },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(248,113,113,0.10)',
    justifyContent: 'center', alignItems: 'center',
  },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)',
    borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4,
    marginBottom: 24,
  },
  badgeText: { color: '#f59e0b', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff', marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  seeAll: { fontSize: 13, color: '#f59e0b', fontWeight: '600' },

  // 2x2 card grid
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  card: {
    flex: 1, minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderRadius: 14,
    padding: 16, alignItems: 'flex-start', gap: 8,
  },
  cardIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardValue: { fontSize: 26, fontWeight: '800', color: '#ffffff' },
  cardLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },

  // Recent list
  recentBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, overflow: 'hidden', marginBottom: 28,
  },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  recentDot: { width: 8, height: 8, borderRadius: 4 },
  recentTitle: { fontSize: 13, fontWeight: '600', color: '#ffffff' },
  recentMeta:  { fontSize: 11, color: '#6b7280', marginTop: 2 },
  recentStatus:{ fontSize: 11, fontWeight: '600' },
  rowDivider:  { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  empty:       { color: '#6b7280', fontSize: 13, padding: 16, textAlign: 'center' },

  // Quick actions
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', gap: 6,
  },
  actionText: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },
});
