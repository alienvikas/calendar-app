import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { useEvents } from '../context/EventContext';
import { ROLES, ROLE_LIST } from '../config/roles';
import RoleTabBar from '../components/RoleTabBar';
import EventCard from '../components/EventCard';
import EventFormModal from '../components/EventFormModal';

const today = new Date().toISOString().split('T')[0];

const CalendarScreen = () => {
  const { allEvents, addEvent, updateEvent, deleteEvent } = useEvents();
  const [activeRole, setActiveRole] = useState('manager');
  const [selectedDate, setSelectedDate] = useState(today);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const role = ROLES[activeRole];
  const roleEvents = allEvents[activeRole] || {};

  const markedDates = useMemo(() => {
    const marks = {};
    Object.keys(roleEvents).forEach((date) => {
      const dayEvts = roleEvents[date];
      if (!dayEvts || dayEvts.length === 0) return;
      marks[date] = {
        marked: true,
        dots: dayEvts.slice(0, 3).map((e) => ({ color: e.color || role.color })),
      };
    });
    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      selected: true,
      selectedColor: role.color,
    };
    return marks;
  }, [roleEvents, selectedDate, role.color]);

  const dayEvents = useMemo(() => roleEvents[selectedDate] || [], [roleEvents, selectedDate]);

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
        await updateEvent(activeRole, selectedDate, { ...editingEvent, ...formData });
      } else {
        await addEvent(activeRole, selectedDate, {
          id: Date.now().toString(),
          color: role.color,
          ...formData,
        });
      }
      setModalVisible(false);
      setEditingEvent(null);
    },
    [editingEvent, activeRole, selectedDate, addEvent, updateEvent, role.color]
  );

  const handleDelete = useCallback(async () => {
    if (editingEvent) await deleteEvent(activeRole, selectedDate, editingEvent.id);
    setModalVisible(false);
    setEditingEvent(null);
  }, [editingEvent, activeRole, selectedDate, deleteEvent]);

  const handleRoleChange = useCallback((newRole) => {
    setActiveRole(newRole);
    setSelectedDate(today);
    setModalVisible(false);
    setEditingEvent(null);
  }, []);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const totalEvents = ROLE_LIST.reduce((sum, r) => {
    const ev = allEvents[r.key] || {};
    return sum + Object.values(ev).reduce((s, arr) => s + arr.length, 0);
  }, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#12121E' }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#12121E" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>Calendar</Text>
          <Text style={styles.subtitle}>{totalEvents} total events across all roles</Text>
        </View>
        <View style={[styles.roleIndicator, { backgroundColor: role.color + '22', borderColor: role.color }]}>
          <Text style={styles.roleEmoji}>{role.emoji}</Text>
          <Text style={[styles.roleLabel, { color: role.color }]}>{role.label}</Text>
        </View>
      </View>

      {/* Role Tab Bar */}
      <RoleTabBar activeRole={activeRole} onSelect={handleRoleChange} />

      {/* Role banner */}
      <View style={[styles.roleBanner, { backgroundColor: role.color + '18', borderLeftColor: role.color }]}>
        <Text style={[styles.roleBannerText, { color: role.color }]}>
          {role.emoji}  {role.label} Calendar — managed by {role.label}
        </Text>
      </View>

      {/* Calendar */}
      <Calendar
        style={styles.calendar}
        theme={{
          backgroundColor: 'transparent',
          calendarBackground: '#1E1E2E',
          textSectionTitleColor: '#666',
          selectedDayBackgroundColor: role.color,
          selectedDayTextColor: '#fff',
          todayTextColor: role.color,
          dayTextColor: '#DDD',
          textDisabledColor: '#3a3a4a',
          dotColor: role.color,
          selectedDotColor: '#fff',
          arrowColor: role.color,
          monthTextColor: '#FFF',
          indicatorColor: role.color,
          textDayFontWeight: '400',
          textMonthFontWeight: '700',
          textDayHeaderFontWeight: '600',
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 11,
        }}
        current={selectedDate}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        markingType="multi-dot"
        enableSwipeMonths
      />

      {/* Events for selected day */}
      <View style={styles.eventsSection}>
        <View style={styles.dateLine}>
          <Text style={styles.dateLabel}>{formatDate(selectedDate)}</Text>
          <View style={[styles.countBadge, { backgroundColor: role.color + '22' }]}>
            <Text style={[styles.countText, { color: role.color }]}>
              {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
            </Text>
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
              <Text style={styles.emptyEmoji}>{role.emoji}</Text>
              <Text style={styles.emptyText}>No {role.label} events today</Text>
              <Text style={styles.emptyHint}>Tap + to add an event</Text>
            </View>
          }
          contentContainerStyle={[styles.list, dayEvents.length === 0 && styles.emptyList]}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: role.color, shadowColor: role.color }]}
        onPress={openAddModal}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <EventFormModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditingEvent(null); }}
        onSave={handleSave}
        onDelete={handleDelete}
        initialEvent={editingEvent}
        date={selectedDate}
        roleColor={role.color}
        roleLabel={role.label}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  appTitle: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#555', fontSize: 11, marginTop: 2 },
  roleIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  roleEmoji: { fontSize: 14 },
  roleLabel: { fontSize: 12, fontWeight: '700' },
  roleBanner: {
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderLeftWidth: 3,
  },
  roleBannerText: { fontSize: 12, fontWeight: '600' },
  calendar: {
    marginHorizontal: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  eventsSection: {
    flex: 1,
    marginTop: 12,
    paddingHorizontal: 14,
  },
  dateLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateLabel: { color: '#FFF', fontSize: 14, fontWeight: '600', flex: 1 },
  countBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countText: { fontSize: 12, fontWeight: '600' },
  list: { paddingBottom: 100 },
  emptyList: { flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 30 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyText: { color: '#555', fontSize: 14, marginBottom: 4 },
  emptyHint: { color: '#444', fontSize: 12 },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 22,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabIcon: { color: '#FFF', fontSize: 32, fontWeight: '300', lineHeight: 36 },
});

export default CalendarScreen;
