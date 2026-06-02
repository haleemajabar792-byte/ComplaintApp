import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://192.168.0.115:5000';

const STAT_CONFIG = [
  { key: 'total',      label: 'Total',       icon: 'layers-outline',       color: '#6366f1', bg: 'rgba(99,102,241,0.12)'  },
  { key: 'pending',    label: 'Pending',     icon: 'time-outline',          color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { key: 'inProgress', label: 'In Progress', icon: 'hourglass-outline',    color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { key: 'resolved',   label: 'Resolved',    icon: 'checkmark-circle-outline', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
];

function StatCard({ label, value, icon, color, bg }) {
  return (
    <View style={[styles.statCard, { borderColor: color + '33' }]}>
      <View style={[styles.statIconBg, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statNumber, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('Student');
  const [institute, setInstitute] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  const computeStats = (list) => ({
    total: list.length,
    pending: list.filter(c => (c.status || '').toLowerCase() === 'pending').length,
    inProgress: list.filter(c => {
      const s = (c.status || '').toLowerCase();
      return s === 'in progress' || s === 'in-progress';
    }).length,
    resolved: list.filter(c => (c.status || '').toLowerCase() === 'resolved').length,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userName, userInstitute, stored, token] = await AsyncStorage.multiGet([
        'name', 'institute', 'complaints', 'token',
      ]);

      if (userName[1]) setName(userName[1]);
      if (userInstitute[1]) setInstitute(userInstitute[1]);

      let localList = stored[1] ? JSON.parse(stored[1]) : [];
      setStats(computeStats(localList));

      if (token[1]) {
        try {
          const res = await axios.get(`${API_URL}/api/complaints/my-complaints`, {
            headers: { Authorization: `Bearer ${token[1]}` },
            timeout: 5000,
          });
          const backend = res.data.complaints || [];
          if (Array.isArray(backend) && backend.length > 0) {
            const merged = [...localList];
            backend.forEach(bc => {
              const mapped = {
                id: (bc.id || bc.ComplaintID || bc._id || Date.now()).toString(),
                title: bc.Title || bc.title || '',
                description: bc.Description || bc.description || '',
                category: bc.CategoryName || bc.category || 'General',
                department: bc.DepartmentName || bc.department || 'Admin',
                institute: bc.Institute || bc.institute || '',
                status: (bc.Status || bc.status || 'pending').toLowerCase(),
                priority: (bc.Priority || bc.priority || 'medium').toLowerCase(),
                date: bc.CreatedAt
                  ? new Date(bc.CreatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                  : bc.date || new Date().toLocaleDateString(),
              };
              const idx = merged.findIndex(lc => lc.id === mapped.id || (lc.title === mapped.title && lc.description === mapped.description));
              if (idx !== -1) merged[idx] = { ...merged[idx], ...mapped };
              else merged.push(mapped);
            });
            await AsyncStorage.setItem('complaints', JSON.stringify(merged));
            setStats(computeStats(merged));
          }
        } catch (_) {}
      }
    } catch (err) {
      console.error('HomeScreen fetchData error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = name.split(' ')[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerArea}>
          <View>
            <Text style={styles.greeting}>{greeting}, {firstName}! 👋</Text>
            {institute ? <Text style={styles.instituteName}>{institute}</Text> : null}
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{firstName.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionLabel}>Your Complaints Overview</Text>
        <View style={styles.statsGrid}>
          {STAT_CONFIG.map(cfg => (
            <StatCard key={cfg.key} label={cfg.label} value={stats[cfg.key]} icon={cfg.icon} color={cfg.color} bg={cfg.bg} />
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionLabel}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Submit')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(99,102,241,0.15)' }]}>
              <Ionicons name="add-circle-outline" size={24} color="#6366f1" />
            </View>
            <Text style={styles.actionLabel}>New Complaint</Text>
            <Text style={styles.actionSub}>Submit an issue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('MyComplaints')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
              <Ionicons name="document-text-outline" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.actionLabel}>My Complaints</Text>
            <Text style={styles.actionSub}>Track your cases</Text>
          </TouchableOpacity>
        </View>

        {/* Info Banner */}
        <View style={styles.banner}>
          <Ionicons name="information-circle" size={20} color="#6366f1" />
          <Text style={styles.bannerText}>
            Submit categorized complaints directly to your institution's departments for swift resolution.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  headerArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  instituteName: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '500',
    marginTop: 3,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 28,
    marginHorizontal: -5,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#131929',
    borderRadius: 16,
    padding: 16,
    margin: '1%',
    borderWidth: 1,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  statIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    marginBottom: 24,
    marginHorizontal: -5,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#131929',
    borderRadius: 16,
    padding: 18,
    margin: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 3,
  },
  actionSub: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(99,102,241,0.08)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
    alignItems: 'flex-start',
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    color: '#9ca3af',
    marginLeft: 10,
    lineHeight: 19,
    fontWeight: '500',
  },
});
