import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { loadRoleEvents, saveRoleEvents } from '../utils/storage';

const EventContext = createContext(null);

const STORAGE_ROLES = ['manager', 'retailer'];

export const EventProvider = ({ children }) => {
  const [allEvents, setAllEvents] = useState({ manager: {}, retailer: {} });
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);
  const allEventsRef = useRef(allEvents);

  useEffect(() => {
    allEventsRef.current = allEvents;
  }, [allEvents]);

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

  // Persist to AsyncStorage after every committed state change (not during initial load)
  useEffect(() => {
    if (loading) return;
    STORAGE_ROLES.forEach((role) => {
      saveRoleEvents(role, allEvents[role] || {});
    });
  }, [allEvents, loading]);

  const addEvent = useCallback((role, date, event) => {
    if (role === 'driver') return;
    setAllEvents((prev) => {
      const roleEvents = prev[role] || {};
      const dayEvents = roleEvents[date] ? [...roleEvents[date], event] : [event];
      return { ...prev, [role]: { ...roleEvents, [date]: dayEvents } };
    });
  }, []);

  const updateEvent = useCallback((role, date, updatedEvent) => {
    if (role === 'driver') return;
    setAllEvents((prev) => {
      const roleEvents = prev[role] || {};
      const newDate = updatedEvent.startDate || date;
      if (newDate !== date) {
        // Move event to the new date bucket
        const re = { ...roleEvents };
        const oldDay = (re[date] || []).filter((e) => e.id !== updatedEvent.id);
        if (oldDay.length === 0) delete re[date];
        else re[date] = oldDay;
        re[newDate] = [...(re[newDate] || []), updatedEvent];
        return { ...prev, [role]: re };
      }
      const dayEvents = (roleEvents[date] || []).map((e) =>
        e.id === updatedEvent.id ? updatedEvent : e
      );
      return { ...prev, [role]: { ...roleEvents, [date]: dayEvents } };
    });
  }, []);

  const deleteEvent = useCallback((role, date, eventId) => {
    if (role === 'driver') return;
    // Check acceptedByDriver before touching state (Alert must not be called inside an updater)
    const existing = ((allEventsRef.current[role] || {})[date] || []).find((e) => e.id === eventId);
    if (existing?.acceptedByDriver) {
      Alert.alert('Cannot Delete', 'This shift has been accepted by a driver and cannot be deleted.');
      return;
    }
    setAllEvents((prev) => {
      const re = { ...(prev[role] || {}) };
      const dayEvents = (re[date] || []).filter((e) => e.id !== eventId);
      if (dayEvents.length === 0) delete re[date];
      else re[date] = dayEvents;
      return { ...prev, [role]: re };
    });
  }, []);

  const acceptShift = useCallback((createdByRole, date, shiftId) => {
    setAllEvents((prev) => {
      const roleEvents = prev[createdByRole] || {};
      const dayEvents = (roleEvents[date] || []).map((e) =>
        e.id === shiftId ? { ...e, acceptedByDriver: true, acceptedAt: Date.now() } : e
      );
      return { ...prev, [createdByRole]: { ...roleEvents, [date]: dayEvents } };
    });
  }, []);

  return (
    <EventContext.Provider value={{ allEvents, loading, addEvent, updateEvent, deleteEvent, acceptShift }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => useContext(EventContext);
