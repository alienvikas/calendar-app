import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { useEvents } from '../context/EventContext';
import EventCard from '../components/EventCard';
import EventFormModal from '../components/EventFormModal';

const today = new Date().toISOString().split('T')[0];

const CalendarScreen = () => {
  const { events, addEvent, updateEvent, deleteEvent } = useEvents();
  const [selectedDate, setSelectedDate] = useState(today);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const markedDates = useMemo(() => {
    const marks = {};
    Object.keys(events).forEach((date) => {
      const dayEvents = events[date];
      if (!dayEvents || dayEvents.length === 0) return;
      marks[date] = {
        marked: true,
        dots: dayEvents.slice(0, 3).map((e) => ({ color: e.color })),
      };
    });
    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      selected: true,
      selectedColor: '#4A90D9',
    };
    return marks;
  }, [events, selectedDate]);

  const dayEvents = useMemo(() => events[selectedDate] || [], [events, selectedDate]);

  const openAddModal = useCallback(() => {
    setEditingEvent(null);
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((event) => {
    setEditingEvent(event);
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(
    async (formData) => {
      if (editingEvent) {
        await updateEvent(selectedDate, { ...editingEvent, ...formData });
      } else {
        await addEvent(selectedDate, { id: Date.now().toString(), ...formData });
      }
      setModalVisible(false);
      setEditingEvent(null);
    },
    [editingEvent, selectedDate, addEvent, updateEvent]
  );

  const handleDelete = useCallback(async () => {
    if (editingEvent) await deleteEvent(selectedDate, editingEvent.id);
    setModalVisible(false);
    setEditingEvent(null);
  }, [editingEvent, selectedDate, deleteEvent]);

  const formatDisplayDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#12121E" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>My Calendar</Text>
        <Text style={styles.todayBadge}>{today}</Text>
      </View>

      {/* Calendar */}
      <Calendar
        style={styles.calendar}
        theme={{
          backgroundColor: '#12121E',
          calendarBackground: '#1E1E2E',
          textSectionTitleColor: '#888',
          selectedDayBackgroundColor: '#4A90D9',
          selectedDayTextColor: '#fff',
          todayTextColor: '#4A90D9',
          dayTextColor: '#E0E0E0',
          textDisabledColor: '#3a3a4a',
          dotColor: '#4A90D9',
          selectedDotColor: '#fff',
          arrowColor: '#4A90D9',
          monthTextColor: '#FFF',
          indicatorColor: '#4A90D9',
          textDayFontWeight: '400',
          textMonthFontWeight: '700',
          textDayHeaderFontWeight: '600',
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 12,
        }}
        current={selectedDate}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        markingType="multi-dot"
        enableSwipeMonths
      />

      {/* Events section */}
      <View style={styles.eventsSection}>
        <View style={styles.dateLine}>
          <Text style={styles.dateLabel}>{formatDisplayDate(selectedDate)}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{dayEvents.length}</Text>
          </View>
        </View>

        <FlatList
          data={dayEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard event={item} onPress={() => openEditModal(item)} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyText}>No events for this day</Text>
              <Text style={styles.emptyHint}>Tap + to add one</Text>
            </View>
          }
          contentContainerStyle={[
            styles.list,
            dayEvents.length === 0 && styles.emptyList,
          ]}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <EventFormModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditingEvent(null); }}
        onSave={handleSave}
        onDelete={handleDelete}
        initialEvent={editingEvent}
        date={selectedDate}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12121E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  appTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  todayBadge: {
    color: '#4A90D9',
    fontSize: 12,
    fontWeight: '500',
  },
  calendar: {
    marginHorizontal: 10,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  eventsSection: {
    flex: 1,
    marginTop: 14,
    paddingHorizontal: 16,
  },
  dateLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateLabel: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  countBadge: {
    backgroundColor: '#2A2A3E',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countText: {
    color: '#4A90D9',
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 100,
  },
  emptyList: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 10,
  },
  emptyText: {
    color: '#555',
    fontSize: 15,
    marginBottom: 4,
  },
  emptyHint: {
    color: '#4A90D9',
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#4A90D9',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabIcon: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 36,
  },
});

export default CalendarScreen;
