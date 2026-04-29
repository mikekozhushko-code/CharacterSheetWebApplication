import React, { useState, useEffect, useCallback, useRef } from "react";

// ── Constants ────────────────────────────────────────────────────────────────
const W = 21, H = 15;

const TILES = { WALL: "#", FLOOR: ".", STAIRS: ">", CHEST: "C" };

const MONSTERS = [
  { name: "Щур",      char: "r", hp: 6,  atk: 2, def: 0, xp: 5,  gold: [1,3]  },
  { name: "Гоблін",   char: "g", hp: 10, atk: 4, def: 1, xp: 10, gold: [2,5]  },
  { name: "Скелет",   char: "s", hp: 14, atk: 5, def: 2, xp: 15, gold: [3,7]  },
  { name: "Орк",      char: "o", hp: 20, atk: 7, def: 3, xp: 25, gold: [5,10] },
  { name: "Тролль",   char: "T", hp: 30, atk: 9, def: 4, xp: 40, gold: [8,15] },
  { name: "Дракон",   char: "D", hp: 50, atk: 14,def: 6, xp: 80, gold: [15,30]},
];

const WEAPONS = [
  { name: "Кулаки",    atk: 1,  emoji: "👊" },
  { name: "Кинджал",   atk: 4,  emoji: "🗡️" },
  { name: "Меч",       atk: 7,  emoji: "⚔️" },
  { name: "Бойова сокира", atk: 11, emoji: "🪓" },
  { name: "Руна-клинок",  atk: 16, emoji: "✨" },
];

const POTIONS = [
  { name: "Мале зілля",   heal: 15, emoji: "🧪" },
  { name: "Зілля HP",     heal: 30, emoji: "❤️" },
  { name: "Велике зілля", heal: 60, emoji: "💊" },
];

// ── RNG ──────────────────────────────────────────────────────────────────────
const rng = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rng(0, arr.length - 1)];

// ── Map generation ────────────────────────────────────────────────────────────
function makeMap(floor) {
  const grid = Array.from({ length: H }, () => Array(W).fill(TILES.WALL));

  // BSP rooms
  const rooms = [];
  const tries = 20;
  for (let i = 0; i < tries; i++) {
    const rw = rng(3, 7), rh = rng(3, 5);
    const rx = rng(1, W - rw - 1), ry = rng(1, H - rh - 1);
    const overlap = rooms.some(r =>
      rx < r.x + r.w + 1 && rx + rw + 1 > r.x &&
      ry < r.y + r.h + 1 && ry + rh + 1 > r.y
    );
    if (!overlap) {
      rooms.push({ x: rx, y: ry, w: rw, h: rh });
      for (let y = ry; y < ry + rh; y++)
        for (let x = rx; x < rx + rw; x++)
          grid[y][x] = TILES.FLOOR;
    }
  }

  // Corridors
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1], b = rooms[i];
    const ax = rng(a.x, a.x + a.w - 1), ay = rng(a.y, a.y + a.h - 1);
    const bx = rng(b.x, b.x + b.w - 1), by = rng(b.y, b.y + b.h - 1);
    let cx = ax, cy = ay;
    while (cx !== bx) { grid[cy][cx] = TILES.FLOOR; cx += cx < bx ? 1 : -1; }
    while (cy !== by) { grid[cy][cx] = TILES.FLOOR; cy += cy < by ? 1 : -1; }
  }

  if (rooms.length === 0) {
    // fallback
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++)
        grid[y][x] = TILES.FLOOR;
    rooms.push({ x: 1, y: 1, w: W - 2, h: H - 2 });
  }

  // Place stairs in last room
  const lastRoom = rooms[rooms.length - 1];
  const sx = rng(lastRoom.x, lastRoom.x + lastRoom.w - 1);
  const sy = rng(lastRoom.y, lastRoom.y + lastRoom.h - 1);
  grid[sy][sx] = TILES.STAIRS;

  // Player spawn in first room
  const firstRoom = rooms[0];
  const px = rng(firstRoom.x, firstRoom.x + firstRoom.w - 1);
  const py = rng(firstRoom.y, firstRoom.y + firstRoom.h - 1);

  // Monsters
  const monsters = [];
  const monsterCount = Math.min(3 + floor, 8);
  const spawnRooms = rooms.slice(1);
  for (let i = 0; i < monsterCount && spawnRooms.length > 0; i++) {
    const room = pick(spawnRooms);
    const mx = rng(room.x, room.x + room.w - 1);
    const my = rng(room.y, room.y + room.h - 1);
    if (mx === px && my === py) continue;
    const tier = Math.min(Math.floor(floor / 2), MONSTERS.length - 1);
    const base = MONSTERS[rng(0, tier)];
    const scale = 1 + floor * 0.15;
    monsters.push({
      ...base,
      id: i,
      x: mx, y: my,
      maxHp: Math.floor(base.hp * scale),
      hp: Math.floor(base.hp * scale),
      atk: Math.floor(base.atk * scale),
    });
  }

  // Chests
  const chests = [];
  const chestCount = rng(1, 3);
  const midRooms = rooms.slice(1, -1);
  for (let i = 0; i < chestCount && midRooms.length > 0; i++) {
    const room = pick(midRooms);
    const cx2 = rng(room.x, room.x + room.w - 1);
    const cy2 = rng(room.y, room.y + room.h - 1);
    chests.push({ id: i, x: cx2, y: cy2 });
    grid[cy2][cx2] = TILES.CHEST;
  }

  return { grid, px, py, monsters, chests };
}

// ── Initial player state ──────────────────────────────────────────────────────
function initPlayer() {
  return {
    x: 0, y: 0,
    hp: 30, maxHp: 30,
    atk: 1, def: 0,
    level: 1, xp: 0, xpNext: 20,
    gold: 0,
    weapon: WEAPONS[0],
    potions: [],
    floor: 1,
  };
}

// ── Combat ───────────────────────────────────────────────────────────────────
function calcDmg(atk, def) {
  const base = Math.max(1, atk - def + rng(-1, 2));
  return base;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function DungeonCrawler({ onClose }) {
  const [phase, setPhase]       = useState("game"); // game | combat | chest | dead | win
  const [player, setPlayer]     = useState(null);
  const [map, setMap]           = useState(null);
  const [log, setLog]           = useState([]);
  const [enemy, setEnemy]       = useState(null);
  const [combatLog, setCombatLog] = useState([]);
  const inputRef = useRef(null);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    startGame();
  }, []);

  // ── Focus for keyboard ────────────────────────────────────────────────────
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [phase]);

  function startGame() {
    const p = initPlayer();
    const { grid, px, py, monsters, chests } = makeMap(1);
    p.x = px; p.y = py;
    setPlayer(p);
    setMap({ grid, monsters, chests });
    setLog(["⚔️ Ти спустився в підземелля. Знайди сходи ›"]);
    setPhase("game");
    setCombatLog([]);
  }

  function addLog(msg) {
    setLog(prev => [msg, ...prev].slice(0, 6));
  }

  // ── Level up ──────────────────────────────────────────────────────────────
  function checkLevelUp(p) {
    if (p.xp >= p.xpNext) {
      const newP = {
        ...p,
        level: p.level + 1,
        xp: p.xp - p.xpNext,
        xpNext: Math.floor(p.xpNext * 1.5),
        maxHp: p.maxHp + 8,
        hp: Math.min(p.maxHp + 8, p.hp + 8),
        def: p.def + 1,
      };
      addLog(`✨ Рівень ${newP.level}! +8 HP, +1 захист`);
      return newP;
    }
    return p;
  }

  // ── Movement ──────────────────────────────────────────────────────────────
  const handleMove = useCallback((dx, dy) => {
    if (phase !== "game" || !player || !map) return;
    const nx = player.x + dx, ny = player.y + dy;
    if (nx < 0 || nx >= W || ny < 0 || ny >= H) return;
    const tile = map.grid[ny][nx];
    if (tile === TILES.WALL) return;

    // Check monster
    const mon = map.monsters.find(m => m.x === nx && m.y === ny && m.hp > 0);
    if (mon) {
      setEnemy({ ...mon });
      setCombatLog([`⚔️ Зустріч з ${mon.name}! (HP: ${mon.hp})`]);
      setPhase("combat");
      return;
    }

    // Check chest
    const chest = map.chests.find(c => c.x === nx && c.y === ny);
    if (chest) {
      openChest(chest, { ...player, x: nx, y: ny });
      setMap(prev => ({
        ...prev,
        chests: prev.chests.filter(c => c.id !== chest.id),
        grid: prev.grid.map((row, ry) =>
          row.map((cell, rx) => (rx === nx && ry === ny ? TILES.FLOOR : cell))
        ),
      }));
      return;
    }

    // Stairs
    if (tile === TILES.STAIRS) {
      nextFloor(player);
      return;
    }

    setPlayer(prev => ({ ...prev, x: nx, y: ny }));
  }, [phase, player, map]);

  function openChest(chest, p) {
    const roll = rng(1, 10);
    let newP = { ...p };
    if (roll <= 4) {
      // Gold
      const g = rng(5, 15 + p.floor * 3);
      newP.gold += g;
      addLog(`💰 Скриня: знайшов ${g} золота!`);
    } else if (roll <= 7) {
      // Potion
      const pot = pick(POTIONS);
      newP.potions = [...newP.potions, pot].slice(0, 5);
      addLog(`${pot.emoji} Скриня: знайшов ${pot.name}!`);
    } else {
      // Weapon
      const tier = Math.min(Math.floor(p.floor / 2), WEAPONS.length - 1);
      const wpn = WEAPONS[rng(Math.max(0, tier - 1), tier)];
      if (wpn.atk > newP.weapon.atk) {
        newP.weapon = wpn;
        addLog(`${wpn.emoji} Скриня: знайшов ${wpn.name}! (+${wpn.atk} атака)`);
      } else {
        const g = rng(3, 10);
        newP.gold += g;
        addLog(`💰 Скриня: знайшов ${g} золота (зброя гірша)`);
      }
    }
    setPlayer(newP);
  }

  function nextFloor(p) {
    const nextFloorNum = p.floor + 1;
    const newP = { ...p, floor: nextFloorNum };
    const { grid, px, py, monsters, chests } = makeMap(nextFloorNum);
    newP.x = px; newP.y = py;
    setPlayer(newP);
    setMap({ grid, monsters, chests });
    addLog(`🪜 Поверх ${nextFloorNum}! Глибше в темряву...`);
    setPhase("game");
  }

  // ── Combat actions ────────────────────────────────────────────────────────
  function combatAttack() {
    if (phase !== "combat" || !enemy) return;
    let p = { ...player };
    let e = { ...enemy };
    const msgs = [];

    // Player attacks
    const pDmg = calcDmg(p.weapon.atk + p.atk, e.def);
    e.hp -= pDmg;
    msgs.push(`⚔️ Ти завдав ${pDmg} шкоди ${e.name}`);

    if (e.hp <= 0) {
      // Enemy dead
      const xpGain = e.xp;
      const goldGain = rng(e.gold[0], e.gold[1]);
      p.xp += xpGain;
      p.gold += goldGain;
      p = checkLevelUp(p);
      msgs.push(`💀 ${e.name} переможено! +${xpGain} XP, +${goldGain} 💰`);
      // Chance to drop potion
      if (rng(1, 5) === 1) {
        const pot = pick(POTIONS);
        p.potions = [...p.potions, pot].slice(0, 5);
        msgs.push(`${pot.emoji} Дроп: ${pot.name}!`);
      }
      setPlayer(p);
      setMap(prev => ({
        ...prev,
        monsters: prev.monsters.map(m => m.id === e.id ? { ...m, hp: 0 } : m),
      }));
      setCombatLog(msgs);
      setTimeout(() => {
        addLog(msgs[msgs.length - 2] || msgs[0]);
        setPhase("game");
        setEnemy(null);
      }, 1200);
      return;
    }

    // Enemy attacks back
    const eDmg = calcDmg(e.atk, p.def);
    p.hp -= eDmg;
    msgs.push(`💢 ${e.name} завдав тобі ${eDmg} шкоди`);

    if (p.hp <= 0) {
      p.hp = 0;
      setPlayer(p);
      setEnemy(e);
      setCombatLog([...msgs, "💀 Ти загинув..."]);
      setTimeout(() => setPhase("dead"), 1500);
      return;
    }

    setPlayer(p);
    setEnemy(e);
    setCombatLog(msgs);
  }

  function combatFlee() {
    if (rng(1, 3) !== 1) {
      // Success
      addLog("🏃 Ти втік!");
      setPhase("game");
      setEnemy(null);
    } else {
      // Fail — enemy hits
      const eDmg = calcDmg(enemy.atk, player.def);
      const newHp = player.hp - eDmg;
      setCombatLog([`💢 Не вдалося втекти! ${enemy.name} завдав ${eDmg} шкоди`]);
      if (newHp <= 0) {
        setPlayer(p => ({ ...p, hp: 0 }));
        setTimeout(() => setPhase("dead"), 1000);
      } else {
        setPlayer(p => ({ ...p, hp: newHp }));
      }
    }
  }

  function usePotion() {
    if (!player.potions.length) return;
    const pot = player.potions[0];
    const newHp = Math.min(player.maxHp, player.hp + pot.heal);
    const healed = newHp - player.hp;
    setPlayer(p => ({ ...p, hp: newHp, potions: p.potions.slice(1) }));
    addLog(`${pot.emoji} Використав ${pot.name} (+${healed} HP)`);
    if (phase === "combat") {
      setCombatLog(prev => [`${pot.emoji} Випив зілля (+${healed} HP)`, ...prev]);
    }
  }

  // ── Keyboard ──────────────────────────────────────────────────────────────
  const handleKey = useCallback((e) => {
    const moves = {
      ArrowUp: [0,-1], ArrowDown: [0,1], ArrowLeft: [-1,0], ArrowRight: [1,0],
      w: [0,-1], s: [0,1], a: [-1,0], d: [1,0],
      W: [0,-1], S: [0,1], A: [-1,0], D: [1,0],
    };
    if (moves[e.key]) {
      e.preventDefault();
      handleMove(...moves[e.key]);
    }
    if ((e.key === "f" || e.key === "F") && phase === "combat") combatFlee();
    if ((e.key === "h" || e.key === "H")) usePotion();
    if ((e.key === " ") && phase === "combat") combatAttack();
  }, [phase, handleMove, player, enemy]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // ── Render map ────────────────────────────────────────────────────────────
  function renderMap() {
    if (!map || !player) return null;
    return map.grid.map((row, y) => (
      <div key={y} style={{ display: "flex", lineHeight: 1 }}>
        {row.map((cell, x) => {
          const isPlayer = x === player.x && y === player.y;
          const mon = map.monsters.find(m => m.x === x && m.y === y && m.hp > 0);
          let char = cell, color = "#444", bg = "transparent";

          if (cell === TILES.WALL)    { char = "█"; color = "#3a2e1e"; }
          if (cell === TILES.FLOOR)   { char = "·"; color = "#1a1208"; }
          if (cell === TILES.STAIRS)  { char = "▼"; color = "#ffc400"; }
          if (cell === TILES.CHEST)   { char = "C"; color = "#cd7f32"; }
          if (mon)                    { char = mon.char.toUpperCase(); color = "#e57373"; bg = "rgba(211,47,47,0.1)"; }
          if (isPlayer)               { char = "@"; color = "#ffc400"; bg = "rgba(255,196,0,0.15)"; }

          return (
            <span key={x} style={{
              display: "inline-block", width: 16, height: 16,
              textAlign: "center", fontSize: 13, fontFamily: "monospace",
              color, backgroundColor: bg,
              fontWeight: (isPlayer || mon) ? "bold" : "normal",
            }}>
              {char}
            </span>
          );
        })}
      </div>
    ));
  }

  if (!player || !map) return null;

  const hpPct = Math.max(0, player.hp / player.maxHp * 100);
  const xpPct = Math.max(0, player.xp / player.xpNext * 100);

  // ── Dead screen ───────────────────────────────────────────────────────────
  if (phase === "dead") return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 64 }}>💀</div>
          <h2 style={{ color: "#e57373", fontSize: 28, margin: "12px 0 4px" }}>Ти загинув</h2>
          <p style={{ color: "#888", fontSize: 14, margin: "0 0 8px" }}>
            Поверх {player.floor} · Рівень {player.level} · {player.gold} 💰
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
            <button style={btnPrimary} onClick={startGame}>🔄 Знову</button>
            <button style={btnSecondary} onClick={onClose}>✕ Вийти</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={overlayStyle} ref={inputRef} tabIndex={-1}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={headerStyle}>
          <span style={{ color: "#ffc400", fontWeight: "bold", fontSize: 16 }}>
            ⚔️ Dungeon Crawler
          </span>
          <span style={{ color: "#888", fontSize: 13 }}>
            Поверх {player.floor} · Рівень {player.level}
          </span>
          <button style={closeBtnStyle} onClick={onClose}>✕</button>
        </div>

        <div style={{ display: "flex", gap: 12, padding: "0 12px 12px" }}>

          {/* Map */}
          <div>
            <div style={mapContainerStyle}>
              {renderMap()}
            </div>
            {/* Controls hint */}
            <div style={{ color: "#555", fontSize: 11, textAlign: "center", marginTop: 6 }}>
              WASD / ↑↓←→ рух &nbsp;·&nbsp; H зілля
              {phase === "combat" && " · ПРОБІЛ атака · F втекти"}
            </div>
          </div>

          {/* Right panel */}
          <div style={{ width: 160, display: "flex", flexDirection: "column", gap: 8 }}>

            {/* Stats */}
            <div style={panelStyle}>
              <div style={panelTitle}>Герой</div>

              <div style={{ marginBottom: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#aaa", marginBottom: 2 }}>
                  <span>❤️ HP</span><span>{player.hp}/{player.maxHp}</span>
                </div>
                <div style={barBg}>
                  <div style={{ ...barFill, width: `${hpPct}%`, background: hpPct > 50 ? "#4caf50" : hpPct > 25 ? "#ff9800" : "#e53935" }} />
                </div>
              </div>

              <div style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#aaa", marginBottom: 2 }}>
                  <span>⭐ XP</span><span>{player.xp}/{player.xpNext}</span>
                </div>
                <div style={barBg}>
                  <div style={{ ...barFill, width: `${xpPct}%`, background: "#7c4dff" }} />
                </div>
              </div>

              <div style={{ fontSize: 12, color: "#ccc", display: "flex", flexDirection: "column", gap: 2 }}>
                <span>{player.weapon.emoji} {player.weapon.name}</span>
                <span>🛡️ Захист: {player.def}</span>
                <span>💰 Золото: {player.gold}</span>
              </div>
            </div>

            {/* Potions */}
            <div style={panelStyle}>
              <div style={{ ...panelTitle, display: "flex", justifyContent: "space-between" }}>
                <span>Зілля</span>
                <button
                  style={{ ...btnSmall, opacity: player.potions.length ? 1 : 0.4 }}
                  disabled={!player.potions.length}
                  onClick={usePotion}
                >H</button>
              </div>
              {player.potions.length === 0
                ? <div style={{ color: "#555", fontSize: 12 }}>Порожньо</div>
                : player.potions.map((p, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#ccc" }}>
                    {p.emoji} {p.name} (+{p.heal})
                  </div>
                ))
              }
            </div>

            {/* Log */}
            <div style={{ ...panelStyle, flex: 1 }}>
              <div style={panelTitle}>Журнал</div>
              {log.map((l, i) => (
                <div key={i} style={{ fontSize: 11, color: i === 0 ? "#e0d6c8" : "#666", marginBottom: 2 }}>
                  {l}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Combat overlay */}
        {phase === "combat" && enemy && (
          <div style={combatOverlayStyle}>
            <div style={combatBoxStyle}>
              <div style={{ fontSize: 32, textAlign: "center", marginBottom: 4 }}>
                {enemy.char.toUpperCase()}
              </div>
              <div style={{ fontWeight: "bold", color: "#e57373", textAlign: "center", marginBottom: 8 }}>
                {enemy.name}
              </div>

              {/* Enemy HP bar */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#aaa", marginBottom: 2 }}>
                  <span>❤️</span><span>{Math.max(0,enemy.hp)}/{enemy.maxHp}</span>
                </div>
                <div style={barBg}>
                  <div style={{ ...barFill, width: `${Math.max(0,enemy.hp)/enemy.maxHp*100}%`, background: "#e53935" }} />
                </div>
              </div>

              {/* Combat log */}
              <div style={{ minHeight: 48, marginBottom: 10 }}>
                {combatLog.map((l, i) => (
                  <div key={i} style={{ fontSize: 11, color: i === 0 ? "#fff" : "#666", marginBottom: 1 }}>{l}</div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6 }}>
                <button style={{ ...btnPrimary, flex: 1, padding: "8px 4px", fontSize: 13 }} onClick={combatAttack}>
                  ⚔️ Атака
                </button>
                <button
                  style={{ ...btnSecondary, flex: 1, padding: "8px 4px", fontSize: 13,
                    opacity: player.potions.length ? 1 : 0.4 }}
                  disabled={!player.potions.length}
                  onClick={usePotion}
                >
                  🧪 Зілля
                </button>
                <button style={{ ...btnSecondary, flex: 1, padding: "8px 4px", fontSize: 13 }} onClick={combatFlee}>
                  🏃 Втекти
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const overlayStyle = {
  position: "fixed", inset: 0,
  background: "rgba(0,0,0,0.85)",
  backdropFilter: "blur(4px)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 2000,
};
const modalStyle = {
  background: "#0d0a07",
  border: "2px solid #5e3a03",
  borderRadius: 10,
  boxShadow: "0 0 60px rgba(255,196,0,0.1)",
  maxWidth: "98vw",
  position: "relative",
  overflow: "hidden",
};
const headerStyle = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "10px 14px",
  borderBottom: "1px solid #3a2e1e",
  background: "#120c08",
};
const closeBtnStyle = {
  background: "none", border: "none", color: "#666",
  fontSize: 18, cursor: "pointer",
};
const mapContainerStyle = {
  background: "#080604",
  border: "1px solid #3a2e1e",
  borderRadius: 6,
  padding: "6px 4px",
  display: "inline-block",
};
const panelStyle = {
  background: "#120c08",
  border: "1px solid #3a2e1e",
  borderRadius: 6,
  padding: "8px 10px",
};
const panelTitle = {
  fontSize: 11, fontWeight: "bold", color: "#ffc400",
  textTransform: "uppercase", letterSpacing: 1,
  marginBottom: 6,
};
const barBg = {
  height: 6, background: "#1a1208", borderRadius: 3, overflow: "hidden",
};
const barFill = {
  height: "100%", borderRadius: 3, transition: "width 0.3s",
};
const btnPrimary = {
  background: "#835F0A", color: "#fff", border: "none",
  borderRadius: 6, padding: "8px 14px", fontSize: 13,
  cursor: "pointer", fontWeight: "bold",
};
const btnSecondary = {
  background: "transparent", color: "#ffc400",
  border: "1px solid #5e3a03", borderRadius: 6,
  padding: "8px 14px", fontSize: 13, cursor: "pointer",
};
const btnSmall = {
  background: "#2a1a05", color: "#ffc400",
  border: "1px solid #5e3a03", borderRadius: 4,
  padding: "1px 6px", fontSize: 11, cursor: "pointer",
};
const combatOverlayStyle = {
  position: "absolute", inset: 0,
  background: "rgba(5,3,1,0.88)",
  display: "flex", alignItems: "center", justifyContent: "center",
};
const combatBoxStyle = {
  background: "#1a0f05",
  border: "2px solid #e57373",
  borderRadius: 10,
  padding: "16px 20px",
  width: 220,
  boxShadow: "0 0 30px rgba(229,115,115,0.2)",
};