import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authApi } from '../Api.jsx';
import { useGameWebSocket } from '../hooks/useGameWebSocket.js';
import { useCamera, ZOOM_MIN, ZOOM_MAX, clamp } from '../hooks/useCamera.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const DICE_TYPES    = [4, 6, 8, 10, 12, 20, 100];
const rollDice      = (sides) => Math.floor(Math.random() * sides) + 1;
const GRID_DEFAULTS = { enabled: true, snap: false, size: 60, color: 'rgba(255,255,255,0.08)', type: 'square' };

// ─── SplashScreen ─────────────────────────────────────────────────────────────
const SplashScreen = () => (
    <div style={splashStyle}>
        <div style={splashInnerStyle}>
            <div style={splashOrbStyle} />
            <p style={splashTitleStyle}>⚔️</p>
            <p style={splashTextStyle}>Майстер готує наступну сцену...</p>
            <div style={splashDotsStyle}>
                <span style={dotStyle(0)} /><span style={dotStyle(1)} /><span style={dotStyle(2)} />
            </div>
        </div>
    </div>
);

// ─── Grid SVG ─────────────────────────────────────────────────────────────────
const GridOverlay = ({ camera, grid, viewportRef, zIndex = 0 }) => {
    const [size, setSize] = useState({ w: 0, h: 0 });

    useEffect(() => {
        const el = viewportRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            setSize({ w: width, h: height });
        });
        ro.observe(el);
        setSize({ w: el.clientWidth, h: el.clientHeight });
        return () => ro.disconnect();
    }, [viewportRef]);

    if (!grid.enabled || size.w === 0) return null;

    const cellSize = grid.size * camera.zoom;
    const offsetX  = ((camera.x % cellSize) + cellSize) % cellSize;
    const offsetY  = ((camera.y % cellSize) + cellSize) % cellSize;

    if (grid.type === 'hex') {
        const hw = cellSize, hh = cellSize * 0.866;
        return (
            <svg style={{ ...gridSvgStyle, zIndex }} width={size.w} height={size.h}>
                <defs>
                    <pattern id="hex" x={offsetX} y={offsetY} width={hw * 1.5} height={hh * 2} patternUnits="userSpaceOnUse">
                        <polygon points={`${hw*.5},0 ${hw},${hh*.25} ${hw},${hh*.75} ${hw*.5},${hh} 0,${hh*.75} 0,${hh*.25}`}
                            fill="none" stroke={grid.color} strokeWidth="1" />
                        <polygon points={`${hw*1.5},${hh*.5} ${hw*2},${hh*.75} ${hw*2},${hh*1.25} ${hw*1.5},${hh*1.5} ${hw},${hh*1.25} ${hw},${hh*.75}`}
                            fill="none" stroke={grid.color} strokeWidth="1" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hex)" />
            </svg>
        );
    }

    return (
        <svg style={{ ...gridSvgStyle, zIndex }} width={size.w} height={size.h}>
            <defs>
                <pattern id="grid" x={offsetX} y={offsetY} width={cellSize} height={cellSize} patternUnits="userSpaceOnUse">
                    <path d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`} fill="none" stroke={grid.color} strokeWidth="1" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
    );
};

const gridSvgStyle = { position: 'absolute', top: 0, left: 0, pointerEvents: 'none' };

// ─── Grid settings panel ──────────────────────────────────────────────────────
const GridSettings = ({ grid, onChange, onClose }) => (
    <div style={gridPanelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ color: '#ffc400', fontSize: 13, fontWeight: 'bold', letterSpacing: 1 }}>⊞ GRID</span>
            <button style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 16 }} onClick={onClose}>✕</button>
        </div>
        <label style={gridRowStyle}>
            <span style={gridLabelStyle}>Показати</span>
            <input type="checkbox" checked={grid.enabled} onChange={e => onChange({ ...grid, enabled: e.target.checked })} />
        </label>
        <label style={gridRowStyle}>
            <span style={gridLabelStyle}>Прив'язка</span>
            <input type="checkbox" checked={grid.snap} onChange={e => onChange({ ...grid, snap: e.target.checked })} />
        </label>
        <div style={gridRowStyle}>
            <span style={gridLabelStyle}>Тип</span>
            <div style={{ display: 'flex', gap: 4 }}>
                {['square', 'hex'].map(t => (
                    <button key={t} onClick={() => onChange({ ...grid, type: t })} style={{
                        background: grid.type === t ? '#835F0A' : 'transparent',
                        border: '1px solid #5e3a03', borderRadius: 4,
                        color: '#e0d6c8', padding: '2px 8px', fontSize: 11, cursor: 'pointer',
                    }}>{t === 'square' ? '⊞' : '⬡'}</button>
                ))}
            </div>
        </div>
        <div style={gridRowStyle}>
            <span style={gridLabelStyle}>Розмір: {grid.size}px</span>
            <input type="range" min="20" max="120" value={grid.size}
                onChange={e => onChange({ ...grid, size: +e.target.value })}
                style={{ width: 80, accentColor: '#ffc400' }} />
        </div>
        <div style={gridRowStyle}>
            <span style={gridLabelStyle}>Колір</span>
            <div style={{ display: 'flex', gap: 4 }}>
                {['rgba(255,255,255,0.08)', 'rgba(255,196,0,0.15)', 'rgba(255,255,255,0.2)', 'rgba(100,180,255,0.15)'].map(c => (
                    <div key={c} onClick={() => onChange({ ...grid, color: c })} style={{
                        width: 18, height: 18, borderRadius: 3, cursor: 'pointer', background: c,
                        border: grid.color === c ? '2px solid #ffc400' : '1px solid #555',
                    }} />
                ))}
            </div>
        </div>
    </div>
);

const gridPanelStyle  = { position: 'absolute', bottom: 56, left: '50%', transform: 'translateX(-50%)', background: '#1a1510', border: '1px solid #5e3a03', borderRadius: 8, padding: '12px 14px', zIndex: 10, minWidth: 220, boxShadow: '0 4px 20px rgba(0,0,0,0.6)' };
const gridRowStyle    = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 };
const gridLabelStyle  = { fontSize: 12, color: '#aaa' };

// ─── GameTable ────────────────────────────────────────────────────────────────
const GameTable = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const fileInputRef       = useRef(null);
    const canvasRef          = useRef(null);
    const viewportRef        = useRef(null);
    const tokenFileInputRef  = useRef(null);

    // ── State ─────────────────────────────────────────────────────────────────
    const [session,       setSession]       = useState(null);
    const [isMaster,      setIsMaster]      = useState(false);
    const [scenes,        setScenes]        = useState([]);
    const [activeSceneId, setActiveSceneId] = useState(null);
    const [isVisible,     setIsVisible]     = useState(false);
    const [renamingId,    setRenamingId]    = useState(null);
    const [renameValue,   setRenameValue]   = useState('');
    const [objects,       setObjects]       = useState([]);
    const [selectedId,    setSelectedId]    = useState(null);
    const [dragging,      setDragging]      = useState(null);
    const [resizing,      setResizing]      = useState(null);
    const [diceLog,       setDiceLog]       = useState([]);
    const [grid,          setGrid]          = useState(GRID_DEFAULTS);
    const [showGridPanel, setShowGridPanel] = useState(false);
    const [isUploading,    setIsUploading]   = useState(false);
    const [sessionPlayers, setSessionPlayers] = useState([]); // { user_id, username, character_id, character_name, character_avatar, hp_current, hp_max }

    const activeSceneIdRef = useRef(activeSceneId);
    useEffect(() => { activeSceneIdRef.current = activeSceneId; }, [activeSceneId]);


    // ── WS handler ────────────────────────────────────────────────────────────
    const handleServerMessage = useCallback((data) => {
        switch (data.type) {
            case 'state':
                setScenes(data.payload.scenes || []);
                setActiveSceneId(data.payload.active_scene_id);
                setIsVisible(data.payload.is_visible);
                setObjects(data.payload.tokens || []);
                setSessionPlayers(data.payload.players || []);
                if (data.payload.grid) setGrid(data.payload.grid);
                break;
            case 'move_token':
                setObjects((prev) => prev.map((o) =>
                    o.id === data.payload.id ? { ...o, x: data.payload.x, y: data.payload.y } : o
                ));
                break;
            case 'add_image':
            case 'delete_image':
                setObjects(data.payload.tokens);
                break;
            case 'roll_dice':
                setDiceLog((prev) => [data.payload, ...prev].slice(0, 50));
                break;
            case 'add_scene':
                setScenes((prev) => [...prev, data.payload]);
                break;
            case 'switch_scene':
                setActiveSceneId(data.payload.scene_id);
                setIsVisible(false);
                if (data.payload.grid) setGrid(data.payload.grid);
                setScenes((prev) => {
                    const scene = prev.find((s) => s.id === data.payload.scene_id);
                    setObjects(scene?.tokens || data.payload.tokens || []);
                    return prev;
                });
                break;
            case 'reveal_scene':
                setIsVisible(true);
                setObjects(data.payload.tokens || []);
                break;
            case 'delete_scene':
                setScenes((prev) => prev.filter((s) => s.id !== data.payload.scene_id));
                break;
            case 'rename_scene':
                setScenes((prev) => prev.map((s) =>
                    s.id === data.payload.scene_id ? { ...s, name: data.payload.name } : s
                ));
                break;
            case 'update_grid':
                setGrid(data.payload.grid);
                break;
            case 'players_update':
                setSessionPlayers(data.payload);
                break;
            case 'character_hp_changed':
                setObjects((prev) => prev.map((o) =>
                    o.character_id === data.payload.character_id
                        ? { ...o, hp_current: data.payload.hp_current, hp_max: data.payload.hp_max }
                        : o
                ));
                setSessionPlayers((prev) => prev.map((p) =>
                    p.character_id === data.payload.character_id
                        ? { ...p, hp_current: data.payload.hp_current, hp_max: data.payload.hp_max }
                        : p
                ));
                break;
            default: break;
        }
    }, []);

    const showSplash = !isMaster && !isVisible;

    // ── Hooks ─────────────────────────────────────────────────────────────────
    const { isConnected, wsSend } = useGameWebSocket(code, handleServerMessage);

    const {
        camera, setCamera, cameraRef, isPanning,
        toCanvasCoords, onPanStart, onPanMove, onPanEnd, resetCamera,
    } = useCamera(viewportRef, !!session && !showSplash);

    // ── Fetch session ─────────────────────────────────────────────────────────
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/'); return; }
        const userId = String(JSON.parse(atob(token.split('.')[1])).user_id);
        setCurrentUserId(Number(userId));
        authApi.get(`/table/${code}/`)
            .then((res) => {
                setSession(res.data);
                setIsMaster(String(res.data.master) === userId);
                if (res.data.active_scene?.grid_enabled !== undefined) {
                    setGrid({
                        enabled: res.data.active_scene.grid_enabled,
                        snap:    res.data.active_scene.grid_snap,
                        size:    res.data.active_scene.grid_size,
                        color:   res.data.active_scene.grid_color,
                        type:    res.data.active_scene.grid_type || 'square',
                    });
                }
            })
            .catch((err) => console.error('GET /table error:', err));
    }, [code]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const snapToGrid = useCallback((x, y) => {
        if (!grid.snap) return { x, y };
        const s = grid.size;
        return { x: Math.round(x / s) * s, y: Math.round(y / s) * s };
    }, [grid.snap, grid.size]);

    const MAX_UPLOAD_MB = 8;
    const uploadFile = async (file) => {
        if (file.size > MAX_UPLOAD_MB * 1024 * 1024)
            throw new Error(`Файл завеликий (максимум ${MAX_UPLOAD_MB} МБ)`);
        const fd = new FormData();
        fd.append('image', file);
        const res = await authApi.post('/table/upload/', fd);
        return res.data.url;
    };

    // ── Grid ──────────────────────────────────────────────────────────────────
    const handleGridChange = (newGrid) => {
        setGrid(newGrid);
        wsSend('update_grid', { grid: newGrid, scene_id: activeSceneIdRef.current });
    };

    // ── Scene actions ─────────────────────────────────────────────────────────
    const handleAddScene = () => wsSend('add_scene', { name: `Сцена ${scenes.length + 1}` });

    const handleSwitchScene = (sceneId) => {
        if (sceneId === activeSceneId) return;
        setScenes((prev) => prev.map((s) =>
            s.id === activeSceneIdRef.current ? { ...s, tokens: objects } : s
        ));
        wsSend('switch_scene', { scene_id: sceneId, current_scene_id: activeSceneIdRef.current, current_tokens: objects });
    };

    const handleRevealScene  = () => wsSend('reveal_scene', { scene_id: activeSceneId });

    const handleDeleteScene  = (sceneId) => {
        if (scenes.length <= 1) return;
        wsSend('delete_scene', { scene_id: sceneId });
        if (sceneId === activeSceneId) {
            const other = scenes.find((s) => s.id !== sceneId);
            if (other) handleSwitchScene(other.id);
        }
    };

    const handleRenameSubmit = (sceneId) => {
        if (renameValue.trim()) wsSend('rename_scene', { scene_id: sceneId, name: renameValue.trim() });
        setRenamingId(null);
        setRenameValue('');
    };

    const handleRoll = (sides) => wsSend('roll_dice', {
        dice: `d${sides}`, result: rollDice(sides), time: new Date().toLocaleTimeString(),
    });

    // ── Image/token upload ────────────────────────────────────────────────────
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        setIsUploading(true);
        try {
            const src     = await uploadFile(file);
            const snapped = snapToGrid(200, 200);
            const newObj  = { id: Date.now(), type: 'image', ...snapped, w: 200, h: 150, src, label: file.name };
            setObjects((prev) => { const u = [...prev, newObj]; wsSend('add_image', { scene_id: activeSceneIdRef.current, tokens: u }); return u; });
        } catch (err) {
            alert(err.message || 'Помилка завантаження зображення');
        } finally {
            setIsUploading(false);
        }
    };

    const handleTokenImageSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        setIsUploading(true);
        try {
            const src      = await uploadFile(file);
            const snapped  = snapToGrid(200, 200);
            const newToken = { id: Date.now(), type: 'token', ...snapped, w: grid.size, h: grid.size, src, label: file.name.replace(/\.[^.]+$/, '') };
            setObjects((prev) => { const u = [...prev, newToken]; wsSend('add_image', { scene_id: activeSceneIdRef.current, tokens: u }); return u; });
        } catch (err) {
            alert(err.message || 'Помилка завантаження токена');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = () => {
        if (!selectedId) return;
        setObjects((prev) => { const u = prev.filter((o) => o.id !== selectedId); wsSend('delete_image', { scene_id: activeSceneIdRef.current, tokens: u }); return u; });
        setSelectedId(null);
    };

    const handleGenerateToken = (player) => {
        const snapped = snapToGrid(200, 200);
        const newToken = {
            id:           Date.now(),
            type:         'token',
            ...snapped,
            w:            grid.size,
            h:            grid.size,
            src:          player.character_avatar || null,
            label:        player.character_name || player.username,
            character_id: player.character_id,
            hp_current:   player.hp_current,
            hp_max:       player.hp_max,
        };
        setObjects((prev) => {
            const u = [...prev, newToken];
            wsSend('add_image', { scene_id: activeSceneIdRef.current, tokens: u });
            return u;
        });
    };

    // ── Viewport handlers (pan + drag/resize compose here) ───────────────────
    const onViewportMouseDown = (e) => { onPanStart(e); };
    const onViewportMouseMove = (e) => { onPanMove(e); onMouseMove(e); };
    const onViewportMouseUp   = (e) => { onPanEnd(e); onMouseUp(); };

    // ── Drag / Resize ─────────────────────────────────────────────────────────
    const getObjectAt = (x, y) => {
        for (let i = objects.length - 1; i >= 0; i--) {
            const o = objects[i];
            if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) return o;
        }
        return null;
    };

    const isResizeHandle = (obj, x, y) => {
        const s = 12 / cameraRef.current.zoom;
        return x >= obj.x + obj.w - s && x <= obj.x + obj.w + s / 2
            && y >= obj.y + obj.h - s && y <= obj.y + obj.h + s / 2;
    };

    const onMouseDown = (e) => {
        if (e.button !== 0) return;
        const { x, y } = toCanvasCoords(e.clientX, e.clientY);
        const obj = getObjectAt(x, y);
        if (!obj) { setSelectedId(null); return; }
        setSelectedId(obj.id);
        if (isMaster && isResizeHandle(obj, x, y)) {
            setResizing({ id: obj.id, startX: x, startY: y, startW: obj.w, startH: obj.h });
            return;
        }
        setDragging({ id: obj.id, offsetX: x - obj.x, offsetY: y - obj.y });
    };

    const onMouseMove = (e) => {
        if (!dragging && !resizing) return;
        const { x, y } = toCanvasCoords(e.clientX, e.clientY);
        if (resizing) {
            const dx = x - resizing.startX, dy = y - resizing.startY;
            setObjects((prev) => prev.map((o) =>
                o.id === resizing.id ? { ...o, w: Math.max(30, resizing.startW + dx), h: Math.max(30, resizing.startH + dy) } : o
            ));
            return;
        }
        if (dragging) {
            const pos = snapToGrid(x - dragging.offsetX, y - dragging.offsetY);
            setObjects((prev) => prev.map((o) => o.id === dragging.id ? { ...o, ...pos } : o));
        }
    };

    const onMouseUp = () => {
        if (dragging) {
            const obj = objects.find((o) => o.id === dragging.id);
            if (obj) wsSend('move_token', { id: obj.id, x: obj.x, y: obj.y });
        }
        if (resizing) wsSend('add_image', { scene_id: activeSceneIdRef.current, tokens: objects });
        if (dragging || resizing) {
            setScenes((prev) => prev.map((s) =>
                s.id === activeSceneIdRef.current ? { ...s, tokens: objects } : s
            ));
        }
        setDragging(null);
        setResizing(null);
    };

    // ── Render ────────────────────────────────────────────────────────────────
    if (!session) return <p style={{ color: '#e0d6c8', padding: '40px', textAlign: 'center' }}>Loading...</p>;

    const transformStyle = { position: 'absolute', width: '100%', height: '100%', transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`, transformOrigin: '0 0', userSelect: 'none' };

    return (
        <div style={wrapperStyle}>
            {/* ── Top bar ── */}
            <div style={topBarStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ color: '#ffc400', fontWeight: 'bold', fontSize: '16px' }}>⚔️ {session.name}</span>
                    <span style={sessionCodeStyle}>{code}</span>
                    <span style={{ fontSize: '11px', color: isConnected ? '#81c784' : '#e57373' }}>
                        {isConnected ? '● Connected' : '○ Reconnecting...'}
                    </span>
                    {isMaster && <span style={dmBadgeStyle}>👑 DM</span>}
                    <span style={{ fontSize: '11px', color: '#888' }}>{Math.round(camera.zoom * 100)}%</span>
                    {activeSceneId && (
                        <span style={{ fontSize: '12px', color: '#aaa' }}>
                            📍 {scenes.find((s) => s.id === activeSceneId)?.name}
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={wikiBtn} onClick={() => window.open(`/wiki/${session.id}`, '_blank')}>📖 Wiki</button>
                    <button onClick={() => navigate('/table')} style={btnDangerStyle}>Leave</button>
                </div>
            </div>

            {/* ── Main area ── */}
            <div style={mainAreaStyle}>
                {/* Scenes panel */}
                {isMaster && (
                    <div style={scenesPanelStyle}>
                        <div style={panelLabelStyle}>🎬 Сцени</div>
                        {scenes.map((scene) => (
                            <div key={scene.id} style={{
                                ...sceneItemStyle,
                                borderColor:     scene.id === activeSceneId ? '#ffc400' : '#3a2e1e',
                                backgroundColor: scene.id === activeSceneId ? '#2a1f00' : 'transparent',
                            }}>
                                {renamingId === scene.id ? (
                                    <input autoFocus value={renameValue}
                                        onChange={(e) => setRenameValue(e.target.value)}
                                        onBlur={() => handleRenameSubmit(scene.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleRenameSubmit(scene.id);
                                            if (e.key === 'Escape') { setRenamingId(null); setRenameValue(''); }
                                        }}
                                        style={renameInputStyle}
                                    />
                                ) : (
                                    <span
                                        style={{ flex: 1, fontSize: '12px', cursor: 'pointer', color: scene.id === activeSceneId ? '#ffc400' : '#e0d6c8' }}
                                        onClick={() => handleSwitchScene(scene.id)}
                                        onDoubleClick={() => { setRenamingId(scene.id); setRenameValue(scene.name); }}
                                    >{scene.name}</span>
                                )}
                                <button style={sceneDeleteBtnStyle} onClick={() => handleDeleteScene(scene.id)}>×</button>
                            </div>
                        ))}
                        <button style={addSceneBtnStyle} onClick={handleAddScene}>+ Нова сцена</button>
                        {activeSceneId && (
                            <button style={{ ...addSceneBtnStyle, marginTop: '8px', color: isVisible ? '#81c784' : '#ffc400', borderColor: isVisible ? '#81c784' : '#ffc400' }}
                                onClick={handleRevealScene}>
                                {isVisible ? '👁️ Показано' : '👁️ Показати гравцям'}
                            </button>
                        )}
                    </div>
                )}

                {/* Canvas area */}
                <div style={canvasWrapperStyle}>
                    {showSplash ? <SplashScreen /> : (
                        <>
                            <div
                                ref={viewportRef}
                                style={viewportStyle}
                                onMouseDown={onViewportMouseDown}
                                onMouseMove={onViewportMouseMove}
                                onMouseUp={onViewportMouseUp}
                                onMouseLeave={() => { isPanning.current = false; onMouseUp(); }}
                            >
                                {/* Layer 1 — background images */}
                                <div style={{ ...transformStyle, zIndex: 1, pointerEvents: 'none' }}>
                                    {objects.filter(o => o.type === 'image').map((obj) => (
                                        <div key={obj.id} style={{
                                            position: 'absolute', left: obj.x, top: obj.y, width: obj.w, height: obj.h,
                                            border: selectedId === obj.id ? '2px solid #ffc400' : '1px solid #3a2e1e',
                                            borderRadius: '4px', overflow: 'hidden',
                                        }}>
                                            {obj.src && <img src={obj.src} alt={obj.label} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />}
                                            {isMaster && selectedId === obj.id && <div style={resizeHandleStyle} />}
                                        </div>
                                    ))}
                                </div>

                                {/* Layer 2 — grid */}
                                <GridOverlay camera={camera} grid={grid} viewportRef={viewportRef} zIndex={2} />

                                {/* Layer 3 — tokens */}
                                <div ref={canvasRef} style={{ ...transformStyle, zIndex: 3, backgroundColor: 'transparent', cursor: isPanning.current ? 'grabbing' : 'default' }} onMouseDown={onMouseDown}>
                                    {objects.map((obj) => {
                                        const hpPct = (obj.type === 'token' && obj.hp_max)
                                            ? Math.max(0, obj.hp_current / obj.hp_max) : null;
                                        const hpColor = hpPct === null ? null
                                            : hpPct > 0.5 ? '#4caf50'
                                            : hpPct > 0.25 ? '#ff9800' : '#f44336';
                                        return (
                                            <div key={obj.id} style={{
                                                position: 'absolute', left: obj.x, top: obj.y, width: obj.w, height: obj.h,
                                                overflow: 'visible', cursor: 'grab',
                                                pointerEvents: obj.type === 'image' ? 'none' : 'auto',
                                            }}>
                                                {/* The visual circle / rect */}
                                                <div style={{
                                                    width: '100%', height: '100%',
                                                    border: selectedId === obj.id ? '2px solid #ffc400' : '1px solid rgba(58,46,30,0)',
                                                    borderRadius: obj.type === 'token' ? '50%' : '4px',
                                                    overflow: 'hidden',
                                                    backgroundColor: obj.type === 'token' ? '#2a1f00' : 'transparent',
                                                }}>
                                                    {obj.type === 'token' && obj.src && (
                                                        <img src={obj.src} alt={obj.label} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                                                    )}
                                                    {obj.type === 'token' && !obj.src && <div style={tokenLabelStyle}>{obj.label}</div>}
                                                </div>
                                                {/* HP bar below circle */}
                                                {hpPct !== null && (
                                                    <div style={{ position: 'absolute', top: '105%', left: '5%', width: '90%', height: 5, backgroundColor: '#222', borderRadius: 3 }}>
                                                        <div style={{ width: `${hpPct * 100}%`, height: '100%', backgroundColor: hpColor, borderRadius: 3, transition: 'width 0.3s' }} />
                                                    </div>
                                                )}
                                                {/* HP numbers */}
                                                {hpPct !== null && (
                                                    <div style={{ position: 'absolute', top: 'calc(105% + 7px)', left: 0, width: '100%', textAlign: 'center', fontSize: 9, color: '#aaa', pointerEvents: 'none' }}>
                                                        {obj.hp_current}/{obj.hp_max}
                                                    </div>
                                                )}
                                                {/* Resize handle */}
                                                {isMaster && selectedId === obj.id && obj.type === 'token' && <div style={resizeHandleStyle} />}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Layer 4 — click targets for images */}
                                <div style={{ ...transformStyle, zIndex: 4, pointerEvents: 'none' }}>
                                    {objects.filter(o => o.type === 'image').map((obj) => (
                                        <div key={obj.id} onMouseDown={onMouseDown} style={{ position: 'absolute', left: obj.x, top: obj.y, width: obj.w, height: obj.h, cursor: 'grab', pointerEvents: 'auto' }}>
                                            {isMaster && selectedId === obj.id && <div style={resizeHandleStyle} />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Toolbar */}
                            {isMaster && (
                                <div style={toolbarStyle}>
                                    <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload} />
                                    <button style={{ ...toolBtnStyle, opacity: isUploading ? 0.5 : 1 }} onClick={() => !isUploading && fileInputRef.current.click()} disabled={isUploading}>
                                        {isUploading ? '⏳ Uploading...' : '🖼️ Add Image'}
                                    </button>

                                    <input type="file" accept="image/*" ref={tokenFileInputRef} style={{ display: 'none' }} onChange={handleTokenImageSelect} />
                                    <button style={{ ...toolBtnStyle, opacity: isUploading ? 0.5 : 1 }} onClick={() => !isUploading && tokenFileInputRef.current.click()} disabled={isUploading}>
                                        {isUploading ? '⏳ Uploading...' : '👤 Add Token'}
                                    </button>

                                    <button style={{ ...toolBtnStyle, color: '#e57373', borderColor: '#e57373', opacity: selectedId ? 1 : 0.4 }}
                                        onClick={handleDelete} disabled={!selectedId}>🗑️ Delete</button>

                                    <div style={{ position: 'relative' }}>
                                        <button
                                            style={{ ...toolBtnStyle, color: grid.enabled ? '#ffc400' : '#666', borderColor: grid.enabled ? '#ffc400' : '#3a2e1e' }}
                                            onClick={() => setShowGridPanel(p => !p)}
                                        >⊞ Grid {grid.snap ? '📌' : ''}</button>
                                        {showGridPanel && (
                                            <GridSettings grid={grid} onChange={handleGridChange} onClose={() => setShowGridPanel(false)} />
                                        )}
                                    </div>

                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <button style={toolBtnStyle} onClick={() => setCamera((c) => ({ ...c, zoom: clamp(c.zoom * 1.2, ZOOM_MIN, ZOOM_MAX) }))}>＋</button>
                                        <button style={toolBtnStyle} onClick={resetCamera}>Reset</button>
                                        <button style={toolBtnStyle} onClick={() => setCamera((c) => ({ ...c, zoom: clamp(c.zoom * 0.8, ZOOM_MIN, ZOOM_MAX) }))}>－</button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Right panel */}
                <div style={rightPanelStyle}>
                    <div style={diceSectionStyle}>
                        <div style={panelLabelStyle}>🎲 Dice Roller</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            {DICE_TYPES.map((sides) => (
                                <button key={sides} style={diceBtnStyle} onClick={() => handleRoll(sides)}>d{sides}</button>
                            ))}
                        </div>
                    </div>

                    {/* Players section */}
                    <div style={playersSectionStyle}>
                        <div style={panelLabelStyle}>👥 Гравці</div>
                        {sessionPlayers.length === 0 && (
                            <p style={{ color: '#555', fontSize: '11px', textAlign: 'center' }}>Ще немає гравців</p>
                        )}
                        {sessionPlayers.map((p) => {
                            const isMe = p.user_id === currentUserId;
                            const hpPct = p.hp_max ? Math.max(0, p.hp_current / p.hp_max) : null;
                            const hpColor = hpPct === null ? null : hpPct > 0.5 ? '#4caf50' : hpPct > 0.25 ? '#ff9800' : '#f44336';
                            return (
                                <div key={p.user_id} style={playerCardStyle}>
                                    <div style={playerAvatarStyle}>
                                        {p.character_avatar
                                            ? <img src={p.character_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <span style={{ fontSize: '14px' }}>🧙</span>}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '11px', color: p.character_name ? '#ffc400' : '#888', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {p.character_name || p.username}{isMe ? ' ★' : ''}
                                        </div>
                                        {!p.character_name && (
                                            <div style={{ fontSize: '10px', color: '#555' }}>{p.username}</div>
                                        )}
                                        {/* HP bar */}
                                        {hpPct !== null && (
                                            <div style={{ marginTop: '3px' }}>
                                                <div style={{ height: 3, backgroundColor: '#222', borderRadius: 2, overflow: 'hidden' }}>
                                                    <div style={{ width: `${hpPct * 100}%`, height: '100%', backgroundColor: hpColor, transition: 'width 0.3s' }} />
                                                </div>
                                                <div style={{ fontSize: '9px', color: '#666', marginTop: '1px' }}>
                                                    HP {p.hp_current}/{p.hp_max}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {/* DM: Generate Token button */}
                                    {isMaster && p.character_id && (
                                        <button
                                            onClick={() => handleGenerateToken(p)}
                                            title="Згенерувати токен"
                                            style={genTokenBtnStyle}
                                        >⬡</button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div style={logSectionStyle}>
                        <div style={panelLabelStyle}>📜 Roll Log</div>
                        <div style={logListStyle}>
                            {diceLog.length === 0 && <p style={{ color: '#555', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>No rolls yet</p>}
                            {diceLog.map((entry, i) => (
                                <div key={i} style={logEntryStyle}>
                                    <span style={{ color: '#888', fontSize: '11px' }}>{entry.time}</span>
                                    <span style={{ color: '#e0d6c8' }}>{entry.user}</span>
                                    <span style={{ color: '#ffc400', fontWeight: 'bold' }}>{entry.dice} = {entry.result}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const wrapperStyle       = { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0d0d0d', color: '#e0d6c8', overflow: 'hidden' };
const topBarStyle        = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', backgroundColor: '#1a1510', borderBottom: '1px solid #3a2e1e', flexShrink: 0 };
const sessionCodeStyle   = { backgroundColor: '#1a1510', border: '1px solid #3a2e1e', borderRadius: '6px', padding: '4px 12px', color: '#ffc400', letterSpacing: '3px', fontSize: '14px' };
const dmBadgeStyle       = { fontSize: '11px', color: '#ffc400', backgroundColor: '#2a1f00', padding: '2px 8px', borderRadius: '4px' };
const mainAreaStyle      = { display: 'flex', flex: 1, overflow: 'hidden' };
const scenesPanelStyle   = { width: '160px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #3a2e1e', backgroundColor: '#1a1510', padding: '12px 8px', gap: '6px', flexShrink: 0, overflowY: 'auto' };
const sceneItemStyle     = { display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #3a2e1e', cursor: 'pointer' };
const sceneDeleteBtnStyle= { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: '0 2px', flexShrink: 0 };
const addSceneBtnStyle   = { backgroundColor: 'transparent', color: '#888', border: '1px dashed #3a2e1e', borderRadius: '6px', padding: '6px', cursor: 'pointer', fontSize: '12px', textAlign: 'center', marginTop: '4px' };
const renameInputStyle   = { flex: 1, background: 'transparent', border: 'none', color: '#ffc400', fontSize: '12px', outline: 'none', width: '100%' };
const canvasWrapperStyle = { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' };
const viewportStyle      = { flex: 1, overflow: 'hidden', position: 'relative', backgroundColor: '#111' };
const tokenLabelStyle    = { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffc400', fontSize: '11px', textAlign: 'center', padding: '4px' };
const resizeHandleStyle  = { position: 'absolute', right: 0, bottom: 0, width: '10px', height: '10px', backgroundColor: '#ffc400', cursor: 'nwse-resize' };
const toolbarStyle       = { display: 'flex', gap: '8px', padding: '10px 16px', backgroundColor: '#1a1510', borderTop: '1px solid #3a2e1e', flexShrink: 0, alignItems: 'center' };
const rightPanelStyle    = { width: '200px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #3a2e1e', backgroundColor: '#1a1510', flexShrink: 0 };
const diceSectionStyle   = { padding: '12px', borderBottom: '1px solid #3a2e1e' };
const logSectionStyle    = { flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const logListStyle       = { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' };
const panelLabelStyle    = { color: '#888', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' };
const logEntryStyle      = { display: 'flex', flexDirection: 'column', gap: '2px', padding: '6px 8px', backgroundColor: '#0d0d0d', borderRadius: '6px', fontSize: '12px' };
const diceBtnStyle       = { backgroundColor: '#0d0d0d', color: '#ffc400', border: '1px solid #3a2e1e', borderRadius: '6px', padding: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' };
const toolBtnStyle       = { backgroundColor: 'transparent', color: '#e0d6c8', border: '1px solid #3a2e1e', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px' };
const btnDangerStyle     = { backgroundColor: 'transparent', color: '#e57373', border: '1px solid #e57373', borderRadius: '6px', padding: '6px 16px', cursor: 'pointer', fontSize: '13px' };
const wikiBtn            = { backgroundColor: 'transparent', color: '#81c784', border: '1px solid #81c784', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px' };

const playersSectionStyle = { padding: '10px 12px', borderBottom: '1px solid #3a2e1e', display: 'flex', flexDirection: 'column', gap: '6px' };
const playerCardStyle     = { display: 'flex', alignItems: 'center', gap: '6px', padding: '5px', borderRadius: '6px', backgroundColor: '#0d0d0d' };
const playerAvatarStyle   = { width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#2a1f00', border: '1px solid #3a2e1e', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const genTokenBtnStyle    = { background: 'none', border: '1px solid #5e3a03', borderRadius: '4px', color: '#ffc400', cursor: 'pointer', fontSize: '12px', padding: '2px 5px', flexShrink: 0, lineHeight: 1.2 };

const splashStyle      = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0805', backgroundImage: 'radial-gradient(ellipse at center, #1a1005 0%, #0a0805 70%)' };
const splashInnerStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' };
const splashOrbStyle   = { width: '80px', height: '80px', borderRadius: '50%', background: 'radial-gradient(circle, #ffc400 0%, #a06000 40%, transparent 70%)', boxShadow: '0 0 60px 20px rgba(255,196,0,0.15)', animation: 'pulse 2s ease-in-out infinite' };
const splashTitleStyle = { fontSize: '48px', margin: 0 };
const splashTextStyle  = { color: '#888', fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 };
const splashDotsStyle  = { display: 'flex', gap: '8px' };
const dotStyle = (i) => ({ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ffc400', animation: `blink 1.2s ease-in-out ${i * 0.2}s infinite` });

// Inject keyframes once, safely
if (typeof document !== 'undefined' && !document.getElementById('game-table-keyframes')) {
    const s = document.createElement('style');
    s.id = 'game-table-keyframes';
    s.textContent = `@keyframes pulse{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.1);opacity:1}}@keyframes blink{0%,100%{opacity:.2}50%{opacity:1}}`;
    document.head.appendChild(s);
}

export default GameTable;
