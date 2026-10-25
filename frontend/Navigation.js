import React, { useState, useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getSession, clearSession } from './utils/auth';

import WelcomeScreen         from './screens/WelcomeScreen';
import LoginScreen           from './screens/LoginScreen';
import RegisterScreen        from './screens/RegisterScreen';
import HomeScreen            from './screens/HomeScreen';
import SubmitComplaintScreen from './screens/SubmitComplaintScreen';
import MyComplaintsScreen    from './screens/MyComplaintsScreen';
import ComplaintDetailScreen from './screens/ComplaintDetailScreen';
import ProfileScreen         from './screens/ProfileScreen';
import AdminLoginScreen      from './screens/admin/AdminLoginScreen';
import AdminTabNavigator     from './screens/admin/AdminTabNavigator';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function isValidJwt(token) {
  return typeof token === 'string' && token.split('.').length === 3;
}

function StudentTabs({ onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#0f1623',
          borderTopWidth:  1,
          borderTopColor:  'rgba(255,255,255,0.1)',
          height:          100,
          paddingBottom:   10,
          paddingTop:      8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen}
        options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> }}
      />
      <Tab.Screen name="Submit" component={SubmitComplaintScreen}
        options={{ title: 'New Complaint', tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" size={size} color={color} /> }}
      />
      <Tab.Screen name="MyComplaints" component={MyComplaintsScreen}
        options={{ title: 'My Complaints', tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} /> }}
      />
      <Tab.Screen name="Profile"
        options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }}
      >
        {props => <ProfileScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function AuthStack({ onLoginSuccess }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login">
        {props => <LoginScreen {...props} onLoginSuccess={onLoginSuccess} />}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {props => <RegisterScreen {...props} onRegisterSuccess={onLoginSuccess} />}
      </Stack.Screen>
      <Stack.Screen name="AdminLogin">
        {props => <AdminLoginScreen {...props} onLoginSuccess={onLoginSuccess} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function AppStack({ onLogout }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentTabs">
        {props => <StudentTabs {...props} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  const [authState, setAuthState] = useState({
    checked:  false,
    loggedIn: false,
    role:     'student',
  });

  useEffect(() => {
    (async () => {
      try {
        const session = await getSession();
        if (session.token && !isValidJwt(session.token)) {
          await clearSession();
          setAuthState({ checked: true, loggedIn: false, role: 'student' });
          return;
        }
        setAuthState({
          checked:  true,
          loggedIn: !!session.token,
          role:     session.role || 'student',
        });
      } catch {
        setAuthState({ checked: true, loggedIn: false, role: 'student' });
      }
    })();
  }, []);

  const handleLoginSuccess = useCallback(async (role = 'student') => {
    const session = await getSession();
    setAuthState({
      checked: true,
      loggedIn: true,
      role: role || session.role || 'student',
    });
  }, []);

  const handleLogout = useCallback(async () => {
    await clearSession();
    setAuthState({ checked: true, loggedIn: false, role: 'student' });
  }, []);

  if (!authState.checked) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.splashText}>InstiSolve</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!authState.loggedIn ? (
        <AuthStack onLoginSuccess={handleLoginSuccess} />
      ) : authState.role === 'admin' ? (
        <AdminTabNavigator onLogout={handleLogout} />
      ) : (
        <AppStack onLogout={handleLogout} />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1, backgroundColor: '#0b0f19',
    justifyContent: 'center', alignItems: 'center', gap: 16,
  },
  splashText: { color: '#6366f1', fontSize: 22, fontWeight: '800', letterSpacing: 1 },
});
