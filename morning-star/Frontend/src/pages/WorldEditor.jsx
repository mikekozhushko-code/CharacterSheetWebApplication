import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWorldBuilder } from "../context/WorldBuilderContext";
import Sidebar from "../components/worldbuilder/Sidebar";
import CardModal from "../components/worldbuilder/CardModal";
import Header from "../components/Header";

const CARD_TYPE_OPTIONS = [
  { value: "character", label: "👤 Персонаж" },
  { value: "location",  label: "📍 Локація" },
  { value: "map",       label: "🗺️ Карта" },
  { value: "creature",  label: "🐉 Істота" },
  { value: "weapon",    label: "⚔️ Зброя" },
  { value: "item",      label: "🎒 Предмет" },
  { value: "faction",   label: "⚑ Фракція" },
  { value: "event",     label: "📅 Подія" },
  { value: "other",     label: "📄 Інше" },
];

export default function WorldEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    activeWorld, loading,
    fetchWorld, fetchCard, setActiveCard,
    createCard, createFolder,
  } = useWorldBuilder();

  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [cardForm, setCardForm] = useState({ name: "", card_type: "other", folder: "" });
  const [folderForm, setFolderForm] = useState({ name: "", parent: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchWorld(id);
    setActiveCard(null);
  }, [id]);

  const handleCardClick = async (card) => {
    await fetchCard(id, card.id);
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        name: cardForm.name,
        card_type: cardForm.card_type,
        folder: cardForm.folder || null,
      };
      const card = await createCard(id, payload);
      await fetchCard(id, card.id);
      setShowAddCard(false);
      setCardForm({ name: "", card_type: "other", folder: "" });
    } finally {
      setCreating(false);
    }
  };

  const handleAddFolder = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createFolder(id, {
        name: folderForm.name,
        parent: folderForm.parent || null,
      });
      setShowAddFolder(false);
      setFolderForm({ name: "", parent: "" });
    } finally {
      setCreating(false);
    }
  };

  // Плоский список папок для select-ів
  const flatFolders = [];
  const flattenFolders = (folders, depth = 0) => {
    folders?.forEach((f) => {
      flatFolders.push({ ...f, _depth: depth });
      flattenFolders(f.children, depth + 1);
    });
  };
  flattenFolders(activeWorld?.folders);

  if (loading && !activeWorld) {
    return <div className="wb-loading-full">Завантаження...</div>;
  }

  if (!activeWorld) return null;

  return (
    <div className="wb-editor-wrapper">
      <Header />
      <div className="wb-editor">
      {/* Назад */}
      <div className="wb-editor-topbar">
        <button className="wb-btn-ghost" onClick={() => navigate("/worldbuilder")}>
          ← Мої світи
        </button>
        <span className="wb-editor-world-name">{activeWorld.name}</span>
      </div>

      <div className="wb-editor-layout">
        {/* Сайдбар */}
        <Sidebar
          world={activeWorld}
          onCardClick={handleCardClick}
          onAddCard={() => setShowAddCard(true)}
          onAddFolder={() => setShowAddFolder(true)}
        />

        {/* Центральна зона */}
        <main className="wb-editor-main">
          <CardModal worldId={activeWorld.id} folders={flatFolders} />
        </main>
      </div>

      {/* Модалка — нова карточка */}
      {showAddCard && (
        <div className="wb-modal-overlay" onClick={() => setShowAddCard(false)}>
          <div className="wb-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Нова карточка</h2>
            <form onSubmit={handleAddCard}>
              <label>Назва
                <input
                  type="text"
                  value={cardForm.name}
                  onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                  placeholder="Ім'я персонажа, назва локації..."
                  autoFocus
                  required
                />
              </label>
              <label>Тип
                <select
                  value={cardForm.card_type}
                  onChange={(e) => setCardForm({ ...cardForm, card_type: e.target.value })}
                >
                  {CARD_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
              <label>Папка
                <select
                  value={cardForm.folder}
                  onChange={(e) => setCardForm({ ...cardForm, folder: e.target.value })}
                >
                  <option value="">— Без папки —</option>
                  {flatFolders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {"  ".repeat(f._depth)}{f.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="wb-modal-actions">
                <button type="button" className="wb-btn-ghost" onClick={() => setShowAddCard(false)}>
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

      {/* Модалка — нова папка */}
      {showAddFolder && (
        <div className="wb-modal-overlay" onClick={() => setShowAddFolder(false)}>
          <div className="wb-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Нова папка</h2>
            <form onSubmit={handleAddFolder}>
              <label>Назва
                <input
                  type="text"
                  value={folderForm.name}
                  onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                  placeholder="Назва папки..."
                  autoFocus
                  required
                />
              </label>
              <label>Вкладена в папку
                <select
                  value={folderForm.parent}
                  onChange={(e) => setFolderForm({ ...folderForm, parent: e.target.value })}
                >
                  <option value="">— Коренева папка —</option>
                  {flatFolders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {"  ".repeat(f._depth)}{f.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="wb-modal-actions">
                <button type="button" className="wb-btn-ghost" onClick={() => setShowAddFolder(false)}>
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
    </div>
  );
}