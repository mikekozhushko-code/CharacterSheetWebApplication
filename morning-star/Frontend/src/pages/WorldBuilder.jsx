import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorldBuilder } from "../context/WorldBuilderContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/worldbuilder.css";

export default function WorldBuilder() {
  const navigate = useNavigate();
  const { worlds, loading, fetchWorlds, createWorld, deleteWorld } = useWorldBuilder();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchWorlds();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const world = await createWorld(form);
      navigate(`/worldbuilder/${world.id}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm("Видалити цей світ? Всі карточки буде втрачено.")) return;
    await deleteWorld(id);
  };

  return (
    <div className="wb-list-wrapper">
      <Header />
      <div className="wb-list-page">
        <div className="wb-list-header">
          <h1>Мої світи</h1>
          <button className="wb-btn-primary" onClick={() => setShowCreate(true)}>
            + Новий світ
          </button>
        </div>

        {loading && <p className="wb-loading">Завантаження...</p>}

        {!loading && worlds.length === 0 && (
          <div className="wb-empty">
            <p>У тебе ще немає жодного світу.</p>
            <button className="wb-btn-primary" onClick={() => setShowCreate(true)}>
              Створити перший світ
            </button>
          </div>
        )}

        <div className="wb-worlds-grid">
          {worlds.map((world) => (
            <div
              key={world.id}
            className="wb-world-card"
            onClick={() => navigate(`/worldbuilder/${world.id}`)}
          >
            {world.cover_image && (
              <img src={world.cover_image} alt={world.name} className="wb-world-cover" />
            )}
            {!world.cover_image && <div className="wb-world-cover-placeholder" />}
            <div className="wb-world-info">
              <h2>{world.name}</h2>
              {world.description && <p>{world.description}</p>}
            </div>
            <button
              className="wb-btn-danger-sm"
              onClick={(e) => handleDelete(e, world.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="wb-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="wb-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Новий світ</h2>
            <form onSubmit={handleCreate}>
              <label>Назва</label>
              <input
                type="text"
                placeholder="Назва світу"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
              />
              <label>Опис</label>
              <textarea
                placeholder="Короткий опис..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
              <div className="wb-modal-actions">
                <button type="button" className="wb-btn-ghost" onClick={() => setShowCreate(false)}>
                  Скасувати
                </button>
                <button type="submit" className="wb-btn-primary" disabled={creating}>
                  {creating ? "Створення..." : "Створити"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
      <Footer />
    </div>
  );
}