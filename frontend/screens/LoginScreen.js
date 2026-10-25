import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config/api';
import { saveSession } from '../utils/auth';

export default function LoginScreen({ navigation, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const clearError = () => errorMsg && setErrorMsg('');

  const handleLogin = async () => {
    const cleanedEmail = email.toLowerCase().trim();

    if (!cleanedEmail || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email: cleanedEmail,
        password,
      }, { timeout: 8000 });

      if (response.data.success && response.data.token) {
        const userData = response.data.student || response.data.user || {};

        await saveSession(
          response.data.token,
          userData.id || userData.studentId || userData.StudentID || '',
          userData.name || '',
          userData.email || cleanedEmail,
          userData.institute || '',
          userData.role || 'student',
          userData.phone || ''
        );

        setLoading(false);
        onLoginSuccess && onLoginSuccess('student');
        return;
      }

      setErrorMsg(response.data.message || 'Invalid credentials. Please try again.');
    } catch (error) {
      console.error('Login Error:', error.response?.data || error.message);

      if (error.response?.status === 401) {
        setErrorMsg(
          error.response.data?.message ||
          'Invalid email or password. Use the password from when you registered.'
        );
      } else if (error.response?.status === 403) {
        setErrorMsg(error.response.data?.message || 'Please use the admin login screen.');
      } else if (error.response?.status === 409) {
        setErrorMsg('This email is already registered. Sign in with your existing password.');
      } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        setErrorMsg(
          `Cannot reach server at ${API_URL}. Start backend (npm start in backend/), connect phone to same Wi‑Fi/hotspot, and update frontend/config/api.js with your laptop IP.`
        );
      } else {
        setErrorMsg(error.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerArea}>
            <View style={styles.iconCircle}>
              <Ionicons name="lock-open-outline" size={28} color="#6366f1" />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your student portal</Text>
          </View>

          <View style={styles.form}>
            {!!errorMsg && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#f87171" />
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
              </View>
            )}

            <Text style={styles.label}>Email Address</Text>
            <View style={[styles.inputRow, focusedField === 'email' && styles.inputRowFocused]}>
              <Ionicons name="mail-outline" size={19} color={focusedField === 'email' ? '#6366f1' : '#4b5563'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="ali@iout.edu"
                placeholderTextColor="#374151"
                value={email}
                onChangeText={v => { setEmail(v); clearError(); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputRow, focusedField === 'password' && styles.inputRowFocused]}>
              <Ionicons name="lock-closed-outline" size={19} color={focusedField === 'password' ? '#6366f1' : '#4b5563'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#374151"
                value={password}
                onChangeText={v => { setPassword(v); clearError(); }}
                secureTextEntry={!showPassword}
                editable={!loading}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={19} color="#4b5563" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.82}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerText}>Don't have an account? </Text>
              <Text style={styles.registerTextBold}>Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.adminLink}
              onPress={() => navigation.navigate('AdminLogin')}
              disabled={loading}
            >
              <Ionicons name="shield-outline" size={13} color="#f59e0b" />
              <Text style={styles.adminLinkText}>Admin? Sign in here</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0f19' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32, justifyContent: 'center' },
  headerArea: { alignItems: 'center', marginBottom: 36 },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.25)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#ffffff', letterSpacing: 0.2 },
  subtitle: { fontSize: 13, color: '#9ca3af', marginTop: 6, fontWeight: '500' },
  form: {},
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.20)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#9ca3af', marginBottom: 8, marginTop: 4 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, paddingHorizontal: 14, height: 52, marginBottom: 16,
  },
  inputRowFocused: { borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.06)' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#ffffff', fontSize: 14 },
  eyeBtn: { paddingLeft: 8 },
  btn: {
    backgroundColor: '#6366f1', height: 52, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#6366f1', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 4,
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#ffffff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  divider: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  dividerText: { color: '#4b5563', marginHorizontal: 12, fontSize: 13, fontWeight: '500' },
  registerBtn: { flexDirection: 'row', justifyContent: 'center' },
  registerText: { color: '#9ca3af', fontSize: 14, fontWeight: '500' },
  registerTextBold: { color: '#6366f1', fontSize: 14, fontWeight: '700' },
  adminLink: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5, marginTop: 16,
  },
  adminLinkText: { color: '#f59e0b', fontSize: 13, fontWeight: '600' },
});
