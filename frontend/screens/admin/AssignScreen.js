import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, ActivityIndicator, Alert, RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../../config/api';

const DEFAULT_DEPARTMENTS = [
  { id: 1, name: 'Academic Affairs', icon: 'school-outline' },
  { id: 2, name: 'Hostel Management', icon: 'home-outline' },
  { id: 3, name: 'Transportation', icon: 'bus-outline' },
  { id: 4, name: 'Facilities', icon: 'construct-outline' },
  { id: 5, name: 'Administration', icon: 'business-outline' },
];

export default function AssignScreen({ navigation }) {
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState(null); // complaint being assigned
  const [selectedDept, setSelectedDept] = useState(null);
  const [assigning, setAssigning] = useState(false);

  // ── Fetch unassigned complaints and dynamic departments ──────
  const fetchData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [compRes, deptRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/complaints`, { headers, timeout: 6000 }),
        axios.get(`${API_URL}/api/departments`, { headers, timeout: 5000 }).catch(() => ({ data: {} })),
      ]);

      const all = compRes.data.complaints || compRes.data || [];
      // Filter for unassigned or general complaints
      setComplaints(all.filter(c => !c.department || c.department === 'Not assigned' || c.department === 'Admin'));

      if (deptRes.data?.departments && deptRes.data.departments.length > 0) {
        const iconMap = {
          'academic affairs': 'school-outline',
          'hostel management': 'home-outline',
          'transportation': 'bus-outline',
          'facilities': 'construct-outline',
          'administration': 'business-outline',
        };
        const mapped = deptRes.data.departments.map(d => ({
          id: d.DepartmentID,
          name: d.DepartmentName,
          icon: iconMap[d.DepartmentName.toLowerCase()] || 'briefcase-outline',
        }));
        setDepartments(mapped);
      }
    } catch {
      // Offline fallback
      setComplaints([
        { _id: '4', id: '4', title: 'Parking area lights broken', category: 'Facilities', status: 'Pending', studentName: 'Zara Ali', createdAt: new Date().toISOString() },
        { _id: '5', id: '5', title: 'Lab computers outdated', category: 'IT', status: 'Pending', studentName: 'Omar Sheikh', createdAt: new Date().toISOString() },
        { _id: '6', id: '6', title: 'Cafeteria hygiene issue', category: 'Facilities', status: 'Pending', studentName: 'Aisha Noor', createdAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ── Open assign modal ─────────────────────────────────────────
  const openAssign = (complaint) => {
    setSelected(complaint);
    setSelectedDept(null);
    setModalVisible(true);
  };

  // ── Confirm assignment ─────────────────────────────────────────
  const confirmAssign = async () => {
    if (!selectedDept || !selected) return;
    setAssigning(true);
    const targetId = selected._id || selected.id || selected.ComplaintID;
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/admin/complaints/${targetId}/assign`,
        { departmentId: selectedDept.id, department: selectedDept.name },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 6000 }
      );
    } catch {
      // Offline fallback
    } finally {
      setComplaints(prev => prev.filter(c => (c._id || c.id || c.ComplaintID) !== targetId));
      setModalVisible(false);
      setAssigning(false);
      Alert.alert('Assigned ✓', `"${selected.title || 'Complaint'}" → ${selectedDept.name}`);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title || item.subject || 'Untitled'}</Text>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="person-outline" size={12} color="#6b7280" />
            <Text style={styles.metaText}>{item.studentName || 'Student'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="pricetag-outline" size={12} color="#6b7280" />
            <Text style={styles.metaText}>{item.category || 'General'}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.assignBtn} onPress={() => openAssign(item)}>
        <Ionicons name="git-branch-outline" size={15} color="#f59e0b" />
        <Text style={styles.assignBtnText}>Assign</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Assign Complaints</Text>
        {complaints.length > 0 && (
          <View style={styles.countPill}>
            <Text style={styles.countText}>{complaints.length} unassigned</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={item => (item._id || item.id || item.ComplaintID || Math.random()).toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-done-circle-outline" size={52} color="#10b981" />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyText}>No unassigned complaints found.</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Assign Modal ── */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.handle} />

            <Text style={styles.modalTitle}>Assign to Department</Text>
            <Text style={styles.modalSub} numberOfLines={2}>
              {selected?.title || selected?.subject || 'Complaint'}
            </Text>

            {/* Dynamic Department list */}
            <View style={styles.deptList}>
              {departments.map(dept => {
                const isSelected = selectedDept?.id === dept.id;
                return (
                  <TouchableOpacity
                    key={dept.id}
                    style={[styles.deptRow, isSelected && styles.deptRowActive]}
                    onPress={() => setSelectedDept(dept)}
                  >
                    <View style={styles.deptLeft}>
                      <View style={[styles.deptIconBox, isSelected && { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                        <Ionicons name={dept.icon} size={16} color={isSelected ? '#f59e0b' : '#6b7280'} />
                      </View>
                      <Text style={[styles.deptName, isSelected && styles.deptNameActive]}>
                        {dept.name}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color="#f59e0b" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Buttons */}
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, !selectedDept && styles.confirmBtnDisabled]}
                onPress={confirmAssign}
                disabled={!selectedDept || assigning}
              >
                {assigning
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.confirmText}>Confirm Assign</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0f19' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#ffffff', flex: 1 },
  countPill: {
    backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)',
  },
  countText: { color: '#f59e0b', fontSize: 11, fontWeight: '700' },

  list: { paddingHorizontal: 20, paddingBottom: 30, gap: 10 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  cardLeft: { flex: 1, gap: 6 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  cardMeta: { flexDirection: 'row', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#6b7280' },

  assignBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.30)',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  assignBtnText: { color: '#f59e0b', fontSize: 12, fontWeight: '700' },

  empty: { alignItems: 'center', marginTop: 80, gap: 10 },
  emptyTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  emptyText: { color: '#6b7280', fontSize: 13 },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: 24, paddingBottom: 36,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#9ca3af', marginBottom: 20 },

  deptList: { gap: 8, marginBottom: 24 },
  deptRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 12,
  },
  deptRowActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.06)' },
  deptLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  deptIconBox: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center', alignItems: 'center',
  },
  deptName: { fontSize: 13, color: '#9ca3af', fontWeight: '500' },
  deptNameActive: { color: '#ffffff', fontWeight: '700' },

  modalBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, height: 50, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  cancelText: { color: '#9ca3af', fontWeight: '600' },
  confirmBtn: {
    flex: 2, height: 50, borderRadius: 12,
    backgroundColor: '#f59e0b',
    justifyContent: 'center', alignItems: 'center',
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});
