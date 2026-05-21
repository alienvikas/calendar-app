import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { loadRoleEvents, saveRoleEvents } from '../utils/storage';

const EventContext = createContext(null);

const STORAGE_ROLES = ['manager', 'retailer']; // driver has no own storage

export const EventProvider = ({ children }) => {
  const [allEvents, setAllEvents] = useState({ manager: {}, retailer: {} });
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    Promise.all(STORAGE_ROLES.map((r) => loadRoleEvents(r).then((e) => [r, e]))).then((results) => {
      const combined = {};
      results.forEach(([role, events]) => { combined[role] = events; });
      setAllEvents(combined);
      setLoading(false);
    });
  }, []);

  /** Add a shift. Only manager/retailer allowed. */
  const addEvent = useCallback(async (role, date, event) => {
    if (role === 'driver') return;
    setAllEvents((prev) => {
      const roleEvents = prev[role] || {};
      const dayEvents = roleEvents[date] ? [...roleEvents[date], event] : [event];
      const updated = { ...prev, [role]: { ...roleEvents, [date]: dayEvents } };
      saveRoleEvents(role, updated[role]);
      return updated;
    });
  }, []);

  /** Update a shift. Only manager/retailer allowed. */
  const updateEvent = useCallback(async (role, date, updatedEvent) => {
    if (role === 'driver') return;
    setAllEvents((prev) => {
      const roleEvents = prev[role] || {};
      const dayEvents = (roleEvents[date] || []).map((e) =>
        e.id === updatedEvent.id ? updatedEvent : e
      );
      const updated = { ...prev, [role]: { ...roleEvents, [date]: dayEvents } };
      saveRoleEvents(role, updated[role]);
      return updated;
    });
  }, []);

  /**
   * Delete a shift. Only manager/retailer allowed.
   * Rule 4: Cannot delete if acceptedByDriver.
   */
  const deleteEvent = useCallback(async (role, date, eventId) => {
    if (role === 'driver') return;
    setAllEvents((prev) => {
      const roleEvents = { ...(prev[role] || {}) };
      const existing = (roleEvents[date] || []).find((e) => e.id === eventId);
      if (existing?.acceptedByDriver) {
        Alert.alert(
          'Cannot Delete',
          'This shift has been accepted by a driver and cannot be deleted.'
        );
        return prev; // no change
      }
      const dayEvents = (roleEvents[date] || []).filter((e) => e.id !== eventId);
      if (dayEvents.length === 0) delete roleEvents[date];
      else roleEvents[date] = dayEvents;
      const updated = { ...prev, [role]: roleEvents };
      saveRoleEvents(role, updated[role]);
      return updated;
    });
  }, []);

  /**
   * Driver accepts a shift.
   * createdByRole is 'manager' or 'retailer' — where the shift actually lives.
   */
  const acceptShift = useCallback(async (createdByRole, date, shiftId) => {
    setAllEvents((prev) => {
      const roleEvents = prev[createdByRole] || {};
      const dayEvents = (roleEvents[date] || []).map((e) =>
        e.id === shiftId ? { ...e, acceptedByDriver: true, acceptedAt: Date.now() } : e
      );
      const updated = { ...prev, [createdByRole]: { ...roleEvents, [date]: dayEvents } };
      saveRoleEvents(createdByRole, updated[createdByRole]);
      return updated;
    });
  }, []);

  return (
    <EventContext.Provider value={{ allEvents, loading, addEvent, updateEvent, deleteEvent, acceptShift }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => useContext(EventContext);
