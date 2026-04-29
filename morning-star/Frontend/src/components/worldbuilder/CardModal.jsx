import React, { useState, useRef } from "react";
import { useWorldBuilder } from "../../context/WorldBuilderContext";
import DnDSheetForm from "./DnDSheetForm";
import CardBlocks from "./CardBlocks";

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

export default function CardModal({ worldId, folders }) {
  const { activeCard, updateCard } = useWorldBuilder();
  const [editing,   setEditing]   = useState(false);
  const [form,      setForm]      = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const imageRef = useRef();

  if (!activeCard) {
    return (
      <div className="wb-center-empty">
        <p>← Вибери карточку зі списку або створи нову</p>
      </div>
    );
  }

  const startEdit = () => {
    setForm({
      name:               activeCard.name,
      card_type:          activeCard.card_type,
      description:        activeCard.description,
      folder:             activeCard.folder,
      is_visible_in_wiki: activeCard.is_visible_in_wiki,
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (imageRef.current?.files[0]) payload.image = imageRef.current.files[0];
      await updateCard(worldId, activeCard.id, payload);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const isCharacter = activeCard.card_type === "character";

  const tabs = [
    { key: "info",   label: "Інформація" },
    { key: "blocks", label: "📋 Блоки" },
    ...(isCharacter ? [{ key: "sheet", label: "D&D Бланк" }] : []),
  ];

  return (
    <div className="wb-card-view">
      {/* Шапка */}
      <div className="wb-card-header">
        <div className="wb-card-title-row">
          {editing ? (
            <input
              className="wb-card-title-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          ) : (
            <h2 className="wb-card-title">{activeCard.name}</h2>
          )}
          <div className="wb-card-header-actions">
            {editing ? (
              <>
                <button className="wb-btn-ghost" onClick={() => setEditing(false)}>
                  Скасувати
                </button>
                <button className="wb-btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? "..." : "Зберегти"}
                </button>
              </>
            ) : (
              <button className="wb-btn-ghost" onClick={startEdit}>✏️ Редагувати</button>
            )}
          </div>
        </div>

        {/* Табки */}
        <div className="wb-card-tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`wb-tab ${activeTab === t.key ? "active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Вміст */}
      <div className="wb-card-body">
        {/* ── DnD Sheet ── */}
        {activeTab === "sheet" && isCharacter && (
          <DnDSheetForm
            sheet={activeCard.dnd_sheet}
            worldId={worldId}
            cardId={activeCard.id}
          />
        )}

        {/* ── Блоки ── */}
        {activeTab === "blocks" && (
          <CardBlocks
            worldId={worldId}
            cardId={activeCard.id}
            blocks={activeCard.blocks || []}
          />
        )}

        {/* ── Основна інформація ── */}
        {activeTab === "info" && (
          <>
            {/* Зображення */}
            <div className="wb-card-image-block">
              {activeCard.image && !editing && (
                <img src={activeCard.image} alt={activeCard.name} className="wb-card-image" />
              )}
              {editing && (
                <div className="wb-card-image-edit">
                  {activeCard.image && (
                    <img src={activeCard.image} alt="" className="wb-card-image-preview" />
                  )}
                  <label className="wb-btn-ghost">
                    📎 Змінити зображення
                    <input type="file" accept="image/*" ref={imageRef} style={{ display: "none" }} />
                  </label>
                </div>
              )}
            </div>

            {/* Тип і папка */}
            {editing ? (
              <div className="wb-card-meta-edit">
                <label>
                  Тип
                  <select
                    value={form.card_type}
                    onChange={(e) => setForm({ ...form, card_type: e.target.value })}
                  >
                    {CARD_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Папка
                  <select
                    value={form.folder || ""}
                    onChange={(e) => setForm({ ...form, folder: e.target.value || null })}
                  >
                    <option value="">— Без папки —</option>
                    {folders?.map((f) => (
                      <option key={f.id} value={f.id}>
                        {"  ".repeat(f._depth || 0)}{f.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="wb-card-wiki-toggle">
                  <input
                    type="checkbox"
                    checked={form.is_visible_in_wiki}
                    onChange={(e) =>
                      setForm({ ...form, is_visible_in_wiki: e.target.checked })
                    }
                  />
                  Картка видима у вікі
                </label>
              </div>
            ) : (
              <div className="wb-card-meta">
                <span className="wb-card-type-badge">
                  {CARD_TYPE_OPTIONS.find((o) => o.value === activeCard.card_type)?.label}
                </span>
                {activeCard.is_visible_in_wiki && (
                  <span className="wb-card-wiki-badge">📖 У вікі</span>
                )}
              </div>
            )}

            {/* Опис */}
            {editing ? (
              <textarea
                className="wb-card-desc-edit"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Короткий опис (показується у вікі якщо картка публічна)..."
                rows={6}
              />
            ) : (
              <div className="wb-card-description">
                {activeCard.description || (
                  <span className="wb-muted">Опис відсутній</span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}