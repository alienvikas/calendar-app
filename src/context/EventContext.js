import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadEvents, saveEvents } from '../utils/storage';

const EventContext = createContext(null);

export const EventProvider = ({ children }) => {
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents().then((stored) => {
      setEvents(stored);
      setLoading(false);
    });
  }, []);

  const addEvent = useCallback(async (dateString, event) => {
    setEvents((prev) => {
      const dayEvents = prev[dateString] ? [...prev[dateString], event] : [event];
      const updated = { ...prev, [dateString]: dayEvents };
      saveEvents(updated);
      return updated;
    });
  }, []);

  const updateEvent = useCallback(async (dateString, updatedEvent) => {
    setEvents((prev) => {
      const dayEvents = (prev[dateString] || []).map((e) =>
        e.id === updatedEvent.id ? updatedEvent : e
      );
      const updated = { ...prev, [dateString]: dayEvents };
      saveEvents(updated);
      return updated;
    });
  }, []);

  const deleteEvent = useCallback(async (dateString, eventId) => {
    setEvents((prev) => {
      const dayEvents = (prev[dateString] || []).filter((e) => e.id !== eventId);
      const updated = { ...prev, [dateString]: dayEvents };
      if (dayEvents.length === 0) delete updated[dateString];
      saveEvents(updated);
      return updated;
    });
  }, []);

  const moveEvent = useCallback(async (oldDate, newDate, event) => {
    setEvents((prev) => {
      const oldDay = (prev[oldDate] || []).filter((e) => e.id !== event.id);
      const newDay = prev[newDate] ? [...prev[newDate], event] : [event];
      const updated = { ...prev, [oldDate]: oldDay, [newDate]: newDay };
      if (oldDay.length === 0) delete updated[oldDate];
      saveEvents(updated);
      return updated;
    });
  }, []);

  return (
    <EventContext.Provider value={{ events, loading, addEvent, updateEvent, deleteEvent, moveEvent }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => useContext(EventContext);
