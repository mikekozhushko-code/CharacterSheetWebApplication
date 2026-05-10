import React, { useState } from "react";
import { authApi } from "../../Api";

export default function CardBlocks({ worldId, cardId, blocks: initialBlocks }) {
  const [blocks, setBlocks]   = useState(initialBlocks || []);
  const [saving, setSaving]   = useState(null); // id блоку що зберігається
  const [adding, setAdding]   = useState(false);
  const [newTitle, setNewTitle] = useState("");

  // ── Додати блок ──────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const res = await authApi.post(
        `/worlds/${worldId}/cards/${cardId}/blocks/`,
        { title: newTitle, content: "", is_visible_in_wiki: false }
      );
      setBlocks((prev) => [...prev, res.data]);
      setNewTitle("");
    } finally {
      setAdding(false);
    }
  };

  // ── Оновити поле блоку локально ──────────────────────────────────────────
  const updateLocal = (id, field, value) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  // ── Зберегти блок ────────────────────────────────────────────────────────
  const handleSave = async (block) => {
    setSaving(block.id);
    try {
      const res = await authApi.patch(
        `/worlds/${worldId}/cards/${cardId}/blocks/${block.id}/`,
        {
          title:              block.title,
          content:            block.content,
          is_visible_in_wiki: block.is_visible_in_wiki,
        }
      );
      setBlocks((prev) => prev.map((b) => (b.id === res.data.id ? res.data : b)));
    } finally {
      setSaving(null);
    }
  };

  // ── Видалити блок ─────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!confirm("Видалити цей блок?")) return;
    await authApi.delete(`/worlds/${worldId}/cards/${cardId}/blocks/${id}/`);
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="wb-blocks">
      <div className="wb-blocks-header">
        <h4>Блоки</h4>
        <p className="wb-blocks-hint">
          Кожен блок можна окремо відкрити або приховати у вікі для гравців
        </p>
      </div>

      {/* Список блоків */}
      {blocks.map((block) => (
        <div key={block.id} className="wb-block">
          {/* Заголовок блоку */}
          <div className="wb-block-titlerow">
            <input
              className="wb-block-title-input"
              value={block.title}
              onChange={(e) => updateLocal(block.id, "title", e.target.value)}
              placeholder="Назва блоку..."
            />
            {/* Видимість у вікі */}
            <label className="wb-block-visibility">
              <input
                type="checkbox"
                checked={block.is_visible_in_wiki}
                onChange={(e) =>
                  updateLocal(block.id, "is_visible_in_wiki", e.target.checked)
                }
              />
              <span className={block.is_visible_in_wiki ? "vis-on" : "vis-off"}>
                {block.is_visible_in_wiki ? "👁️ Видно гравцям" : "🔒 Приховано"}
              </span>
            </label>
            {/* Кнопки */}
            <button
              className="wb-block-save-btn"
              onClick={() => handleSave(block)}
              disabled={saving === block.id}
            >
              {saving === block.id ? "..." : "Зберегти"}
            </button>
            <button
              className="wb-block-delete-btn"
              onClick={() => handleDelete(block.id)}
            >
              ✕
            </button>
          </div>

          {/* Вміст блоку */}
          <textarea
            className="wb-block-content"
            value={block.content}
            onChange={(e) => updateLocal(block.id, "content", e.target.value)}
            placeholder="Вміст блоку..."
            rows={5}
          />
        </div>
      ))}

      {/* Додати новий блок */}
      <div className="wb-block-add">
        <input
          className="wb-block-new-title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Назва нового блоку..."
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button
          className="wb-btn-primary"
          onClick={handleAdd}
          disabled={adding || !newTitle.trim()}
        >
          {adding ? "..." : "+ Додати блок"}
        </button>
      </div>
    </div>
  );
}