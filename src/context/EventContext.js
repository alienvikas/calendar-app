import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { loadRoleEvents, saveRoleEvents } from '../utils/storage';

const EventContext = createContext(null);

const ROLES = ['manager', 'driver', 'retailer'];

export const EventProvider = ({ children }) => {
  const [allEvents, setAllEvents] = useState({ manager: {}, driver: {}, retailer: {} });
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    Promise.all(ROLES.map((r) => loadRoleEvents(r).then((e) => [r, e]))).then((results) => {
      const combined = {};
      results.forEach(([role, events]) => { combined[role] = events; });
      setAllEvents(combined);
      setLoading(false);
    });
  }, []);

  const addEvent = useCallback(async (role, date, event) => {
    setAllEvents((prev) => {
      const roleEvents = prev[role] || {};
      const dayEvents = roleEvents[date] ? [...roleEvents[date], event] : [event];
      const updated = { ...prev, [role]: { ...roleEvents, [date]: dayEvents } };
      saveRoleEvents(role, updated[role]);
      return updated;
    });
  }, []);

  const updateEvent = useCallback(async (role, date, updatedEvent) => {
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

  const deleteEvent = useCallback(async (role, date, eventId) => {
    setAllEvents((prev) => {
      const roleEvents = { ...(prev[role] || {}) };
      const dayEvents = (roleEvents[date] || []).filter((e) => e.id !== eventId);
      if (dayEvents.length === 0) delete roleEvents[date];
      else roleEvents[date] = dayEvents;
      const updated = { ...prev, [role]: roleEvents };
      saveRoleEvents(role, updated[role]);
      return updated;
    });
  }, []);

  return (
    <EventContext.Provider value={{ allEvents, loading, addEvent, updateEvent, deleteEvent }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => useContext(EventContext);
