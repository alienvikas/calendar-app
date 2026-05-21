import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ROLE_LIST } from '../config/roles';

const RoleTabBar = ({ activeRole, onSelect }) => (
  <View style={styles.container}>
    {ROLE_LIST.map((role) => {
      const isActive = activeRole === role.key;
      return (
        <TouchableOpacity
          key={role.key}
          style={[styles.tab, isActive && { backgroundColor: role.color }]}
          onPress={() => onSelect(role.key)}
          activeOpacity={0.75}
        >
          <Text style={styles.emoji}>{role.emoji}</Text>
          <Text style={[styles.label, isActive && styles.labelActive]}>
            {role.label}
          </Text>
          {isActive && <View style={[styles.dot, { backgroundColor: '#fff' }]} />}
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginBottom: 10,
    backgroundColor: '#1E1E2E',
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 11,
    gap: 2,
  },
  emoji: { fontSize: 18 },
  label: { color: '#777', fontSize: 11, fontWeight: '600' },
  labelActive: { color: '#fff' },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});

export default RoleTabBar;
