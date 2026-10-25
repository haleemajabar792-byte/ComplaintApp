import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../../config/api';

export default function ReportsScreen() {
  const [data, setData] = useState(null);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [recentFeedbacks, setRecentFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, feedbackRes, allFeedbackRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/dashboard/stats`, { headers, timeout: 8000 }),
        axios.get(`${API_URL}/api/feedback/stats`, { headers, timeout: 6000 }).catch(() => ({ data: {} })),
        axios.get(`${API_URL}/api/feedback/all`, { headers, timeout: 6000 }).catch(() => ({ data: {} })),
      ]);

      const payload = statsRes.data.stats || statsRes.data;
      setData(payload);
      setFeedbackStats(feedbackRes.data?.stats || payload?.feedback || null);
      setRecentFeedbacks(allFeedbackRes.data?.feedbacks || []);
    } catch (error) {
      console.error('Reports Error:', error.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </SafeAreaView>
    );
  }

  const total = data?.total || 0;
  const pending = data?.pending || 0;
  const inProgress = data?.inProgress || 0;
  const resolved = data?.resolved || 0;
  const closed = data?.closed || 0;
  const resolutionRate = data?.resolutionRate ?? (total > 0 ? Math.round(((resolved + closed) / total) * 100) : 0);

  const avgRating = feedbackStats?.averageRating ? parseFloat(feedbackStats.averageRating).toFixed(1) : '5.0';
  const totalReviews = feedbackStats?.totalFeedback || 0;
  const departments = data?.departments || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />
      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>System Analytics & Reports</Text>
          <Text style={styles.subtitle}>Comprehensive performance, routing, and feedback insights</Text>
        </View>

        {/* Resolution Rate Highlight Card */}
        <View style={styles.rateCard}>
          <View>
            <Text style={styles.rateLabel}>Resolution Rate</Text>
            <Text style={styles.rateNumber}>{resolutionRate}%</Text>
            <Text style={styles.rateSub}>{resolved + closed} of {total} cases resolved</Text>
          </View>
          <View style={styles.rateIconCircle}>
            <Ionicons name="pie-chart" size={32} color="#10b981" />
          </View>
        </View>

        {/* Status Breakdown Grid */}
        <Text style={styles.sectionTitle}>Status Breakdown</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{total}</Text>
            <Text style={styles.statLabel}>Total Complaints</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{pending}</Text>
            <Text style={styles.statLabel}>Pending Review</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#6366f1' }]}>{inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#10b981' }]}>{resolved}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
        </View>

        {/* ⭐ Student Satisfaction & Feedback */}
        <Text style={styles.sectionTitle}>Student Satisfaction & Feedback</Text>
        <View style={styles.feedbackCard}>
          <View style={styles.feedbackTopRow}>
            <View>
              <Text style={styles.avgRatingText}>{avgRating}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Ionicons
                    key={s}
                    name={s <= Math.round(parseFloat(avgRating)) ? 'star' : 'star-outline'}
                    size={16}
                    color="#f59e0b"
                  />
                ))}
              </View>
              <Text style={styles.reviewCountText}>{totalReviews} total student review{totalReviews !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.feedbackBadge}>
              <Ionicons name="ribbon-outline" size={20} color="#f59e0b" />
              <Text style={styles.feedbackBadgeText}>Quality Score</Text>
            </View>
          </View>

          {/* Recent feedback comments */}
          {recentFeedbacks.length > 0 && (
            <View style={styles.reviewsList}>
              <Text style={styles.recentReviewsTitle}>Recent Student Reviews:</Text>
              {recentFeedbacks.slice(0, 3).map((fb, idx) => (
                <View key={fb.FeedbackID || idx} style={styles.reviewItem}>
                  <View style={styles.reviewItemHeader}>
                    <Text style={styles.reviewerName}>{fb.StudentName || 'Student'}</Text>
                    <View style={styles.starsRowMini}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Ionicons
                          key={s}
                          name={s <= fb.Rating ? 'star' : 'star-outline'}
                          size={12}
                          color="#f59e0b"
                        />
                      ))}
                    </View>
                  </View>
                  {fb.Comments ? (
                    <Text style={styles.reviewComment}>"{fb.Comments}"</Text>
                  ) : (
                    <Text style={styles.noReviewComment}>Rating submitted without comments</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Department Workload Breakdown */}
        {departments.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Department Workload</Text>
            <View style={styles.deptCard}>
              {departments.map((d) => {
                const percentage = total > 0 ? Math.round((d.count / total) * 100) : 0;
                return (
                  <View key={d.departmentId} style={styles.deptRow}>
                    <View style={styles.deptTextRow}>
                      <Text style={styles.deptName}>{d.departmentName}</Text>
                      <Text style={styles.deptCount}>{d.count} complaints ({percentage}%)</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressBar, { width: `${Math.max(percentage, 4)}%` }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0f19' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b0f19' },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  subtitle: { fontSize: 13, color: '#9ca3af', marginTop: 4, lineHeight: 18 },

  rateCard: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rateLabel: { fontSize: 13, fontWeight: '700', color: '#10b981', textTransform: 'uppercase', letterSpacing: 0.5 },
  rateNumber: { fontSize: 36, fontWeight: '800', color: '#ffffff', marginVertical: 4 },
  rateSub: { fontSize: 13, color: '#9ca3af' },
  rateIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(16,185,129,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff', marginBottom: 12, marginTop: 8 },
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 16,
    width: '48%',
    alignItems: 'center',
  },
  statNumber: { fontSize: 26, fontWeight: '800', color: '#fff' },
  statLabel: { color: '#9ca3af', marginTop: 4, fontSize: 12, fontWeight: '500' },

  // Feedback Card
  feedbackCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  feedbackTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avgRatingText: { fontSize: 32, fontWeight: '800', color: '#ffffff' },
  starsRow: { flexDirection: 'row', gap: 3, marginTop: 4, marginBottom: 4 },
  starsRowMini: { flexDirection: 'row', gap: 2 },
  reviewCountText: { fontSize: 12, color: '#9ca3af' },
  feedbackBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
  },
  feedbackBadgeText: { fontSize: 11, fontWeight: '700', color: '#f59e0b', marginTop: 2 },

  reviewsList: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12,
  },
  recentReviewsTitle: { fontSize: 12, fontWeight: '700', color: '#9ca3af', marginBottom: 8 },
  reviewItem: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  reviewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewerName: { fontSize: 12, fontWeight: '600', color: '#ffffff' },
  reviewComment: { fontSize: 12, color: '#d1d5db', fontStyle: 'italic' },
  noReviewComment: { fontSize: 11, color: '#6b7280' },

  // Department Card
  deptCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  deptRow: {},
  deptTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  deptName: { fontSize: 13, fontWeight: '600', color: '#ffffff' },
  deptCount: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
  progressTrack: {
    height: 7,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
});