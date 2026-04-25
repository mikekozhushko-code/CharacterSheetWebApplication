import React, { useState } from "react";
import { useWorldBuilder } from "../../context/WorldBuilderContext";

const ABILITY_LABELS = [
  { key: "strength",     label: "Сила",          short: "STR" },
  { key: "dexterity",    label: "Спритність",     short: "DEX" },
  { key: "constitution", label: "Витривалість",   short: "CON" },
  { key: "intelligence", label: "Інтелект",       short: "INT" },
  { key: "wisdom",       label: "Мудрість",       short: "WIS" },
  { key: "charisma",     label: "Харизма",        short: "CHA" },
];

function modifier(score) {
  return Math.floor((score - 10) / 2);
}

function ModBadge({ value }) {
  const mod = modifier(value);
  return (
    <span className="wb-sheet-mod">
      {mod >= 0 ? `+${mod}` : mod}
    </span>
  );
}

export default function DnDSheetForm({ sheet, worldId, cardId }) {
  const { updateDnDSheet } = useWorldBuilder();
  const [data, setData] = useState(sheet || {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (field, value) => setData((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDnDSheet(worldId, cardId, data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="wb-sheet">
      <div className="wb-sheet-header">
        <h3>D&D 5e — Бланк персонажа</h3>
        <button
          className="wb-btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saved ? "✓ Збережено" : saving ? "Збереження..." : "Зберегти"}
        </button>
      </div>

      {/* Основна інформація */}
      <section className="wb-sheet-section">
        <h4>Основне</h4>
        <div className="wb-sheet-row">
          <label>Клас<input value={data.character_class || ""} onChange={(e) => set("character_class", e.target.value)} placeholder="Wizard" /></label>
          <label>Підклас<input value={data.subclass || ""} onChange={(e) => set("subclass", e.target.value)} placeholder="Evocation" /></label>
          <label>Раса<input value={data.race || ""} onChange={(e) => set("race", e.target.value)} placeholder="Elf" /></label>
          <label>Рівень<input type="number" min="1" max="20" value={data.level || 1} onChange={(e) => set("level", +e.target.value)} /></label>
        </div>
        <div className="wb-sheet-row">
          <label>Передісторія<input value={data.background || ""} onChange={(e) => set("background", e.target.value)} placeholder="Sage" /></label>
          <label>Мировозгляд<input value={data.alignment || ""} onChange={(e) => set("alignment", e.target.value)} placeholder="Neutral Good" /></label>
          <label>Досвід (XP)<input type="number" min="0" value={data.experience_points || 0} onChange={(e) => set("experience_points", +e.target.value)} /></label>
        </div>
      </section>

      {/* Характеристики */}
      <section className="wb-sheet-section">
        <h4>Характеристики</h4>
        <div className="wb-sheet-abilities">
          {ABILITY_LABELS.map(({ key, label, short }) => (
            <div key={key} className="wb-sheet-ability">
              <span className="wb-sheet-ability-short">{short}</span>
              <input
                type="number"
                min="1"
                max="30"
                value={data[key] || 10}
                onChange={(e) => set(key, +e.target.value)}
              />
              <ModBadge value={data[key] || 10} />
              <span className="wb-sheet-ability-label">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Бойові характеристики */}
      <section className="wb-sheet-section">
        <h4>Бій</h4>
        <div className="wb-sheet-row">
          <label>Макс. HP<input type="number" min="0" value={data.max_hp || 0} onChange={(e) => set("max_hp", +e.target.value)} /></label>
          <label>Поточний HP<input type="number" value={data.current_hp || 0} onChange={(e) => set("current_hp", +e.target.value)} /></label>
          <label>Тимчасовий HP<input type="number" min="0" value={data.temporary_hp || 0} onChange={(e) => set("temporary_hp", +e.target.value)} /></label>
          <label>Клас броні<input type="number" min="0" value={data.armor_class || 10} onChange={(e) => set("armor_class", +e.target.value)} /></label>
          <label>Ініціатива<input type="number" value={data.initiative || 0} onChange={(e) => set("initiative", +e.target.value)} /></label>
          <label>Швидкість<input type="number" min="0" value={data.speed || 30} onChange={(e) => set("speed", +e.target.value)} /></label>
          <label>Кубик хітів<input value={data.hit_dice || ""} onChange={(e) => set("hit_dice", e.target.value)} placeholder="1d8" /></label>
        </div>
      </section>

      {/* Заклинання */}
      <section className="wb-sheet-section">
        <h4>Заклинання</h4>
        <div className="wb-sheet-row">
          <label>Характеристика<input value={data.spellcasting_ability || ""} onChange={(e) => set("spellcasting_ability", e.target.value)} placeholder="INT" /></label>
          <label>DC рятівного кидка<input type="number" min="0" value={data.spell_save_dc || 0} onChange={(e) => set("spell_save_dc", +e.target.value)} /></label>
          <label>Бонус атаки заклинань<input type="number" value={data.spell_attack_bonus || 0} onChange={(e) => set("spell_attack_bonus", +e.target.value)} /></label>
        </div>
      </section>

      {/* Риси та інвентар */}
      <section className="wb-sheet-section">
        <h4>Риси, вміння, інвентар</h4>
        <div className="wb-sheet-textareas">
          <label>Риси та вміння<textarea rows={4} value={data.features_and_traits || ""} onChange={(e) => set("features_and_traits", e.target.value)} placeholder="Darkvision, Fey Ancestry..." /></label>
          <label>Інші вміння та мови<textarea rows={3} value={data.other_proficiencies || ""} onChange={(e) => set("other_proficiencies", e.target.value)} /></label>
          <label>Мови<textarea rows={2} value={data.languages || ""} onChange={(e) => set("languages", e.target.value)} placeholder="Common, Elvish..." /></label>
          <label>Інвентар<textarea rows={4} value={data.equipment || ""} onChange={(e) => set("equipment", e.target.value)} placeholder="Longsword, Explorer's Pack..." /></label>
        </div>
      </section>

      {/* Характер */}
      <section className="wb-sheet-section">
        <h4>Особистість</h4>
        <div className="wb-sheet-textareas">
          <label>Риси характеру<textarea rows={2} value={data.personality_traits || ""} onChange={(e) => set("personality_traits", e.target.value)} /></label>
          <label>Ідеали<textarea rows={2} value={data.ideals || ""} onChange={(e) => set("ideals", e.target.value)} /></label>
          <label>Зв'язки<textarea rows={2} value={data.bonds || ""} onChange={(e) => set("bonds", e.target.value)} /></label>
          <label>Слабкості<textarea rows={2} value={data.flaws || ""} onChange={(e) => set("flaws", e.target.value)} /></label>
          <label>Передісторія<textarea rows={4} value={data.backstory || ""} onChange={(e) => set("backstory", e.target.value)} /></label>
        </div>
      </section>
    </div>
  );
}