import AsyncStorage from '@react-native-async-storage/async-storage';

const EVENTS_KEY = 'calendar_events';

export const loadEvents = async () => {
  try {
    const data = await AsyncStorage.getItem(EVENTS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

export const saveEvents = async (events) => {
  try {
    await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  } catch (e) {
    console.error('Failed to save events', e);
  }
};
