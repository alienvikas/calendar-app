import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  StatusBar,
  SafeAreaView,
} from 'react-native';
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
        dotColor: dayEvents[0].color,
        dots: dayEvents.slice(0, 3).map((e) => ({ color: e.color })),
      };
    });
    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: '#4A90D9',
      };
    }
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
        const newEvent = {
          id: Date.now().toString(),
          ...formData,
        };
        await addEvent(selectedDate, newEvent);
      }
      setModalVisible(false);
      setEditingEvent(null);
    },
    [editingEvent, selectedDate, addEvent, updateEvent]
  );

  const handleDelete = useCallback(async () => {
    if (editingEvent) {
      await deleteEvent(selectedDate, editingEvent.id);
    }
    setModalVisible(false);
    setEditingEvent(null);
  }, [editingEvent, selectedDate, deleteEvent]);

  const formatDisplayDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#12121E" />

      <View style={styles.topBar}>
        <Text style={styles.appTitle}>My Calendar</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

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
          textDisabledColor: '#444',
          dotColor: '#4A90D9',
          selectedDotColor: '#fff',
          arrowColor: '#4A90D9',
          monthTextColor: '#FFF',
          indicatorColor: '#4A90D9',
          textDayFontWeight: '400',
          textMonthFontWeight: '700',
          textDayHeaderFontWeight: '500',
          textDayFontSize: 14,
          textMonthFontSize: 17,
        }}
        current={selectedDate}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        markingType="multi-dot"
        enableSwipeMonths
      />

      <View style={styles.eventsSection}>
        <View style={styles.dateLine}>
          <Text style={styles.dateLabel}>{formatDisplayDate(selectedDate)}</Text>
          <Text style={styles.eventCount}>
            {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
          </Text>
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
              <TouchableOpacity onPress={openAddModal}>
                <Text style={styles.emptyAction}>Tap "+ Add" to create one</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={dayEvents.length === 0 ? styles.emptyList : styles.list}
          showsVerticalScrollIndicator={false}
        />
      </View>

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
  container: { flex: 1, backgroundColor: '#12121E' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  appTitle: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  addBtn: {
    backgroundColor: '#4A90D9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  calendar: {
    borderRadius: 16,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  eventsSection: {
    flex: 1,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  dateLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  dateLabel: { color: '#FFF', fontSize: 15, fontWeight: '600', flex: 1 },
  eventCount: { color: '#888', fontSize: 13 },
  list: { paddingBottom: 20 },
  emptyList: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#666', fontSize: 15, marginBottom: 8 },
  emptyAction: { color: '#4A90D9', fontSize: 14 },
});

export default CalendarScreen;
