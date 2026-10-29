const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'labatna_session_id';
const GameDayContext = createContext(null);

export function GameDayProvider({ children }) {
  const [session, setSession] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async (sessionId) => {
    if (!sessionId) {
      setEvents([]);
      return [];
    }
    const result = await db.entities.GameEvent.filter({ session_id: sessionId }, { sort: 'created_date', limit: 200 });
    const items = Array.isArray(result) ? result : result.items || [];
    setEvents(items);
    return items;
  }, []);

  useEffect(() => {
    let alive = true;
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (!storedId) {
      setLoading(false);
      return () => {
        alive = false;
      };
    }
    (async () => {
      try {
        const found = await db.entities.GameSession.get(storedId);
        if (!alive) return;
        setSession(found);
        await loadEvents(storedId);
      } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [loadEvents]);

  const startSession = useCallback(async (data) => {
    const created = await db.entities.GameSession.create({
      status: 'playing',
      current_round: 1,
      rules_acknowledged: false,
      ...data,
    });
    localStorage.setItem(STORAGE_KEY, created.id);
    setSession(created);
    setEvents([]);
    return created;
  }, []);

  const updateSession = useCallback(
    async (patch) => {
      if (!session) return null;
      const updated = await db.entities.GameSession.update(session.id, patch);
      setSession(updated);
      return updated;
    },
    [session]
  );

  const addEvent = useCallback(
    async (payload) => {
      if (!session) return null;
      const created = await db.entities.GameEvent.create({
        session_id: session.id,
        game_key: session.game_key,
        round_number: session.current_round,
        status: 'confirmed',
        source: 'host',
        ...payload,
      });
      await loadEvents(session.id);
      return created;
    },
    [session, loadEvents]
  );

  const removeEvent = useCallback(
    async (id) => {
      await db.entities.GameEvent.delete(id);
      await loadEvents(session?.id);
    },
    [session, loadEvents]
  );

  const confirmEvent = useCallback(
    async (id) => {
      await db.entities.GameEvent.update(id, { status: 'confirmed', source: 'host' });
      await loadEvents(session?.id);
    },
    [session, loadEvents]
  );

  const clearEvents = useCallback(async () => {
    if (!session) return;
    await db.entities.GameEvent.deleteMany({ session_id: session.id });
    setEvents([]);
  }, [session]);

  const resetSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setEvents([]);
  }, []);

  const value = useMemo(
    () => ({
      session,
      events,
      loading,
      startSession,
      updateSession,
      addEvent,
      removeEvent,
      confirmEvent,
      clearEvents,
      resetSession,
      refreshEvents: () => loadEvents(session?.id),
    }),
    [session, events, loading, startSession, updateSession, addEvent, removeEvent, confirmEvent, clearEvents, resetSession, loadEvents]
  );

  return <GameDayContext.Provider value={value}>{children}</GameDayContext.Provider>;
}

export function useGameDay() {
  const context = useContext(GameDayContext);
  if (!context) throw new Error('useGameDay must be used inside GameDayProvider');
  return context;
}