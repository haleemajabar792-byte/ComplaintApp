import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../../config/api';

const STATUS_FILTERS = ['All', 'Pending', 'In Progress', 'Resolved'];

export default function AllComplaintsScreen({ navigation }) {
  const [complaints, setComplaints] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchComplaints = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log("Fetching all complaints for admin...");

      const res = await axios.get(`${API_URL}/api/admin/complaints`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 8000,
      });

      const data = res.data.complaints || res.data || [];
      console.log(`Loaded ${data.length} complaints`);

      setComplaints(data);
      setFiltered(data);
    } catch (error) {
      console.error("Admin Complaints Fetch Error:", error.response?.data || error.message);
      
      // Show error to user
      Alert.alert("Error", "Failed to load complaints from server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Search & Filter
  useEffect(() => {
    let result = [...complaints];

    if (statusFilter !== 'All') {
      result = result.filter(c => 
        c.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        (c.title || '').toLowerCase().includes(q) ||
        (c.studentName || '').toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [search, statusFilter, complaints]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchComplaints();
  };

  const goToDetail = (item) => {
    navigation.navigate('ComplaintDetailAdmin', { complaint: item });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />

      <View style={styles.header}>
        <Text style={styles.title}>All Complaints</Text>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{filtered.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={17} color="#6b7280" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title or student..."
          placeholderTextColor="#374151"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Status Filters */}
      <View style={styles.chipsScroll}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, statusFilter === f && styles.chipActive]}
            onPress={() => setStatusFilter(f)}
          >
            <Text style={[styles.chipText, statusFilter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id || item.id || Math.random().toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => goToDetail(item)}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardDate}>
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                </Text>
              </View>
              <Text style={styles.studentName}>By: {item.studentName || 'Student'}</Text>
              <Text style={styles.status}>{item.status || 'Pending'}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-outline" size={50} color="#374151" />
              <Text style={styles.emptyText}>No complaints found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0f19' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 10 },
  title: { fontSize: 22, fontWeight: '800', color: '#ffffff', flex: 1 },
  countPill: { backgroundColor: '#6366f1', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  countText: { color: '#fff', fontWeight: '700' },

  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12,
    marginHorizontal: 20, marginBottom: 12, paddingHorizontal: 14, height: 46,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },

  chipsScroll: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  chipText: { color: '#9ca3af', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  list: { paddingHorizontal: 20, paddingBottom: 30, gap: 12 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#fff', flex: 1, marginRight: 8 },
  cardDate: { fontSize: 11, color: '#6b7280' },
  studentName: { color: '#9ca3af', fontSize: 12, marginTop: 6 },
  status: { color: '#f59e0b', fontSize: 12, fontWeight: '600', marginTop: 4 },

  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#6b7280', fontSize: 15, marginTop: 10 },
});