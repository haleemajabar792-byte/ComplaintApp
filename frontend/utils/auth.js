import AsyncStorage from '@react-native-async-storage/async-storage';

// Force logout on app start (clear old data)
export const forceClearAllData = async () => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Clear all error:', error);
  }
};

// Save login data
export const saveSession = async (token, studentId, name, email, institute, role = 'student', phone = '') => {
  try {
    await AsyncStorage.multiSet([
      ['token',     token],
      ['studentId', studentId.toString()],
      ['name',      name],
      ['email',     email],
      ['institute', institute],
      ['phone',     phone],
      ['role',      role],
    ]);
  } catch (error) {
    console.error('Save session error:', error);
  }
};

// Get login data
export const getSession = async () => {
  try {
    const token     = await AsyncStorage.getItem('token');
    const studentId = await AsyncStorage.getItem('studentId');
    const name      = await AsyncStorage.getItem('name');
    const email     = await AsyncStorage.getItem('email');
    const institute = await AsyncStorage.getItem('institute');
    const phone     = await AsyncStorage.getItem('phone');
    const role      = await AsyncStorage.getItem('role');   // ← only addition

    return { token, studentId, name, email, institute, phone, role: role || 'student' };
  } catch (error) {
    console.error('Get session error:', error);
    return { token: null };
  }
};

// Delete login data
export const clearSession = async () => {
  try {
    await AsyncStorage.multiRemove([
      'token', 'studentId', 'name', 'email', 'institute', 'phone', 'role',  // ← role added
    ]);
  } catch (error) {
    console.error('Clear session error:', error);
  }
};
