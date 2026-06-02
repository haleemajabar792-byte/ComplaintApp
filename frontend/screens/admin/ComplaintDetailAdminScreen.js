import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://192.168.0.115:5000';

const getComplaintId = (c) => c?._id ?? c?.id ?? c?.ComplaintID;

const STEPS   = ['Pending', 'In Progress', 'Resolved'];
const STEP_COLOR = ['#f59e0b', '#6366f1', '#10b981'];

// ─── Status Stepper ──────────────────────────────────────────────
function StatusStepper({ current }) {
  const currentIdx = STEPS.findIndex(s => s.toLowerCase() === current?.toLowerCase());

  return (
    <View style={styles.stepper}>
      {STEPS.map((step, i) => {
        const done   = i <= currentIdx;
        const active = i === currentIdx;
        const color  = done ? STEP_COLOR[i] : '#374151';

        return (
          <React.Fragment key={step}>
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, { borderColor: color, backgroundColor: done ? color : 'transparent' }]}>
                {done
                  ? <Ionicons name={active ? 'ellipse' : 'checkmark'} size={12} color="#fff" />
                  : <Text style={styles.stepNum}>{i + 1}</Text>
                }
              </View>
              <Text style={[styles.stepLabel, { color: done ? '#ffffff' : '#6b7280' }]}>{step}</Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[styles.stepLine, { backgroundColor: i < currentIdx ? STEP_COLOR[i] : '#1f2937' }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ─── Info row ────────────────────────────────────────────────────
function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={15} color="#6b7280" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>{value || '—'}</Text>
    </View>
  );
}

export default function ComplaintDetailAdminScreen({ route, navigation }) {
  const initial = route.params?.complaint || {};

  const [complaint,  setComplaint]  = useState(initial);
  const [saving,     setSaving]     = useState(false);

  // Status update modal
  const [statusModal,  setStatusModal]  = useState(false);
  const [nextStatus,   setNextStatus]   = useState('');
  const [statusNote,   setStatusNote]   = useState('');

  // Assign modal
  const [assignModal,     setAssignModal]     = useState(false);
  const [departments,     setDepartments]     = useState([]);
  const [selectedDeptId,  setSelectedDeptId]  = useState(complaint.departmentId || null);
  const [assigning,       setAssigning]       = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/departments`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 6000,
        });
        setDepartments(res.data.departments || []);
      } catch (error) {
        console.error('Load departments error:', error.message);
      }
    })();
  }, []);

  const currentIdx = STEPS.findIndex(s => s.toLowerCase() === complaint.status?.toLowerCase());

  // ── Advance status ───────────────────────────────────────────
  const openStatusModal = () => {
    if (currentIdx >= STEPS.length - 1) {
      Alert.alert('Already Resolved', 'This complaint is already resolved.');
      return;
    }
    setNextStatus(STEPS[currentIdx + 1]);
    setStatusNote('');
    setStatusModal(true);
  };

  const confirmStatusUpdate = async () => {
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.patch(
        `${API_URL}/api/admin/complaints/${getComplaintId(complaint)}/status`,
        { status: nextStatus, note: statusNote },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 6000 }
      );
    } catch {
      // Offline: update locally
    } finally {
      setComplaint(prev => ({ ...prev, status: nextStatus }));
      setStatusModal(false);
      setSaving(false);
      Alert.alert('Updated', `Status changed to "${nextStatus}"`);
    }
  };

  // ── Assign department ────────────────────────────────────────
  const confirmAssign = async () => {
    if (!selectedDeptId) return;
    const deptName = departments.find(d => d.DepartmentID === selectedDeptId)?.DepartmentName;
    setAssigning(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.put(
        `${API_URL}/api/admin/complaints/${getComplaintId(complaint)}/assign`,
        { departmentId: selectedDeptId },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 6000 }
      );
      const assignedName = res.data.departmentName || deptName;
      setComplaint(prev => ({
        ...prev,
        department: assignedName,
        departmentId: selectedDeptId,
      }));
      setAssignModal(false);
      Alert.alert('Assigned', `Complaint assigned to ${assignedName}`);
    } catch (error) {
      Alert.alert(
        'Assign failed',
        error.response?.data?.message || 'Could not assign department. Please try again.'
      );
    } finally {
      setAssigning(false);
    }
  };

  const statusColor = STEP_COLOR[Math.max(0, currentIdx)] || '#6b7280';

  // ── Render ───────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#9ca3af" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Complaint Detail</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '18', borderColor: statusColor + '44' }]}>
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusBadgeText, { color: statusColor }]}>{complaint.status || 'Pending'}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{complaint.title || complaint.subject || 'Untitled Complaint'}</Text>

        {/* Stepper */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <StatusStepper current={complaint.status} />
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.infoBox}>
            <InfoRow icon="person-outline"   label="Student"    value={complaint.studentName} />
            <View style={styles.infoDiv} />
            <InfoRow icon="pricetag-outline"  label="Category"   value={complaint.category} />
            <View style={styles.infoDiv} />
            <InfoRow icon="business-outline"  label="Department" value={complaint.department || 'Not assigned'} />
            <View style={styles.infoDiv} />
            <InfoRow icon="calendar-outline"  label="Submitted"  value={complaint.createdAt ? new Date(complaint.createdAt).toDateString() : '—'} />
          </View>
        </View>

        {/* Description */}
        {!!complaint.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.descBox}>
              <Text style={styles.descText}>{complaint.description}</Text>
            </View>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          {/* Advance status */}
          <TouchableOpacity
            style={[styles.btn, currentIdx >= STEPS.length - 1 && styles.btnDisabled]}
            onPress={openStatusModal}
            disabled={currentIdx >= STEPS.length - 1}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-forward-circle-outline" size={18} color="#fff" />
            <Text style={styles.btnText}>
              {currentIdx >= STEPS.length - 1 ? 'Resolved' : `Mark as ${STEPS[currentIdx + 1]}`}
            </Text>
          </TouchableOpacity>

          {/* Assign */}
          <TouchableOpacity
            style={[styles.btn, styles.btnOutline]}
            onPress={() => setAssignModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="git-branch-outline" size={18} color="#f59e0b" />
            <Text style={[styles.btnText, { color: '#f59e0b' }]}>
              {complaint.department ? 'Reassign' : 'Assign Dept'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── Status Update Modal ── */}
      <Modal visible={statusModal} transparent animationType="slide" onRequestClose={() => setStatusModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Update Status</Text>
            <Text style={styles.modalSub}>
              Change status to <Text style={{ color: '#6366f1', fontWeight: '700' }}>{nextStatus}</Text>?
            </Text>

            <Text style={styles.label}>Note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Add a note about this update..."
              placeholderTextColor="#374151"
              value={statusNote}
              onChangeText={setStatusNote}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setStatusModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={confirmStatusUpdate} disabled={saving}>
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalConfirmText}>Confirm</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Assign Department Modal ── */}
      <Modal visible={assignModal} transparent animationType="slide" onRequestClose={() => setAssignModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Assign Department</Text>
            <Text style={styles.modalSub}>Select the department to handle this complaint.</Text>

            <View style={styles.deptList}>
              {departments.map(dept => (
                <TouchableOpacity
                  key={dept.DepartmentID}
                  style={[styles.deptRow, selectedDeptId === dept.DepartmentID && styles.deptRowActive]}
                  onPress={() => setSelectedDeptId(dept.DepartmentID)}
                >
                  <Text style={[styles.deptText, selectedDeptId === dept.DepartmentID && styles.deptTextActive]}>
                    {dept.DepartmentName}
                  </Text>
                  {selectedDeptId === dept.DepartmentID && (
                    <Ionicons name="checkmark-circle" size={18} color="#f59e0b" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setAssignModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, !selectedDeptId && styles.btnDisabled]}
                onPress={confirmAssign}
                disabled={!selectedDeptId || assigning}
              >
                {assigning
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalConfirmText}>Assign</Text>
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
  safe:   { flex: 1, backgroundColor: '#0b0f19' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 8,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#ffffff', textAlign: 'center' },

  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 99,
    paddingHorizontal: 12, paddingVertical: 5, marginTop: 16, marginBottom: 10,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },

  title: { fontSize: 20, fontWeight: '800', color: '#ffffff', lineHeight: 26, marginBottom: 20 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Stepper
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepItem: { alignItems: 'center', gap: 6 },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  stepNum:   { color: '#6b7280', fontSize: 11, fontWeight: '700' },
  stepLabel: { fontSize: 10, fontWeight: '600' },
  stepLine:  { flex: 1, height: 2, marginBottom: 20 },

  // Info box
  infoBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14,
  },
  infoRow:   { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  infoLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500', width: 80 },
  infoValue: { flex: 1, fontSize: 13, color: '#ffffff', fontWeight: '500', textAlign: 'right' },
  infoDiv:   { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },

  descBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 14,
  },
  descText: { color: '#d1d5db', fontSize: 14, lineHeight: 22 },

  // Action buttons
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: '#6366f1', height: 50, borderRadius: 12,
  },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#f59e0b' },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#111827', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 36,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff', marginBottom: 6 },
  modalSub:   { fontSize: 13, color: '#9ca3af', marginBottom: 20 },
  label: { fontSize: 13, color: '#9ca3af', fontWeight: '600', marginBottom: 8 },
  noteInput: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10,
    color: '#ffffff', padding: 12, fontSize: 14,
    textAlignVertical: 'top', minHeight: 80, marginBottom: 20,
  },
  deptList: { gap: 8, marginBottom: 20 },
  deptRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
  },
  deptRowActive:  { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.08)' },
  deptText:       { fontSize: 14, color: '#9ca3af', fontWeight: '500' },
  deptTextActive: { color: '#ffffff', fontWeight: '700' },

  modalBtns:        { flexDirection: 'row', gap: 10 },
  modalCancel: {
    flex: 1, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  modalCancelText:  { color: '#9ca3af', fontWeight: '600' },
  modalConfirm: {
    flex: 1, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#6366f1',
  },
  modalConfirmText: { color: '#ffffff', fontWeight: '700' },
});
