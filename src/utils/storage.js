import AsyncStorage from '@react-native-async-storage/async-storage';

const key = (role) => `calendar_events_${role}`;

export const loadRoleEvents = async (role) => {
  try {
    const data = await AsyncStorage.getItem(key(role));
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

export const saveRoleEvents = async (role, events) => {
  try {
    await AsyncStorage.setItem(key(role), JSON.stringify(events));
  } catch (e) {
    console.error('Failed to save events', e);
  }
};
