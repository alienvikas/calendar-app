import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  getShiftDisplayColor,
  getShiftStatusLabel,
  getStatusBadgeColor,
  isShiftUrgent,
  URGENT_COLOR,
} from '../utils/shiftHelpers';

const formatShort = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const EventCard = ({ event: shift, onPress, isDriverMode, onAccept }) => {
  const isMultiDay = shift.endDate && shift.endDate !== shift.startDate;
  const urgent = isShiftUrgent(shift);
  const displayColor = getShiftDisplayColor(shift);
  const statusLabel = getShiftStatusLabel(shift);
  const badgeColor = getStatusBadgeColor(shift);
  const canAccept = isDriverMode && !shift.acceptedByDriver;

  return (
    <View style={[
      styles.card,
      { borderLeftColor: displayColor },
      urgent && styles.urgentCard,
    ]}>
      <TouchableOpacity style={styles.cardBody} onPress={onPress} activeOpacity={0.75}>
        <View style={[styles.dot, { backgroundColor: displayColor }]} />
        <View style={styles.info}>
          {/* Title row */}
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>{shift.title}</Text>
            {urgent && <Text style={styles.urgentBadge}>🔴 Urgent</Text>}
          </View>

          {/* Time */}
          <View style={styles.timeRow}>
            {isMultiDay ? (
              <Text style={styles.time}>
                {formatShort(shift.startDate)} {shift.startTime}  →  {formatShort(shift.endDate)} {shift.endTime}
              </Text>
            ) : (
              <Text style={styles.time}>{shift.startTime} – {shift.endTime}</Text>
            )}
            {!!shift.location && (
              <Text style={styles.location} numberOfLines={1}>  •  {shift.location}</Text>
            )}
          </View>

          {/* Description */}
          {!!shift.description && (
            <Text style={styles.desc} numberOfLines={1}>{shift.description}</Text>
          )}

          {/* Status & badges row */}
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: badgeColor + '22', borderColor: badgeColor + '55' }]}>
              <Text style={[styles.statusText, { color: badgeColor }]}>{statusLabel}</Text>
            </View>
            {isMultiDay && (
              <View style={[styles.statusBadge, { backgroundColor: displayColor + '22', borderColor: displayColor + '44' }]}>
                <Text style={[styles.statusText, { color: displayColor }]}>Multi-day shift</Text>
              </View>
            )}
            {shift.createdBy && (
              <View style={styles.createdByBadge}>
                <Text style={styles.createdByText}>by {shift.createdBy}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Accept button — driver mode only, shift not yet accepted (Rule 3) */}
      {canAccept && (
        <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} activeOpacity={0.8}>
          <Text style={styles.acceptBtnText}>Accept</Text>
        </TouchableOpacity>
      )}
      {isDriverMode && shift.acceptedByDriver && (
        <View style={styles.acceptedTag}>
          <Text style={styles.acceptedTagText}>✓ Accepted</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2A2A3E',
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  urgentCard: {
    borderColor: URGENT_COLOR,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12, marginTop: 4 },
  info: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 8 },
  title: { color: '#FFF', fontSize: 15, fontWeight: '600', flex: 1 },
  urgentBadge: { fontSize: 11, color: URGENT_COLOR, fontWeight: '700' },
  timeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  time: { color: '#888', fontSize: 12 },
  location: { color: '#666', fontSize: 12, flex: 1 },
  desc: { color: '#666', fontSize: 12, marginTop: 3 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  statusBadge: {
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  createdByBadge: {
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: '#1E1E2E',
  },
  createdByText: { fontSize: 10, color: '#555' },

  acceptBtn: {
    backgroundColor: '#2ECC71',
    paddingVertical: 10,
    alignItems: 'center',
  },
  acceptBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  acceptedTag: {
    backgroundColor: '#1A3D2A',
    paddingVertical: 8,
    alignItems: 'center',
  },
  acceptedTagText: { color: '#2ECC71', fontSize: 12, fontWeight: '700' },
});

export default EventCard;
