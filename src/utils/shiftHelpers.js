export const PENDING_MS = 30 * 60 * 1000; // 30 minutes
export const URGENT_HOURS = 24;
export const URGENT_COLOR = '#E74C3C';
export const PENDING_COLOR = '#555566';

/** 'pending' for first 30 min after creation, then 'active' */
export const getShiftStatus = (shift) => {
  if (!shift.createdAt) return 'active'; // legacy shifts
  return Date.now() - shift.createdAt >= PENDING_MS ? 'active' : 'pending';
};

/** True when shift is active AND starts within the next 24 hours */
export const isShiftUrgent = (shift) => {
  if (getShiftStatus(shift) !== 'active') return false;
  if (!shift.startDate) return false;
  const startDT = new Date(`${shift.startDate}T${shift.startTime || '00:00'}:00`);
  const hrs = (startDT - Date.now()) / 3_600_000;
  return hrs >= 0 && hrs <= URGENT_HOURS;
};

/** Color to use on the calendar and card */
export const getShiftDisplayColor = (shift) => {
  if (isShiftUrgent(shift)) return URGENT_COLOR;
  if (getShiftStatus(shift) === 'pending') return PENDING_COLOR;
  return shift.color || '#4A90D9';
};

/** Human-readable status label */
export const getShiftStatusLabel = (shift) => {
  if (shift.acceptedByDriver) return 'Accepted';
  const status = getShiftStatus(shift);
  if (status === 'pending') {
    const remaining = Math.ceil((PENDING_MS - (Date.now() - shift.createdAt)) / 60000);
    return `Pending · active in ${remaining}m`;
  }
  return isShiftUrgent(shift) ? 'Urgent' : 'Active';
};

/** Badge color for the status label */
export const getStatusBadgeColor = (shift) => {
  if (shift.acceptedByDriver) return '#2ECC71';
  if (getShiftStatus(shift) === 'pending') return '#888';
  if (isShiftUrgent(shift)) return URGENT_COLOR;
  return '#4A90D9';
};
