import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const EventCard = ({ event, onPress }) => (
  <TouchableOpacity style={[styles.card, { borderLeftColor: event.color }]} onPress={onPress} activeOpacity={0.75}>
    <View style={[styles.dot, { backgroundColor: event.color }]} />
    <View style={styles.info}>
      <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
      <Text style={styles.time}>
        {event.startTime} - {event.endTime}
        {event.location ? `  •  ${event.location}` : ''}
      </Text>
      {!!event.description && (
        <Text style={styles.desc} numberOfLines={1}>{event.description}</Text>
      )}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A3E',
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
    marginTop: 2,
  },
  info: { flex: 1 },
  title: { color: '#FFF', fontSize: 15, fontWeight: '600', marginBottom: 3 },
  time: { color: '#888', fontSize: 12 },
  desc: { color: '#666', fontSize: 12, marginTop: 3 },
});

export default EventCard;
