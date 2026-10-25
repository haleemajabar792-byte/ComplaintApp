import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../config/api';

const INSTITUTES = [
  'Institute of Technology (IoT)',
  'Business School (IBS)',
  'Medical College (IMC)',
  'Science Academy (ISA)',
  'Arts & Design Center (IADC)',
];

export default function SubmitComplaintScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [institute, setInstitute] = useState('');
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [catRes, deptRes] = await Promise.all([
        axios.get(`${API_URL}/api/categories`, config),
        axios.get(`${API_URL}/api/departments`, config),
      ]);

      setCategories(catRes.data.categories || catRes.data || []);
      setDepartments(deptRes.data.departments || deptRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      // Offline mock
      setCategories([
        { CategoryID: 1, CategoryName: 'Facilities' },
        { CategoryID: 2, CategoryName: 'IT' },
        { CategoryID: 3, CategoryName: 'Finance' },
        { CategoryID: 4, CategoryName: 'Academic' },
        { CategoryID: 5, CategoryName: 'Hostel' },
      ]);
      setDepartments([
        { DepartmentID: 1, DepartmentName: 'Facilities Dept' },
        { DepartmentID: 2, DepartmentName: 'IT Department' },
        { DepartmentID: 3, DepartmentName: 'Finance Office' },
        { DepartmentID: 4, DepartmentName: 'Academic Affairs' },
        { DepartmentID: 5, DepartmentName: 'Hostel Management' },
      ]);
    } finally {
      setLoading(false);
    }
  };

const handleSubmit = async () => {
  if (!title.trim() || !description.trim() || !categoryId || !departmentId || !institute) {
    Alert.alert('Incomplete Form', 'Please fill all required fields.');
    return;
  }

  setSubmitting(true);

  try {
    const token = await AsyncStorage.getItem('token');
    const studentId = await AsyncStorage.getItem('studentId');   // ← Yeh line add karni hai

    if (!studentId) {
      Alert.alert('Error', 'Student ID not found. Please login again.');
      return;
    }

    await axios.post(`${API_URL}/api/complaints`, {
      title: title.trim(),
      description: description.trim(),
      categoryId: parseInt(categoryId),
      departmentId: parseInt(departmentId),
      institute: institute,
      studentId: parseInt(studentId),
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    Alert.alert('✅ Success!', 'Complaint submitted successfully!');
    
    setTitle(''); 
    setDescription(''); 
    setCategoryId(''); 
    setDepartmentId('');
    setInstitute('');
  } catch (error) {
    Alert.alert('Error', error.response?.data?.message || 'Failed to submit complaint');
  } finally {
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Submit New Complaint</Text>

        <Text style={styles.label}>Title *</Text>
        <TextInput style={styles.input} placeholder="Enter complaint title" value={title} onChangeText={setTitle} placeholderTextColor="#6b7280" />

        <Text style={styles.label}>Description *</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Describe your issue..." value={description} onChangeText={setDescription} multiline placeholderTextColor="#6b7280" />

        <Text style={styles.label}>Institute *</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={institute} onValueChange={setInstitute}>
            <Picker.Item label="Select Institute" value="" />
            {INSTITUTES.map((inst, i) => <Picker.Item key={i} label={inst} value={inst} />)}
          </Picker>
        </View>

        <Text style={styles.label}>Category *</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={categoryId} onValueChange={setCategoryId}>
            <Picker.Item label="Select Category" value="" />
            {categories.map((cat) => (
              <Picker.Item key={cat.CategoryID} label={cat.CategoryName} value={cat.CategoryID.toString()} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Department *</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={departmentId} onValueChange={setDepartmentId}>
            <Picker.Item label="Select Department" value="" />
            {departments.map((dept) => (
              <Picker.Item key={dept.DepartmentID} label={dept.DepartmentName} value={dept.DepartmentID.toString()} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Complaint</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0f19' },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20, textAlign: 'center' },
  label: { color: '#9ca3af', fontSize: 14, fontWeight: '600', marginTop: 12, marginBottom: 5 },
  input: { backgroundColor: '#1f2937', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#374151' },
  textArea: { height: 100, textAlignVertical: 'top' },
  pickerContainer: { backgroundColor: '#1f2937', borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#374151' },
  submitBtn: { backgroundColor: '#6366f1', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b0f19' },
});
