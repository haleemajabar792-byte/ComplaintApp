import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

function FeatureRow({ icon, title, description }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIconContainer}>
        <Ionicons name={icon} size={22} color="#6366f1" />
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />

      {/* Decorative glows */}
      <View style={styles.glow1} />
      <View style={styles.glow2} />

      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="chatbubbles" size={46} color="#6366f1" />
          </View>
          <Text style={styles.appName}>InstiSolve</Text>
          <Text style={styles.tagline}>Complaint Management Platform</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <FeatureRow
            icon="school-outline"
            title="Multi-Institute System"
            description="Select your campus and submit complaints directly to your administration."
          />
          <FeatureRow
            icon="shield-checkmark-outline"
            title="Fast & Secure"
            description="Track complaints in real-time with secure, encrypted handling."
          />
          <FeatureRow
            icon="git-branch-outline"
            title="Categorized Routing"
            description="Issues route to Transport, Security, Hostel, Academics, or Maintenance."
          />
        </View>

        {/* Actions */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.82}
          >
            <Text style={styles.primaryBtnText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.82}
          >
            <Text style={styles.secondaryBtnText}>Create Account</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>Version 1.0.0 • Secure Student Portal</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  glow1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(99,102,241,0.12)',
    top: -60,
    right: -60,
  },
  glow2: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(59,130,246,0.08)',
    bottom: -80,
    left: -80,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 26,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 24,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 6,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  featuresSection: {
    marginVertical: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  featureIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: 'rgba(99,102,241,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 3,
  },
  featureDescription: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 17,
  },
  actionSection: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  primaryBtn: {
    backgroundColor: '#6366f1',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.4)',
    marginBottom: 20,
  },
  secondaryBtnText: {
    color: '#6366f1',
    fontSize: 15,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
});
