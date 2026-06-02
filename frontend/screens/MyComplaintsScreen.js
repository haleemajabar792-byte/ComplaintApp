import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = 'http://192.168.0.115:5000';

const STATUS_CONFIG = {
  pending:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',   label: 'Pending' },
  'in-progress': { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'In Progress' },
  'in progress': { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'In Progress' },
  resolved:    { color: '#10b981', bg: 'rgba(16,185,129,0.12)',   label: 'Resolved' },
  rejected:    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',    label: 'Rejected' },
  closed:      { color: '#6b7280', bg: 'rgba(107,114,128,0.12)',  label: 'Closed' },
};

const PRIORITY_CONFIG = {
  low:    { color: '#10b981' },
  medium: { color: '#f59e0b' },
  high:   { color: '#ef4444' },
  urgent: { color: '#991b1b' },
};

const FILTER_TABS = ['all', 'pending', 'in-progress', 'resolved', 'rejected'];

function ComplaintCard({ item, onView, onDelete }) {
  const status = (item.status || 'pending').toLowerCase();
  const priority = (item.priority || 'medium').toLowerCase();
  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const pc = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;

  return (
    <View style={styles.card}>
      {/* Color accent */}
      <View style={[styles.cardAccent, { backgroundColor: sc.color }]} />

      <View style={styles.cardBody}>
        {/* Top row */}
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title || 'Untitled'}</Text>
          <View style={styles.badgesCol}>
            <View style={[styles.badge, { backgroundColor: sc.bg, borderColor: sc.color + '40' }]}>
              <Text style={[styles.badgeText, { color: sc.color }]}>{sc.label}</Text>
            </View>
            <View style={[styles.badge, { borderColor: pc.color + '40', backgroundColor: 'transparent', marginTop: 4 }]}>
              <View style={[styles.priorityDot, { backgroundColor: pc.color }]} />
              <Text style={[styles.badgeText, { color: pc.color }]}>{priority.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description || ''}</Text>

        {/* Meta */}
        <View style={styles.metaRow}>
          <Ionicons name="folder-outline" size={12} color="#4b5563" />
          <Text style={styles.metaText}>{item.category || 'General'}</Text>
          <View style={styles.metaDot} />
          <Ionicons name="calendar-outline" size={12} color="#4b5563" />
          <Text style={styles.metaText}>{item.date || ''}</Text>
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.viewBtn} onPress={() => onView(item)} activeOpacity={0.8}>
            <Ionicons name="eye-outline" size={14} color="#fff" />
            <Text style={styles.viewBtnText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.id)} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={14} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function MyComplaintsScreen({ navigation }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useFocusEffect(
    React.useCallback(() => {
      loadComplaints();
    }, [])
  );

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const studentId = await AsyncStorage.getItem('studentId');
      const raw = await AsyncStorage.getItem('complaints');
      let local = raw ? JSON.parse(raw) : [];
      local = local.filter(c => c.studentId === studentId);
      setComplaints(local);

      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          const res = await axios.get(`${API_URL}/api/complaints/my-complaints`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          });
          const backend = (res.data?.complaints || []).map(bc => ({
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
          }));

          const merged = [...local];
          backend.forEach(bc => {
            const idx = merged.findIndex(lc => lc.id === bc.id || (lc.title === bc.title && lc.description === bc.description));
            if (idx !== -1) merged[idx] = { ...merged[idx], ...bc };
            else merged.push(bc);
          });

          await AsyncStorage.setItem('complaints', JSON.stringify(merged));
          setComplaints(merged);
        } catch (_) {}
      }
    } catch (err) {
      console.error('loadComplaints error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadComplaints();
    setRefreshing(false);
  };

  const handleDelete = async (id) => {
  Alert.alert('Delete Complaint', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          await axios.delete(`${API_URL}/api/complaints/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 6000,
          });
          
          const updated = complaints.filter(c => c.id !== id);
          setComplaints(updated);
          await AsyncStorage.setItem('complaints', JSON.stringify(updated));
        } catch (error) {
          Alert.alert('Error', 'Failed to delete complaint');
        }
      },
    },
  ]);
};

  const filtered = filterStatus === 'all'
    ? complaints
    : complaints.filter(c => {
        const s = (c.status || '').toLowerCase();
        return s === filterStatus || (filterStatus === 'in-progress' && s === 'in progress');
      });

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading complaints...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Complaints</Text>
        <Text style={styles.headerCount}>{filtered.length} case{filtered.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterScroll}>
        {FILTER_TABS.map(tab => {
          const sc = tab === 'all' ? null : STATUS_CONFIG[tab];
          const isActive = filterStatus === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterTab,
                isActive && { backgroundColor: sc?.color || '#6366f1', borderColor: sc?.color || '#6366f1' },
              ]}
              onPress={() => setFilterStatus(tab)}
            >
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {tab === 'all' ? 'All' : tab.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={60} color="#1f2937" />
          <Text style={styles.emptyTitle}>No complaints found</Text>
          <Text style={styles.emptySubtitle}>
            {complaints.length === 0 ? "You haven't submitted any complaints yet." : 'No complaints match this filter.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <ComplaintCard
              item={item}
              onView={(c) => navigation.navigate('ComplaintDetail', { complaint: c })}
              onDelete={handleDelete}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
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
  loadingText: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerCount: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  filterScroll: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexWrap: 'wrap',
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTabTextActive: {
    color: '#ffffff',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#131929',
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardAccent: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#f9fafb',
    marginRight: 10,
    lineHeight: 20,
  },
  badgesCol: {
    alignItems: 'flex-end',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cardDesc: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#4b5563',
    marginLeft: 4,
    fontWeight: '500',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#374151',
    marginHorizontal: 6,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    paddingVertical: 9,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  viewBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: 'rgba(239,68,68,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
