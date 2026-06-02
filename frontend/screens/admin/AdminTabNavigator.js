import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen           from './DashboardScreen';
import AllComplaintsScreen       from './AllComplaintsScreen';
import AssignScreen              from './AssignScreen';
import ReportsScreen             from './ReportsScreen';
import ComplaintDetailAdminScreen from './ComplaintDetailAdminScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Complaints tab has its own stack so detail screen slides in
function ComplaintsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AllComplaints"     component={AllComplaintsScreen} />
      <Stack.Screen name="ComplaintDetailAdmin" component={ComplaintDetailAdminScreen} />
    </Stack.Navigator>
  );
}

export default function AdminTabNavigator({ onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   '#f59e0b',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor:  '#0f1623',
          borderTopWidth:   1,
          borderTopColor:   'rgba(255,255,255,0.08)',
          height:           100,
          paddingBottom:    10,
          paddingTop:       8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      >
        {props => <DashboardScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>

      <Tab.Screen
        name="Complaints"
        component={ComplaintsStack}
        options={{
          title: 'Complaints',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Assign"
        component={AssignScreen}
        options={{
          title: 'Assign',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="git-branch-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
