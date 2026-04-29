import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { authApi } from "../../Api";

const CARD_TYPE_ICONS = {
  character: "👤", location: "📍", map: "🗺️",
  creature: "🐉", weapon: "⚔️", item: "🎒",
  faction: "⚑", event: "📅", other: "📄",
};

function WikiCard({ card, onSelect, active }) {
  return (
    <div
      className={`wiki-card ${active ? "active" : ""}`}
      onClick={() => onSelect(card)}
    >
      <span>{CARD_TYPE_ICONS[card.card_type] || "📄"}</span>
      <span>{card.name}</span>
    </div>
  );
}

function WikiFolder({ folder, onSelect, activeCard }) {
  const [open, setOpen] = useState(true);
  const hasContent = folder.cards?.length > 0 || folder.children?.length > 0;

  if (!hasContent) return null;

  return (
    <div className="wiki-folder">
      <div className="wiki-folder-header" onClick={() => setOpen((o) => !o)}>
        <span>{open ? "▾" : "▸"}</span>
        <span>📁 {folder.name}</span>
      </div>
      {open && (
        <div className="wiki-folder-content">
          {folder.cards?.map((card) => (
            <WikiCard key={card.id} card={card} onSelect={onSelect} active={activeCard?.id === card.id} />
          ))}
          {folder.children?.map((child) => (
            <WikiFolder key={child.id} folder={child} onSelect={onSelect} activeCard={activeCard} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function WikiView() {
  const { session_id } = useParams();
  const [wiki, setWiki] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCard, setActiveCard] = useState(null);

  useEffect(() => {
    authApi()
      .get(`/sessions/${session_id}/wiki/view/`)
      .then((res) => setWiki(res.data))
      .catch((e) => {
        if (e.response?.status === 404) setError("Вікі для цієї сесії вимкнено або не існує.");
        else if (e.response?.status === 403) setError("У тебе немає доступу до цієї сесії.");
        else setError("Помилка завантаження вікі.");
      })
      .finally(() => setLoading(false));
  }, [session_id]);

  if (loading) return <div className="wiki-loading">Завантаження вікі...</div>;
  if (error) return <div className="wiki-error">{error}</div>;
  if (!wiki) return null;

  return (
    <div className="wiki-layout">
      {/* Сайдбар */}
      <aside className="wiki-sidebar">
        <div className="wiki-sidebar-top">
          {wiki.world.cover_image && (
            <img src={wiki.world.cover_image} alt={wiki.world.name} className="wiki-cover" />
          )}
          <h1 className="wiki-world-title">{wiki.world.name}</h1>
          {wiki.world.description && (
            <p className="wiki-world-desc">{wiki.world.description}</p>
          )}
        </div>

        <div className="wiki-tree">
          {wiki.loose_cards?.map((card) => (
            <WikiCard key={card.id} card={card} onSelect={setActiveCard} active={activeCard?.id === card.id} />
          ))}
          {wiki.folders?.map((folder) => (
            <WikiFolder key={folder.id} folder={folder} onSelect={setActiveCard} activeCard={activeCard} />
          ))}
        </div>
      </aside>

      {/* Центр */}
      <main className="wiki-main">
        {!activeCard && (
          <div className="wiki-empty">
            <p>Вибери статтю зліва</p>
          </div>
        )}
        {activeCard && (
          <article className="wiki-article">
            {activeCard.image && (
              <img src={activeCard.image} alt={activeCard.name} className="wiki-article-image" />
            )}
            <h2>{activeCard.name}</h2>
            <span className="wiki-type-badge">
              {CARD_TYPE_ICONS[activeCard.card_type]} {activeCard.card_type}
            </span>
            <div className="wiki-article-body">
              {activeCard.description || <span className="wiki-muted">Опис відсутній</span>}
            </div>
            {activeCard.blocks?.length > 0 && (
              <div className="wiki-blocks">
                {activeCard.blocks.map((block) => (
                  <div key={block.id} className="wiki-block">
                    <div className="wiki-block-title">{block.title}</div>
                    <div className="wiki-block-content">
                      {block.content || <span className="wiki-muted">Порожньо</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        )}
      </main>
    </div>
  );
}