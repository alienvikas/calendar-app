import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const formatShort = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const EventCard = ({ event, onPress }) => {
  const isMultiDay = event.endDate && event.endDate !== event.startDate;

  return (
    <TouchableOpacity style={[styles.card, { borderLeftColor: event.color }]} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.dot, { backgroundColor: event.color }]} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
        <View style={styles.timeRow}>
          {isMultiDay ? (
            <Text style={styles.time}>
              {formatShort(event.startDate)} {event.startTime}  →  {formatShort(event.endDate)} {event.endTime}
            </Text>
          ) : (
            <Text style={styles.time}>
              {event.startTime} – {event.endTime}
            </Text>
          )}
          {!!event.location && <Text style={styles.location} numberOfLines={1}>  •  {event.location}</Text>}
        </View>
        {!!event.description && <Text style={styles.desc} numberOfLines={1}>{event.description}</Text>}
        {isMultiDay && (
          <View style={[styles.multiDayBadge, { backgroundColor: event.color + '22' }]}>
            <Text style={[styles.multiDayText, { color: event.color }]}>Multi-day shift</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#2A2A3E',
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 10,
    padding: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12, marginTop: 4 },
  info: { flex: 1 },
  title: { color: '#FFF', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  timeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  time: { color: '#888', fontSize: 12 },
  location: { color: '#666', fontSize: 12, flex: 1 },
  desc: { color: '#666', fontSize: 12, marginTop: 3 },
  multiDayBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  multiDayText: { fontSize: 10, fontWeight: '700' },
});

export default EventCard;
