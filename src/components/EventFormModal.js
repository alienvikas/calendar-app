import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

const COLORS = ['#4A90D9', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#EC407A'];

const formatDisplay = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const toMinutes = (t = '') => {
  const parts = t.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

const EventFormModal = ({
  visible, onClose, onSave, onDelete, initialEvent, date,
  roleColor = '#4A90D9', roleLabel = '', isDriverMode = false,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(date || '');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState(date || '');
  const [endTime, setEndTime] = useState('10:00');
  const [color, setColor] = useState(roleColor);
  const [location, setLocation] = useState('');
  const [activePicker, setActivePicker] = useState(null);

  const isEditing = !!initialEvent;

  useEffect(() => {
    if (!visible) {
      setActivePicker(null);
      return;
    }
    if (initialEvent) {
      setTitle(initialEvent.title || '');
      setDescription(initialEvent.description || '');
      setStartDate(initialEvent.startDate || date || '');
      setStartTime(initialEvent.startTime || '09:00');
      setEndDate(initialEvent.endDate || initialEvent.startDate || date || '');
      setEndTime(initialEvent.endTime || '10:00');
      setColor(initialEvent.color || roleColor);
      setLocation(initialEvent.location || '');
    } else {
      setTitle('');
      setDescription('');
      setStartDate(date || '');
      setStartTime('09:00');
      setEndDate(date || '');
      setEndTime('10:00');
      setColor(roleColor);
      setLocation('');
    }
    setActivePicker(null);
  }, [initialEvent, visible, date, roleColor]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a shift title.');
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      Alert.alert('Invalid Date', 'End date cannot be before start date.');
      return;
    }
    if (startDate && endDate && startDate === endDate) {
      const sm = toMinutes(startTime);
      const em = toMinutes(endTime);
      if (em <= sm) {
        Alert.alert('Invalid Time', 'End time must be after start time.');
        return;
      }
    }
    onSave({
      title: title.trim(),
      description,
      startDate: startDate || date,
      startTime,
      endDate: endDate || date,
      endTime,
      color,
      location,
    });
  };

  const handleDelete = () => {
    Alert.alert('Delete Shift', 'Are you sure you want to delete this shift?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  const handleStartDateSelect = (day) => {
    setStartDate(day.dateString);
    if (endDate < day.dateString) setEndDate(day.dateString);
    setActivePicker(null);
  };

  const handleEndDateSelect = (day) => {
    if (day.dateString < startDate) {
      Alert.alert('Invalid', 'End date cannot be before start date.');
      return;
    }
    setEndDate(day.dateString);
    setActivePicker(null);
  };

  const markedStart = startDate ? { [startDate]: { selected: true, selectedColor: roleColor } } : {};
  const markedEnd   = endDate   ? { [endDate]:   { selected: true, selectedColor: roleColor } } : {};

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      {/*
        Outer overlay: fills screen, dark background.
        justifyContent="flex-end" pushes the sheet to the bottom.
        No TouchableOpacity backdrop on top of the sheet — eliminates touch conflicts.
      */}
      <View style={styles.overlay}>
        <View style={styles.sheet}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isEditing ? 'Edit Shift' : `New ${roleLabel} Shift`}
            </Text>
            {!isDriverMode
              ? <TouchableOpacity onPress={handleSave} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Text style={[styles.headerSave, { color: roleColor }]}>Save</Text>
                </TouchableOpacity>
              : <Text style={styles.viewOnly}>View only</Text>
            }
          </View>

          {/* Scrollable form */}
          <ScrollView
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View style={[styles.colorBar, { backgroundColor: roleColor }]} />

            {/* Driver banner */}
            {isDriverMode && (
              <View style={styles.driverBanner}>
                <Text style={styles.driverBannerText}>
                  🚚  Driver view — use the Accept button on the card to accept this shift.
                </Text>
              </View>
            )}

            {/* Title */}
            <View style={styles.field}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Shift title"
                editable={!isDriverMode}
                placeholderTextColor="#555"
                maxLength={80}
                returnKeyType="done"
              />
            </View>

            {/* Start */}
            <Text style={styles.sectionTitle}>Start</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={[styles.dateBtn, activePicker === 'start' && { borderColor: roleColor }]}
                onPress={() => !isDriverMode && setActivePicker(activePicker === 'start' ? null : 'start')}
              >
                <Text style={styles.dateBtnIcon}>📅</Text>
                <Text style={styles.dateBtnText}>{formatDisplay(startDate)}</Text>
              </TouchableOpacity>
              <View style={styles.timeBox}>
                <Text style={styles.timeLabel}>Time</Text>
                <TextInput
                  style={styles.timeInput}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="09:00"
                  placeholderTextColor="#555"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  editable={!isDriverMode}
                />
              </View>
            </View>

            {activePicker === 'start' && (
              <View style={styles.calendarPicker}>
                <Calendar
                  current={startDate}
                  onDayPress={handleStartDateSelect}
                  markedDates={markedStart}
                  theme={calTheme(roleColor)}
                  style={styles.inlineCalendar}
                />
              </View>
            )}

            {/* End */}
            <Text style={[styles.sectionTitle, { marginTop: 14 }]}>End</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={[styles.dateBtn, activePicker === 'end' && { borderColor: roleColor }]}
                onPress={() => !isDriverMode && setActivePicker(activePicker === 'end' ? null : 'end')}
              >
                <Text style={styles.dateBtnIcon}>📅</Text>
                <Text style={styles.dateBtnText}>{formatDisplay(endDate)}</Text>
              </TouchableOpacity>
              <View style={styles.timeBox}>
                <Text style={styles.timeLabel}>Time</Text>
                <TextInput
                  style={styles.timeInput}
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="10:00"
                  placeholderTextColor="#555"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  editable={!isDriverMode}
                />
              </View>
            </View>

            {activePicker === 'end' && (
              <View style={styles.calendarPicker}>
                <Calendar
                  current={endDate}
                  onDayPress={handleEndDateSelect}
                  markedDates={markedEnd}
                  minDate={startDate}
                  theme={calTheme(roleColor)}
                  style={styles.inlineCalendar}
                />
              </View>
            )}

            {/* Duration summary */}
            {startDate && endDate && (
              <View style={[styles.durationBadge, { backgroundColor: roleColor + '18', borderColor: roleColor + '40' }]}>
                <Text style={[styles.durationText, { color: roleColor }]}>
                  {startDate === endDate
                    ? `Same day  •  ${startTime} → ${endTime}`
                    : `${startDate} ${startTime}  →  ${endDate} ${endTime}`}
                </Text>
              </View>
            )}

            {/* Location */}
            <View style={[styles.field, { marginTop: 16 }]}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Add location (optional)"
                editable={!isDriverMode}
                placeholderTextColor="#555"
              />
            </View>

            {/* Notes */}
            <View style={styles.field}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Add notes (optional)"
                editable={!isDriverMode}
                placeholderTextColor="#555"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Color */}
            {!isDriverMode && (
              <View style={styles.field}>
                <Text style={styles.label}>Color</Text>
                <View style={styles.colorRow}>
                  {COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorSelected]}
                      onPress={() => setColor(c)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Primary save button at bottom of form */}
            {!isDriverMode && (
              <TouchableOpacity
                style={[styles.savePrimaryBtn, { backgroundColor: roleColor }]}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Text style={styles.savePrimaryText}>
                  {isEditing ? 'Update Shift' : 'Save Shift'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Delete */}
            {isEditing && !isDriverMode && !initialEvent?.acceptedByDriver && (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Text style={styles.deleteBtnText}>Delete Shift</Text>
              </TouchableOpacity>
            )}

            {/* Locked */}
            {isEditing && !isDriverMode && initialEvent?.acceptedByDriver && (
              <View style={styles.lockedBanner}>
                <Text style={styles.lockedText}>🔒 This shift has been accepted by a driver and cannot be deleted.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const calTheme = (roleColor) => ({
  backgroundColor: '#252535',
  calendarBackground: '#252535',
  textSectionTitleColor: '#666',
  selectedDayBackgroundColor: roleColor,
  selectedDayTextColor: '#fff',
  todayTextColor: roleColor,
  dayTextColor: '#CCC',
  textDisabledColor: '#444',
  arrowColor: roleColor,
  monthTextColor: '#FFF',
  textDayFontSize: 13,
  textMonthFontSize: 14,
  textDayHeaderFontSize: 11,
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1E1E2E',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E42',
  },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  cancel: { color: '#777', fontSize: 15 },
  headerSave: { fontSize: 15, fontWeight: '700' },
  viewOnly: { color: '#555', fontSize: 13, fontStyle: 'italic' },

  body: { padding: 18, paddingBottom: 50 },
  colorBar: { height: 4, borderRadius: 2, marginBottom: 18 },

  driverBanner: {
    backgroundColor: '#1A2A1A', borderRadius: 10, padding: 12,
    borderLeftWidth: 3, borderLeftColor: '#2ECC71', marginBottom: 16,
  },
  driverBannerText: { color: '#2ECC71', fontSize: 12, lineHeight: 18 },

  field: { marginBottom: 14 },
  label: { color: '#666', fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 },
  input: {
    backgroundColor: '#252535', color: '#FFF',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
  },
  textarea: { minHeight: 72, paddingTop: 12 },

  sectionTitle: {
    color: '#888', fontSize: 12, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
  },
  dateTimeRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  dateBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#252535', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  dateBtnIcon: { fontSize: 16 },
  dateBtnText: { color: '#DDD', fontSize: 13, flex: 1 },
  timeBox: {
    width: 100, backgroundColor: '#252535', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center',
  },
  timeLabel: { color: '#555', fontSize: 10, marginBottom: 4, textTransform: 'uppercase' },
  timeInput: { color: '#FFF', fontSize: 18, fontWeight: '600', textAlign: 'center', padding: 0 },

  calendarPicker: {
    marginBottom: 10, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#2E2E42',
  },
  inlineCalendar: { borderRadius: 12 },

  durationBadge: {
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, marginBottom: 4, alignItems: 'center',
  },
  durationText: { fontSize: 12, fontWeight: '600' },

  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorDot: { width: 30, height: 30, borderRadius: 15 },
  colorSelected: { borderWidth: 3, borderColor: '#FFF', transform: [{ scale: 1.15 }] },

  savePrimaryBtn: {
    borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 4,
  },
  savePrimaryText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  deleteBtn: {
    marginTop: 8, backgroundColor: '#3D1A1A',
    borderRadius: 10, padding: 14, alignItems: 'center',
  },
  deleteBtnText: { color: '#E74C3C', fontSize: 15, fontWeight: '600' },

  lockedBanner: {
    marginTop: 8, backgroundColor: '#1A1A2A', borderRadius: 10,
    padding: 12, borderLeftWidth: 3, borderLeftColor: '#555',
  },
  lockedText: { color: '#666', fontSize: 12, lineHeight: 18 },
});

export default EventFormModal;
