import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { getShifts, createShift, updateShift, deleteShift, acceptShiftApi } from '../utils/api';

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

  // Load shifts from the database on mount
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    Promise.all(STORAGE_ROLES.map((r) => getShifts(r).then((e) => [r, e])))
      .then((results) => {
        const combined = {};
        results.forEach(([role, events]) => { combined[role] = events; });
        setAllEvents(combined);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load shifts from database:', err.message);
        setLoading(false);
      });
  }, []);

  const addEvent = useCallback((role, date, event) => {
    if (role === 'driver') return;
    // Optimistic local update
    setAllEvents((prev) => {
      const roleEvents = prev[role] || {};
      const dayEvents = roleEvents[date] ? [...roleEvents[date], event] : [event];
      return { ...prev, [role]: { ...roleEvents, [date]: dayEvents } };
    });
    // Persist to database in the background
    createShift(role, date, event).catch((e) =>
      console.error('DB sync error (add):', e.message),
    );
  }, []);

  const updateEvent = useCallback((role, date, updatedEvent) => {
    if (role === 'driver') return;
    const newDate = updatedEvent.startDate || date;
    setAllEvents((prev) => {
      const roleEvents = prev[role] || {};
      if (newDate !== date) {
        const re = { ...roleEvents };
        const oldDay = (re[date] || []).filter((e) => e.id !== updatedEvent.id);
        if (oldDay.length === 0) delete re[date];
        else re[date] = oldDay;
        re[newDate] = [...(re[newDate] || []), updatedEvent];
        return { ...prev, [role]: re };
      }
      const dayEvents = (roleEvents[date] || []).map((e) =>
        e.id === updatedEvent.id ? updatedEvent : e,
      );
      return { ...prev, [role]: { ...roleEvents, [date]: dayEvents } };
    });
    updateShift(role, newDate, updatedEvent).catch((e) =>
      console.error('DB sync error (update):', e.message),
    );
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
    deleteShift(eventId).catch((e) =>
      console.error('DB sync error (delete):', e.message),
    );
  }, []);

  const acceptShift = useCallback((createdByRole, date, shiftId) => {
    setAllEvents((prev) => {
      const roleEvents = prev[createdByRole] || {};
      const dayEvents = (roleEvents[date] || []).map((e) =>
        e.id === shiftId ? { ...e, acceptedByDriver: true, acceptedAt: Date.now() } : e,
      );
      return { ...prev, [createdByRole]: { ...roleEvents, [date]: dayEvents } };
    });
    acceptShiftApi(shiftId).catch((e) =>
      console.error('DB sync error (accept):', e.message),
    );
  }, []);

  return (
    <EventContext.Provider value={{ allEvents, loading, addEvent, updateEvent, deleteEvent, acceptShift }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => useContext(EventContext);
