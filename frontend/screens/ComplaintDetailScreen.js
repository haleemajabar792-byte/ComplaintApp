import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config/api';

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
      <View style={styles.stepLeft}>
        <View style={[styles.stepNode, isCompleted && styles.stepNodeDone]}>
          {isCompleted && <Ionicons name="checkmark" size={11} color="#fff" />}
        </View>
        {!isLast && <View style={[styles.stepLine, isCompleted && styles.stepLineDone]} />}
      </View>
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

  const [feedback, setFeedback] = useState(null);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const complaintId = complaint?.id || complaint?.ComplaintID || complaint?._id;

  useEffect(() => {
    if (complaintId) {
      fetchFeedback();
    }
  }, [complaintId]);

  const fetchFeedback = async () => {
    try {
      setLoadingFeedback(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const res = await axios.get(`${API_URL}/api/feedback/complaint/${complaintId}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });

      if (res.data?.feedback) {
        setFeedback(res.data.feedback);
        setRating(res.data.feedback.Rating || 5);
        setComments(res.data.feedback.Comments || '');
      }
    } catch (_) {
      // Feedback might not exist yet
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!complaintId) return;

    setSubmittingFeedback(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/api/feedback`,
        {
          complaintId: parseInt(complaintId),
          rating,
          comments,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 6000,
        }
      );

      if (res.data?.success) {
        setFeedback(res.data.feedback || { Rating: rating, Comments: comments });
        Alert.alert('⭐ Thank You!', 'Your feedback has been submitted successfully.');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

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
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />

      {/* Header bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBackBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>Complaint Details</Text>
        <View style={{ width: 40 }} />
      </View>

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
          <DetailRow icon="people-outline" label="Department" value={complaint.department || 'Awaiting Assignment'} />
          <View style={styles.separator} />
          <DetailRow icon="finger-print-outline" label="Complaint ID" value={'#' + (complaint.id || 'N/A')} />
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
            title="Under Review & Routing"
            subtitle={isReviewed ? (complaint.department || 'Assigned to Department') : 'Awaiting Administration'}
            desc="The administration reviews and assigns your issue."
            isCompleted={isReviewed}
            isLast={false}
          />
          <TimelineStep
            title="Resolution"
            subtitle={isResolved ? 'Resolved' : 'In Progress'}
            desc="The department resolves the issue."
            isCompleted={isResolved}
            isLast={true}
          />
        </View>

        {/* ⭐ FEEDBACK SECTION (Visible when resolved or closed) */}
        {isResolved && (
          <>
            <Text style={styles.sectionLabel}>Resolution Feedback</Text>
            <View style={[styles.card, styles.feedbackCard]}>
              <View style={styles.feedbackHeader}>
                <Ionicons name="star" size={20} color="#f59e0b" />
                <Text style={styles.feedbackTitle}>
                  {feedback ? 'Your Rating & Feedback' : 'Rate Your Resolution'}
                </Text>
              </View>

              {loadingFeedback ? (
                <ActivityIndicator size="small" color="#6366f1" style={{ marginVertical: 12 }} />
              ) : (
                <>
                  <Text style={styles.feedbackSub}>
                    {feedback
                      ? 'Thank you for sharing your experience with our team.'
                      : 'How satisfied are you with the resolution of this complaint?'}
                  </Text>

                  {/* Star rating buttons */}
                  <View style={styles.starRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        disabled={!!feedback}
                        onPress={() => setRating(star)}
                        style={styles.starBtn}
                      >
                        <Ionicons
                          name={star <= rating ? 'star' : 'star-outline'}
                          size={32}
                          color="#f59e0b"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Feedback comments */}
                  {feedback ? (
                    feedback.Comments ? (
                      <View style={styles.submittedCommentBox}>
                        <Text style={styles.submittedCommentText}>"{feedback.Comments}"</Text>
                      </View>
                    ) : null
                  ) : (
                    <>
                      <TextInput
                        style={styles.commentInput}
                        placeholder="Share any comments or suggestions (optional)..."
                        placeholderTextColor="#4b5563"
                        value={comments}
                        onChangeText={setComments}
                        multiline
                        numberOfLines={3}
                      />
                      <TouchableOpacity
                        style={[styles.submitFeedbackBtn, submittingFeedback && styles.btnDisabled]}
                        onPress={handleSubmitFeedback}
                        disabled={submittingFeedback}
                      >
                        {submittingFeedback ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <>
                            <Ionicons name="send" size={16} color="#fff" style={{ marginRight: 6 }} />
                            <Text style={styles.submitFeedbackText}>Submit Feedback</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  topBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
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
    paddingBottom: 40,
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

  // Feedback Card
  feedbackCard: {
    borderColor: 'rgba(245,158,11,0.25)',
    backgroundColor: '#111827',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  feedbackSub: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 16,
    lineHeight: 18,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  starBtn: {
    padding: 4,
  },
  commentInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: '#ffffff',
    padding: 12,
    fontSize: 13,
    textAlignVertical: 'top',
    minHeight: 70,
    marginBottom: 14,
  },
  submitFeedbackBtn: {
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  submitFeedbackText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  submittedCommentBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  submittedCommentText: {
    color: '#d1d5db',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
