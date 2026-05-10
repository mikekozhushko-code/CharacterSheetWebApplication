import React, { createContext, useContext, useState, useCallback } from "react";
import { authApi } from "../Api";

const WorldBuilderContext = createContext();

export const WorldBuilderProvider = ({ children }) => {
  const [worlds, setWorlds] = useState([]);
  const [activeWorld, setActiveWorld] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Worlds ──────────────────────────────────────────

  const fetchWorlds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authApi.get("/worlds/");
      setWorlds(res.data);
    } catch (e) {
      setError("Не вдалося завантажити світи");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWorld = useCallback(async (id) => {
    setLoading(true);
    try {
      const res = await authApi.get(`/worlds/${id}/`);
      setActiveWorld(res.data);
    } catch (e) {
      setError("Не вдалося завантажити світ");
    } finally {
      setLoading(false);
    }
  }, []);

  const createWorld = useCallback(async (data) => {
    const res = await authApi.post("/worlds/", data);
    setWorlds((prev) => [res.data, ...prev]);
    return res.data;
  }, []);

  const updateWorld = useCallback(async (id, data) => {
    const res = await authApi.patch(`/worlds/${id}/`, data);
    setActiveWorld((prev) => ({ ...prev, ...res.data }));
    return res.data;
  }, []);

  const deleteWorld = useCallback(async (id) => {
    await authApi.delete(`/worlds/${id}/`);
    setWorlds((prev) => prev.filter((w) => w.id !== id));
    if (activeWorld?.id === id) setActiveWorld(null);
  }, [activeWorld]);

  // ── Folders ─────────────────────────────────────────

  const createFolder = useCallback(async (worldId, data) => {
    const res = await authApi.post(`/worlds/${worldId}/folders/`, data);
    await fetchWorld(worldId);
    return res.data;
  }, [fetchWorld]);

  const updateFolder = useCallback(async (worldId, folderId, data) => {
    const res = await authApi.patch(`/worlds/${worldId}/folders/${folderId}/`, data);
    await fetchWorld(worldId);
    return res.data;
  }, [fetchWorld]);

  const deleteFolder = useCallback(async (worldId, folderId) => {
    await authApi.delete(`/worlds/${worldId}/folders/${folderId}/`);
    await fetchWorld(worldId);
  }, [fetchWorld]);

  // ── Cards ────────────────────────────────────────────

  const fetchCard = useCallback(async (worldId, cardId) => {
    const res = await authApi.get(`/worlds/${worldId}/cards/${cardId}/`);
    setActiveCard(res.data);
    return res.data;
  }, []);

  const createCard = useCallback(async (worldId, data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== null && v !== undefined) formData.append(k, v);
    });
    const res = await authApi.post(`/worlds/${worldId}/cards/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    await fetchWorld(worldId);
    return res.data;
  }, [fetchWorld]);

  const updateCard = useCallback(async (worldId, cardId, data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== null && v !== undefined) formData.append(k, v);
    });
    const res = await authApi.patch(`/worlds/${worldId}/cards/${cardId}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setActiveCard((prev) => ({ ...prev, ...res.data }));
    await fetchWorld(worldId);
    return res.data;
  }, [fetchWorld]);

  const deleteCard = useCallback(async (worldId, cardId) => {
    await authApi.delete(`/worlds/${worldId}/cards/${cardId}/`);
    if (activeCard?.id === cardId) setActiveCard(null);
    await fetchWorld(worldId);
  }, [activeCard, fetchWorld]);

  // ── DnD Sheet ────────────────────────────────────────

  const updateDnDSheet = useCallback(async (worldId, cardId, data) => {
    const res = await authApi.patch(`/worlds/${worldId}/cards/${cardId}/sheet/`, data);
    setActiveCard((prev) => prev ? { ...prev, dnd_sheet: res.data } : prev);
    return res.data;
  }, []);

  return (
    <WorldBuilderContext.Provider value={{
      worlds, activeWorld, activeCard,
      loading, error,
      setActiveCard,
      fetchWorlds, fetchWorld, createWorld, updateWorld, deleteWorld,
      createFolder, updateFolder, deleteFolder,
      fetchCard, createCard, updateCard, deleteCard,
      updateDnDSheet,
    }}>
      {children}
    </WorldBuilderContext.Provider>
  );
};

export const useWorldBuilder = () => useContext(WorldBuilderContext);