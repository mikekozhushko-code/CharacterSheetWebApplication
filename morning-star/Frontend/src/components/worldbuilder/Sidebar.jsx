import React, { useState } from "react";
import { useWorldBuilder } from "../../context/WorldBuilderContext";

const CARD_TYPE_ICONS = {
  character: "👤",
  location: "📍",
  map: "🗺️",
  creature: "🐉",
  weapon: "⚔️",
  item: "🎒",
  faction: "⚑",
  event: "📅",
  other: "📄",
};

function CardItem({ card, worldId, isActive, onClick }) {
  const { deleteCard } = useWorldBuilder();
  const [hover, setHover] = useState(false);

  return (
    <div
      className={`wb-sidebar-card ${isActive ? "active" : ""}`}
      onClick={() => onClick(card)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span className="wb-sidebar-icon">{CARD_TYPE_ICONS[card.card_type] || "📄"}</span>
      <span className="wb-sidebar-card-name">{card.name}</span>
      {hover && (
        <button
          className="wb-sidebar-delete"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Видалити "${card.name}"?`)) deleteCard(worldId, card.id);
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

function FolderItem({ folder, worldId, activeCard, onCardClick, depth = 0 }) {
  const { deleteFolder, updateFolder } = useWorldBuilder();
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(folder.name);
  const [hover, setHover] = useState(false);

  const handleRename = async (e) => {
    e.preventDefault();
    if (name.trim() && name !== folder.name) {
      await updateFolder(worldId, folder.id, { name });
    }
    setEditing(false);
  };

  return (
    <div className="wb-sidebar-folder" style={{ paddingLeft: depth * 12 }}>
      <div
        className="wb-sidebar-folder-header"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <span
          className="wb-sidebar-folder-toggle"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "▾" : "▸"}
        </span>

        {editing ? (
          <form onSubmit={handleRename} className="wb-sidebar-rename-form">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              onBlur={handleRename}
            />
          </form>
        ) : (
          <span
            className="wb-sidebar-folder-name"
            onDoubleClick={() => setEditing(true)}
            onClick={() => setOpen((o) => !o)}
          >
            📁 {folder.name}
          </span>
        )}

        {hover && !editing && (
          <button
            className="wb-sidebar-delete"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Видалити папку "${folder.name}" і весь її вміст?`))
                deleteFolder(worldId, folder.id);
            }}
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div className="wb-sidebar-folder-content">
          {folder.cards?.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              worldId={worldId}
              isActive={activeCard?.id === card.id}
              onClick={onCardClick}
            />
          ))}
          {folder.children?.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              worldId={worldId}
              activeCard={activeCard}
              onCardClick={onCardClick}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ world, onCardClick, onAddCard, onAddFolder }) {
  const { activeCard } = useWorldBuilder();

  return (
    <aside className="wb-sidebar">
      <div className="wb-sidebar-top">
        <h2 className="wb-sidebar-title">{world.name}</h2>
        <div className="wb-sidebar-actions">
          <button className="wb-sidebar-btn" onClick={onAddFolder} title="Нова папка">
            📁+
          </button>
          <button className="wb-sidebar-btn" onClick={onAddCard} title="Нова карточка">
            ＋
          </button>
        </div>
      </div>

      <div className="wb-sidebar-tree">
        {/* Карточки без папки */}
        {world.loose_cards?.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            worldId={world.id}
            isActive={activeCard?.id === card.id}
            onClick={onCardClick}
          />
        ))}

        {/* Папки */}
        {world.folders?.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            worldId={world.id}
            activeCard={activeCard}
            onCardClick={onCardClick}
          />
        ))}

        {world.loose_cards?.length === 0 && world.folders?.length === 0 && (
          <p className="wb-sidebar-empty">Порожньо. Додай карточку або папку.</p>
        )}
      </div>
    </aside>
  );
}