import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EventProvider } from './src/context/EventContext';
import CalendarScreen from './src/screens/CalendarScreen';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <EventProvider>
          <CalendarScreen />
        </EventProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
