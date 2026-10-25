import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../config/api';
import { saveSession } from '../utils/auth';

const INSTITUTES = [
  'Institute of Technology (IoT)',
  'Business School (IBS)',
  'Medical College (IMC)',
  'Science Academy (ISA)',
  'Arts & Design Center (IADC)',
];

function InputField({ icon, label, value, onChangeText, placeholder, keyboardType, secureTextEntry, editable }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
        <Ionicons name={icon} size={18} color={focused ? '#6366f1' : '#4b5563'} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#374151"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || 'default'}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
          editable={editable !== false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

export default function RegisterScreen({ navigation, onRegisterSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [institute, setInstitute] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validation
    if (!name.trim() || !email.trim() || !password || !phone.trim() || !institute) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone.trim(),
      institute,
    };

    try {
      // Try backend first
      const response = await axios.post(`${API_URL}/api/auth/register`, userData, {
        timeout: 5000,
      });

      console.log('Register response:', response.data);

      if (response.data.success || response.status === 201) {
        const data = response.data;
        const student = data.student || {};

        if (data.token) {
          await saveSession(
            data.token,
            student.id || student.studentId || '',
            student.name || name.trim(),
            student.email || userData.email,
            student.institute || institute,
            'student',
            student.phone || phone.trim()
          );
          setLoading(false);
          onRegisterSuccess && onRegisterSuccess('student');
          return;
        }

        Alert.alert(
          '✅ Account Created!',
          'You can now sign in with your credentials.',
          [{ text: 'Go to Login', onPress: () => navigation.navigate('Login') }]
        );
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Backend registration error:', error.message);
      
      let errorMsg = 'Registration failed. Please try again.';
      
      if (error.response?.status === 409) {
        Alert.alert(
          'Email Already Registered',
          'This email is already in use. Sign in with the password you used when you created the account.',
          [
            { text: 'Go to Login', onPress: () => navigation.navigate('Login') },
            { text: 'OK', style: 'cancel' },
          ]
        );
        setLoading(false);
        return;
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message === 'Network Error' || error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        errorMsg = `Cannot reach server at ${API_URL}. Start backend (npm start), connect phone to same hotspot/Wi‑Fi, update frontend/config/api.js with laptop IP from ipconfig, then npx expo start -c`;
      }

      Alert.alert('Registration Failed', errorMsg);
      setLoading(false);
      return;
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
          {/* Back button → navigate to Login, not goBack() */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Login')}>
            <Ionicons name="arrow-back" size={22} color="#9ca3af" />
          </TouchableOpacity>

          <View style={styles.headerArea}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-add-outline" size={28} color="#6366f1" />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join InstiSolve student portal</Text>
          </View>

          <View style={styles.form}>
            <InputField 
              icon="person-outline" 
              label="Full Name" 
              value={name} 
              onChangeText={setName} 
              placeholder="John Doe" 
            />
            <InputField 
              icon="mail-outline" 
              label="Email Address" 
              value={email} 
              onChangeText={setEmail} 
              placeholder="yourname@institute.edu" 
              keyboardType="email-address" 
            />
            <InputField 
              icon="lock-closed-outline" 
              label="Password (min 6 chars)" 
              value={password} 
              onChangeText={setPassword} 
              placeholder="Create a strong password" 
              secureTextEntry 
            />
            <InputField 
              icon="call-outline" 
              label="Phone Number" 
              value={phone} 
              onChangeText={setPhone} 
              placeholder="03001234567" 
              keyboardType="phone-pad" 
            />

            <Text style={styles.label}>Select Institute</Text>
            <View style={styles.pickerWrapper}>
              <Ionicons name="business-outline" size={18} color="#4b5563" style={styles.inputIcon} />
              <Picker
                selectedValue={institute}
                onValueChange={setInstitute}
                style={styles.picker}
                dropdownIconColor="#9ca3af"
                enabled={!loading}
              >
                <Picker.Item label="Choose your institute..." value="" />
                {INSTITUTES.map((inst, i) => (
                  <Picker.Item key={i} label={inst} value={inst} />
                ))}
              </Picker>
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginText}>Already have an account? </Text>
              <Text style={styles.loginTextBold}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0f19' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center', alignItems: 'center',
    marginTop: 12, marginBottom: 8,
  },
  headerArea: { alignItems: 'center', marginBottom: 28 },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.25)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#ffffff' },
  subtitle: { fontSize: 13, color: '#9ca3af', marginTop: 5, fontWeight: '500' },
  form: {},
  label: { fontSize: 13, fontWeight: '600', color: '#9ca3af', marginBottom: 7 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, paddingHorizontal: 14, height: 52,
  },
  inputRowFocused: { borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.06)' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#ffffff', fontSize: 14 },
  pickerWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, paddingLeft: 14, marginBottom: 20,
    overflow: 'hidden', height: 52,
  },
  picker: { flex: 1, color: '#ffffff' },
  btn: {
    backgroundColor: '#6366f1', height: 52, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  loginLink: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { color: '#9ca3af', fontSize: 14, fontWeight: '500' },
  loginTextBold: { color: '#6366f1', fontSize: 14, fontWeight: '700' },
});
