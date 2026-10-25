import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { saveSession } from '../../utils/auth';

export default function AdminLoginScreen({ navigation, onLoginSuccess }) {
  const [email,          setEmail]          = useState('');
  const [password,       setPassword]       = useState('');
  const [showPassword,   setShowPassword]   = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [focusedField,   setFocusedField]   = useState(null);
  const [errorMsg,       setErrorMsg]       = useState('');

  // ── Helpers ────────────────────────────────────────────────────
  const clearError = () => errorMsg && setErrorMsg('');

  const showError = (msg) => {
    setErrorMsg(msg);
    setLoading(false);
  };

  // ── Login handler ──────────────────────────────────────────────
  const handleLogin = async () => {
    const cleanEmail = email.toLowerCase().trim();

    if (!cleanEmail || !password) {
      return showError('Please enter your admin email and password.');
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await axios.post(
        `${API_URL}/api/admin/login`,
        { email: cleanEmail, password },
        { timeout: 8000 }
      );

      if (res.data.success && res.data.token) {
        const admin = res.data.admin || {};
        await saveSession(
          res.data.token,
          admin.id || 'admin',
          admin.name || '',
          admin.email || cleanEmail,
          admin.institute || 'All Institutes',
          'admin'
        );
        setLoading(false);
        onLoginSuccess && onLoginSuccess('admin');
        return;
      }

      showError(res.data.message || 'Invalid admin credentials.');
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message === 'Network Error') {
        showError(`Cannot reach ${API_URL}. Start backend, same hotspot/Wi‑Fi, update frontend/config/api.js (ipconfig).`);
      } else if (err.response?.status === 401) {
        showError(err.response.data?.message || 'Invalid admin credentials.');
      } else {
        showError(err.response?.data?.message || 'Admin login failed. Please try again.');
      }
    }
  };

  // ── UI ─────────────────────────────────────────────────────────
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
          {/* Back to student login */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={22} color="#9ca3af" />
          </TouchableOpacity>

          {/* ── Header ── */}
          <View style={styles.headerArea}>
            {/* Admin badge pill */}
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark-outline" size={13} color="#f59e0b" />
              <Text style={styles.adminBadgeText}>Admin Access</Text>
            </View>

            <View style={styles.iconCircle}>
              <Ionicons name="shield-outline" size={30} color="#f59e0b" />
            </View>

            <Text style={styles.title}>Admin Portal</Text>
            <Text style={styles.subtitle}>
              Restricted to authorised administrators only
            </Text>
          </View>

          {/* ── Form ── */}
          <View style={styles.form}>

            {/* Inline error banner */}
            {!!errorMsg && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#f87171" />
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
              </View>
            )}

            {/* Email */}
            <Text style={styles.label}>Admin Email</Text>
            <View style={[
              styles.inputRow,
              focusedField === 'email' && styles.inputRowFocused,
            ]}>
              <Ionicons
                name="mail-outline"
                size={19}
                color={focusedField === 'email' ? '#f59e0b' : '#4b5563'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="admin@instisolve.com"
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

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={[
              styles.inputRow,
              focusedField === 'password' && styles.inputRowFocused,
            ]}>
              <Ionicons
                name="lock-closed-outline"
                size={19}
                color={focusedField === 'password' ? '#f59e0b' : '#4b5563'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter admin password"
                placeholderTextColor="#374151"
                value={password}
                onChangeText={v => { setPassword(v); clearError(); }}
                secureTextEntry={!showPassword}
                editable={!loading}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(v => !v)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={19}
                  color="#4b5563"
                />
              </TouchableOpacity>
            </View>

            {/* Sign In button */}
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.82}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={17}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.btnText}>Sign In as Admin</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>not an admin?</Text>
              <View style={styles.divider} />
            </View>

            {/* Back to student login link */}
            <TouchableOpacity
              style={styles.studentLink}
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
            >
              <Ionicons name="school-outline" size={15} color="#6366f1" style={{ marginRight: 6 }} />
              <Text style={styles.studentLinkText}>Go to Student Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 36,
  },

  // Back button — identical to LoginScreen
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },

  // Header
  headerArea: {
    alignItems: 'center',
    marginBottom: 36,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },
  adminBadgeText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  // Amber icon circle (vs indigo for student login)
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // Form
  form: {},
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
    marginTop: 4,
  },

  // Input row — same structure as LoginScreen, amber focus colour
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 16,
  },
  inputRowFocused: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245,158,11,0.06)',
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  eyeBtn: { paddingLeft: 8 },

  // Inline error banner
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

  // Sign In button — amber instead of indigo
  btn: {
    flexDirection: 'row',
    backgroundColor: '#f59e0b',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Dev hint box
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 40,
    justifyContent: 'center',
  },
  hintText: {
    color: '#374151',
    fontSize: 11,
    fontWeight: '500',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  dividerText: {
    color: '#4b5563',
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: '500',
  },

  // Student login link
  studentLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentLinkText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '700',
  },
});
