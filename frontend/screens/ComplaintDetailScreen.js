import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const STATUS_MAP = {
  pending:       { color: '#f59e0b', label: 'Pending',     icon: 'time-outline' },
  'in-progress': { color: '#3b82f6', label: 'In Progress', icon: 'hourglass-outline' },
  'in progress': { color: '#3b82f6', label: 'In Progress', icon: 'hourglass-outline' },
  resolved:      { color: '#10b981', label: 'Resolved',    icon: 'checkmark-circle-outline' },
  closed:        { color: '#6b7280', label: 'Closed',      icon: 'lock-closed-outline' },
  rejected:      { color: '#ef4444', label: 'Rejected',    icon: 'close-circle-outline' },
};

const PRIORITY_MAP = {
  low:    { color: '#10b981', label: 'Low' },
  medium: { color: '#3b82f6', label: 'Medium' },
  high:   { color: '#f59e0b', label: 'High' },
  urgent: { color: '#ef4444', label: 'Urgent' },
};

function DetailRow({ icon, label, value }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Ionicons name={icon} size={18} color="#6366f1" style={{ marginRight: 10 }} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function TimelineStep({ title, subtitle, desc, isCompleted, isLast }) {
  return (
    <View style={styles.stepRow}>
      {/* Node + Line */}
      <View style={styles.stepLeft}>
        <View style={[styles.stepNode, isCompleted && styles.stepNodeDone]}>
          {isCompleted && <Ionicons name="checkmark" size={11} color="#fff" />}
        </View>
        {!isLast && <View style={[styles.stepLine, isCompleted && styles.stepLineDone]} />}
      </View>
      {/* Content */}
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, isCompleted && styles.stepTitleDone]}>{title}</Text>
        <Text style={styles.stepSubtitle}>{subtitle}</Text>
        <Text style={styles.stepDesc}>{desc}</Text>
      </View>
    </View>
  );
}

export default function ComplaintDetailScreen({ route, navigation }) {
  const { complaint } = route.params || {};

  if (!complaint) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errText}>No complaint data found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = (complaint.status || 'pending').toLowerCase();
  const priority = (complaint.priority || 'medium').toLowerCase();
  const sc = STATUS_MAP[status] || STATUS_MAP.pending;
  const pc = PRIORITY_MAP[priority] || PRIORITY_MAP.medium;

  const isReviewed = status !== 'pending';
  const isResolved = status === 'resolved' || status === 'closed';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#131929" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Title Section */}
        <Text style={styles.title}>{complaint.title}</Text>
        <Text style={styles.date}>Submitted on {complaint.date || 'N/A'}</Text>

        {/* Status + Priority Badges */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: sc.color + '18', borderColor: sc.color + '40' }]}>
            <Ionicons name={sc.icon} size={13} color={sc.color} style={{ marginRight: 5 }} />
            <Text style={[styles.badgeText, { color: sc.color }]}>{sc.label}</Text>
          </View>
          <View style={[styles.badge, { borderColor: pc.color + '40' }]}>
            <View style={[styles.priorityDot, { backgroundColor: pc.color }]} />
            <Text style={[styles.badgeText, { color: pc.color }]}>{pc.label} Priority</Text>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <DetailRow icon="business-outline" label="Institute" value={complaint.institute || 'General'} />
          <View style={styles.separator} />
          <DetailRow icon="folder-outline" label="Category" value={complaint.category || 'General'} />
          <View style={styles.separator} />
          <DetailRow icon="people-outline" label="Department" value={complaint.department || 'Admin'} />
          <View style={styles.separator} />
          <DetailRow icon="finger-print-outline" label="ID" value={'#' + (complaint.id || 'N/A')} />
        </View>

        {/* Description */}
        <Text style={styles.sectionLabel}>Description</Text>
        <View style={styles.card}>
          <Text style={styles.descText}>{complaint.description || 'No description provided.'}</Text>
        </View>

        {/* Timeline */}
        <Text style={styles.sectionLabel}>Processing Timeline</Text>
        <View style={styles.card}>
          <TimelineStep
            title="Complaint Submitted"
            subtitle={complaint.date || 'Today'}
            desc="Your complaint has been logged in the system."
            isCompleted={true}
            isLast={false}
          />
          <TimelineStep
            title="Under Review"
            subtitle={isReviewed ? 'Assigned' : 'Awaiting'}
            desc="The administration is reviewing and routing your issue."
            isCompleted={isReviewed}
            isLast={false}
          />
          <TimelineStep
            title="Resolution"
            subtitle={isResolved ? 'Completed' : 'Pending'}
            desc="The responsible department resolves and closes the issue."
            isCompleted={isResolved}
            isLast={true}
          />
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 28,
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  priorityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },

  // Card
  card: {
    backgroundColor: '#131929',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 20,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e5e7eb',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  descText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 22,
    fontWeight: '400',
  },

  // Timeline
  stepRow: {
    flexDirection: 'row',
    minHeight: 72,
  },
  stepLeft: {
    alignItems: 'center',
    marginRight: 14,
  },
  stepNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#374151',
    backgroundColor: '#0b0f19',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  stepNodeDone: {
    borderColor: '#6366f1',
    backgroundColor: '#6366f1',
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#1f2937',
    marginTop: -1,
    marginBottom: -1,
  },
  stepLineDone: {
    backgroundColor: '#6366f1',
  },
  stepContent: {
    flex: 1,
    paddingBottom: 18,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4b5563',
  },
  stepTitleDone: {
    color: '#e5e7eb',
  },
  stepSubtitle: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
    marginTop: 2,
  },
  stepDesc: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 4,
    lineHeight: 17,
  },
});
