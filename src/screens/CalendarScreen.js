import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { useEvents } from '../context/EventContext';
import { ROLES, ROLE_LIST } from '../config/roles';
import { getShiftDisplayColor, getShiftStatus } from '../utils/shiftHelpers';
import RoleTabBar from '../components/RoleTabBar';
import EventCard from '../components/EventCard';
import EventFormModal from '../components/EventFormModal';

const today = new Date().toISOString().split('T')[0];

const CalendarScreen = () => {
  const { allEvents, addEvent, updateEvent, deleteEvent, acceptShift } = useEvents();
  const [activeRole, setActiveRole] = useState('manager');
  const [selectedDate, setSelectedDate] = useState(today);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  // Tick every 60s so status/color recalculates in real-time
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const role = ROLES[activeRole];
  const isDriver = activeRole === 'driver';

  // Driver sees all shifts from manager + retailer
  const roleEvents = useMemo(() => {
    if (!isDriver) return allEvents[activeRole] || {};
    const merged = {};
    ['manager', 'retailer'].forEach((r) => {
      Object.entries(allEvents[r] || {}).forEach(([date, shifts]) => {
        const activeShifts = shifts.filter((s) => getShiftStatus(s) === 'active');
        if (activeShifts.length > 0) {
          merged[date] = [...(merged[date] || []), ...activeShifts];
        }
      });
    });
    return merged;
  }, [allEvents, activeRole, isDriver]);

  const allRoleEvents = useMemo(() => Object.values(roleEvents).flat(), [roleEvents]);

  // multi-period marks with dynamic color per shift
  const markedDates = useMemo(() => {
    const marks = {};
    const addPeriod = (dateStr, period) => {
      if (!marks[dateStr]) marks[dateStr] = { periods: [] };
      marks[dateStr].periods.push(period);
    };
    allRoleEvents.forEach((shift) => {
      const start = shift.startDate || shift.date;
      const end = shift.endDate || start;
      const color = getShiftDisplayColor(shift); // red if urgent, grey if pending
      let cur = start;
      while (cur <= end) {
        addPeriod(cur, { startingDay: cur === start, endingDay: cur === end, color });
        const d = new Date(cur + 'T00:00:00');
        d.setDate(d.getDate() + 1);
        cur = d.toISOString().split('T')[0];
      }
    });
    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      selected: true,
      selectedColor: role.color,
    };
    return marks;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRoleEvents, selectedDate, role.color, tick]);

  const dayShifts = useMemo(
    () => allRoleEvents.filter((s) => {
      const start = s.startDate || s.date;
      const end = s.endDate || start;
      return start <= selectedDate && selectedDate <= end;
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allRoleEvents, selectedDate, tick]
  );

  const openAddModal = useCallback(() => {
    if (isDriver) return; // Rule 1
    setEditingShift(null);
    setModalVisible(true);
  }, [isDriver]);

  const openEditModal = useCallback((shift) => {
    setEditingShift(shift);
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(async (formData) => {
    try {
      const storageDate = formData.startDate || selectedDate;
      if (editingShift) {
        const oldDate = editingShift.startDate || selectedDate;
        const targetRole = editingShift.createdBy || activeRole;
        await updateEvent(targetRole, oldDate, { ...editingShift, ...formData });
      } else {
        await addEvent(activeRole, storageDate, {
          id: Date.now().toString(),
          createdAt: Date.now(),
          createdBy: activeRole,
          color: role.color,
          ...formData,
        });
      }
      setModalVisible(false);
      setEditingShift(null);
    } catch (err) {
      Alert.alert('Save Failed', err?.message || 'Something went wrong. Please try again.');
    }
  }, [editingShift, activeRole, selectedDate, addEvent, updateEvent, role.color]);

  const handleDelete = useCallback(async () => {
    if (!editingShift) return;
    const targetRole = editingShift.createdBy || activeRole;
    const storageDate = editingShift.startDate || selectedDate;
    await deleteEvent(targetRole, storageDate, editingShift.id);
    setModalVisible(false);
    setEditingShift(null);
  }, [editingShift, activeRole, selectedDate, deleteEvent]);

  const handleAccept = useCallback((shift) => {
    if (!isDriver) return;
    if (getShiftStatus(shift) !== 'active') {
      Alert.alert('Not Yet Active', 'This shift is still pending and cannot be accepted yet.');
      return;
    }
    Alert.alert('Accept Shift', `Accept "${shift.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept', onPress: () => {
          const createdByRole = shift.createdBy || 'manager';
          const storageDate = shift.startDate || shift.date;
          acceptShift(createdByRole, storageDate, shift.id);
        },
      },
    ]);
  }, [isDriver, acceptShift]);

  const handleRoleChange = useCallback((newRole) => {
    setActiveRole(newRole);
    setSelectedDate(today);
    setModalVisible(false);
    setEditingShift(null);
  }, []);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const totalShifts = ROLE_LIST
    .filter((r) => r.key !== 'driver')
    .reduce((sum, r) => {
      const ev = allEvents[r.key] || {};
      return sum + Object.values(ev).reduce((s, arr) => s + arr.length, 0);
    }, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#12121E" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>Shift Calendar</Text>
          <Text style={styles.subtitle}>{totalShifts} total shifts</Text>
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
          {role.emoji}{'  '}
          {isDriver
            ? '🚚 Driver View — tap a shift to accept it'
            : `${role.label} — can add & delete shifts`}
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
          arrowColor: role.color,
          monthTextColor: '#FFF',
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
        markingType="multi-period"
        enableSwipeMonths
      />

      {/* Shifts for selected day */}
      <View style={styles.eventsSection}>
        <View style={styles.dateLine}>
          <Text style={styles.dateLabel}>{formatDate(selectedDate)}</Text>
          <View style={[styles.countBadge, { backgroundColor: role.color + '22' }]}>
            <Text style={[styles.countText, { color: role.color }]}>
              {dayShifts.length} {dayShifts.length === 1 ? 'shift' : 'shifts'}
            </Text>
          </View>
        </View>

        <FlatList
          data={dayShifts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              isDriverMode={isDriver}
              onPress={() => openEditModal(item)}
              onAccept={() => handleAccept(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>{role.emoji}</Text>
              <Text style={styles.emptyText}>No {role.label} shifts on this day</Text>
              <Text style={styles.emptyHint}>
                {isDriver ? 'No shifts available to accept' : 'Tap + to add a shift'}
              </Text>
            </View>
          }
          contentContainerStyle={[styles.list, dayShifts.length === 0 && styles.emptyList]}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* FAB — hidden for driver (Rule 1) */}
      {!isDriver && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: role.color, shadowColor: role.color }]}
          onPress={openAddModal}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}

      <EventFormModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditingShift(null); }}
        onSave={handleSave}
        onDelete={handleDelete}
        initialEvent={editingShift}
        date={selectedDate}
        roleColor={role.color}
        roleLabel={role.label}
        isDriverMode={isDriver}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12121E' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10,
  },
  appTitle: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#555', fontSize: 11, marginTop: 2 },
  roleIndicator: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, gap: 6,
  },
  roleEmoji: { fontSize: 14 },
  roleLabel: { fontSize: 12, fontWeight: '700' },
  roleBanner: {
    marginHorizontal: 12, marginBottom: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderLeftWidth: 3,
  },
  roleBannerText: { fontSize: 12, fontWeight: '600' },
  calendar: { marginHorizontal: 10, borderRadius: 16, overflow: 'hidden' },
  eventsSection: { flex: 1, marginTop: 12, paddingHorizontal: 14 },
  dateLine: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  dateLabel: { color: '#FFF', fontSize: 14, fontWeight: '600', flex: 1 },
  countBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  countText: { fontSize: 12, fontWeight: '600' },
  list: { paddingBottom: 100 },
  emptyList: { flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 30 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyText: { color: '#555', fontSize: 14, marginBottom: 4 },
  emptyHint: { color: '#444', fontSize: 12 },
  fab: {
    position: 'absolute', bottom: 28, right: 22,
    width: 58, height: 58, borderRadius: 29,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8,
  },
  fabIcon: { color: '#FFF', fontSize: 32, fontWeight: '300', lineHeight: 36 },
});

export default CalendarScreen;
