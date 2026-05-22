import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { getShiftDisplayColor } from '../utils/shiftHelpers';

// ── Layout constants ──────────────────────────────────────────────────────────
const HOUR_W   = 52;   // px per 1-hour column
const ROW_H    = 40;   // px per shift row
const DAY_H    = 36;   // day header height
const HR_H     = 26;   // hour-label row height
const BAR_GAP  = 3;    // gap around each bar

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeToH(t = '00:00') {
  const [h = 0, m = 0] = (t || '00:00').split(':').map(Number);
  return h + m / 60;
}

function formatDayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

// Collect every calendar date spanned by at least one shift
function collectDates(events) {
  const set = new Set();
  Object.values(events).flat().forEach((shift) => {
    const start = shift.startDate || shift.date;
    const end   = shift.endDate   || start;
    if (!start) return;
    let cur = start;
    let n = 0;
    while (cur <= end && n++ < 366) {
      set.add(cur);
      const d = new Date(cur + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      cur = d.toISOString().split('T')[0];
    }
  });
  return Array.from(set).sort();
}

// Greedy row-packing (like a 1-D interval scheduler)
function packRows(items) {
  const sorted = [...items].sort((a, b) => a.startH - b.startH);
  const rows = [];   // [{ nextFree, items }]
  for (const item of sorted) {
    let placed = false;
    for (const row of rows) {
      if (row.nextFree <= item.startH + 0.05) {
        row.items.push(item);
        row.nextFree = item.endH;
        placed = true;
        break;
      }
    }
    if (!placed) rows.push({ items: [item], nextFree: item.endH });
  }
  return rows.map((r) => r.items);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ShiftBar({ shift, startH, endH, rowIdx, onPress }) {
  const color  = getShiftDisplayColor(shift);
  const left   = startH * HOUR_W + BAR_GAP;
  const width  = Math.max((endH - startH) * HOUR_W - BAR_GAP * 2, 12);
  const top    = rowIdx * ROW_H + BAR_GAP;
  const height = ROW_H - BAR_GAP * 2;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress?.(shift)}
      style={[styles.bar, { left, width, top, height, backgroundColor: color, borderLeftColor: lighten(color) }]}
    >
      <Text style={styles.barTitle} numberOfLines={1}>{shift.title}</Text>
      {width > 80 && (
        <Text style={styles.barTime} numberOfLines={1}>
          {shift.startTime}–{shift.endTime}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// Lighten a hex color slightly for the left border accent
function lighten(hex) {
  try {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, ((n >> 16) & 0xff) + 50);
    const g = Math.min(255, ((n >> 8)  & 0xff) + 50);
    const b = Math.min(255, ((n)       & 0xff) + 50);
    return `rgb(${r},${g},${b})`;
  } catch {
    return '#fff';
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TimelineView({ events, roleColor, onShiftPress }) {
  const dates = useMemo(() => collectDates(events), [events]);

  // Map each shift to its absolute timeline position (hours from timeline origin)
  const items = useMemo(() => {
    const idx = Object.fromEntries(dates.map((d, i) => [d, i]));
    return Object.values(events).flat().flatMap((shift) => {
      const sd = shift.startDate || shift.date;
      const ed = shift.endDate   || sd;
      if (!sd || idx[sd] == null) return [];
      const di = idx[sd];
      const de = idx[ed] ?? di;
      const startH = di * 24 + timeToH(shift.startTime);
      const endH   = de * 24 + timeToH(shift.endTime || shift.startTime);
      return [{ shift, startH, endH: Math.max(endH, startH + 0.5) }];
    });
  }, [events, dates]);

  const rows      = useMemo(() => packRows(items), [items]);
  const totalW    = dates.length * 24 * HOUR_W;
  const gridH     = Math.max(rows.length * ROW_H, ROW_H * 3);

  // Current-time marker
  const today = new Date().toISOString().split('T')[0];
  const todayIdx = dates.indexOf(today);
  const now = new Date();
  const nowX = todayIdx >= 0
    ? (todayIdx * 24 + now.getHours() + now.getMinutes() / 60) * HOUR_W
    : -1;

  if (dates.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyTitle}>No shifts to display</Text>
        <Text style={styles.emptyHint}>Add shifts using the + button</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      style={styles.hScroll}
      contentContainerStyle={{ minWidth: totalW }}
    >
      <View style={{ width: totalW }}>

        {/* ── Day header row ── */}
        <View style={styles.dayRow}>
          {dates.map((date) => (
            <View
              key={date}
              style={[
                styles.dayCell,
                { backgroundColor: date === today ? roleColor + 'CC' : '#252535' },
              ]}
            >
              <Text style={[styles.dayLabel, date === today && styles.dayLabelToday]}>
                {formatDayLabel(date)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Hour label row ── */}
        <View style={styles.hourRow}>
          {dates.flatMap((date, di) =>
            Array.from({ length: 24 }, (_, h) => (
              <View key={`${di}-${h}`} style={[styles.hourCell, h === 23 && styles.hourCellLast]}>
                <Text style={styles.hourLabel}>{String(h + 1).padStart(2, '0')}</Text>
              </View>
            )),
          )}
        </View>

        {/* ── Grid + bars ── */}
        <View style={[styles.grid, { height: gridH }]}>

          {/* Alternating column backgrounds */}
          {dates.flatMap((_, di) =>
            Array.from({ length: 24 }, (_, h) => (
              <View
                key={`col-${di}-${h}`}
                style={[
                  styles.gridCol,
                  {
                    left: (di * 24 + h) * HOUR_W,
                    height: gridH,
                    backgroundColor: h % 2 === 0 ? '#1C1C2E' : '#191928',
                    borderRightColor: h === 23 ? '#44445A' : '#252540',
                  },
                ]}
              />
            )),
          )}

          {/* Horizontal row separators */}
          {Array.from({ length: rows.length + 1 }, (_, i) => (
            <View
              key={`sep-${i}`}
              style={[styles.rowSep, { top: i * ROW_H, width: totalW }]}
            />
          ))}

          {/* Shift bars */}
          {rows.map((row, ri) =>
            row.map(({ shift, startH, endH }) => (
              <ShiftBar
                key={shift.id}
                shift={shift}
                startH={startH}
                endH={endH}
                rowIdx={ri}
                onPress={onShiftPress}
              />
            )),
          )}

          {/* Current-time marker */}
          {nowX > 0 && (
            <View style={[styles.nowLine, { left: nowX, height: gridH }]} />
          )}
        </View>

      </View>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  hScroll: { flex: 1, backgroundColor: '#12121E' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { color: '#666', fontSize: 15, fontWeight: '600' },
  emptyHint: { color: '#444', fontSize: 12 },

  // Day header
  dayRow: { flexDirection: 'row' },
  dayCell: {
    width: 24 * HOUR_W,
    height: DAY_H,
    justifyContent: 'center',
    paddingLeft: 10,
    borderRightWidth: 1,
    borderRightColor: '#44445A',
  },
  dayLabel: { color: '#999', fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  dayLabelToday: { color: '#FFF', fontSize: 12 },

  // Hour row
  hourRow: {
    flexDirection: 'row',
    backgroundColor: '#1E1E30',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333348',
  },
  hourCell: {
    width: HOUR_W,
    height: HR_H,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#252540',
  },
  hourCellLast: { borderRightColor: '#44445A', borderRightWidth: 2 },
  hourLabel: { color: '#555', fontSize: 9, fontWeight: '700' },

  // Grid
  grid: { position: 'relative', overflow: 'hidden' },
  gridCol: { position: 'absolute', width: HOUR_W, borderRightWidth: 1 },
  rowSep: { position: 'absolute', height: 1, backgroundColor: '#252540' },

  // Shift bar
  bar: {
    position: 'absolute',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    justifyContent: 'center',
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  barTitle: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  barTime: { color: 'rgba(255,255,255,0.7)', fontSize: 9, marginTop: 1 },

  // Current-time marker
  nowLine: {
    position: 'absolute',
    width: 2,
    backgroundColor: '#FF3B3B',
    opacity: 0.85,
  },
});
