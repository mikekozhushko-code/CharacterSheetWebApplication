import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authApi } from '../Api.jsx';

// ─── Constants ────────────────────────────────────────────────────────────────

const WS_BASE    = 'ws://localhost:8000';
const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100];
const ZOOM_MIN   = 0.2;
const ZOOM_MAX   = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rollDice = (sides) => Math.floor(Math.random() * sides) + 1;
const clamp    = (val, min, max) => Math.min(max, Math.max(min, val));

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

// ─── GameTable ────────────────────────────────────────────────────────────────

const GameTable = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const canvasRef    = useRef(null);
    const viewportRef  = useRef(null);
    const isMountedRef = useRef(true);
    const wsRef        = useRef(null);

    // ── Session ───────────────────────────────────────────────────────────────
    const [session,     setSession]     = useState(null);
    const [isMaster,    setIsMaster]    = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    // ── Refs ──
    const tokenFileInputRef = useRef(null);

    // ── Scenes ────────────────────────────────────────────────────────────────
    const [scenes,         setScenes]         = useState([]);
    const [activeSceneId,  setActiveSceneId]  = useState(null);
    const [isVisible,      setIsVisible]      = useState(false); // чи показана сцена гравцям
    const [renamingId,     setRenamingId]      = useState(null);
    const [renameValue,    setRenameValue]     = useState('');

    // ── Canvas objects ────────────────────────────────────────────────────────
    const [objects,    setObjects]    = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [dragging,   setDragging]   = useState(null);
    const [resizing,   setResizing]   = useState(null);

    // ── Camera ────────────────────────────────────────────────────────────────
    const [camera,   setCamera]  = useState({ x: 0, y: 0, zoom: 1 });
    const isPanning  = useRef(false);
    const lastPanPos = useRef({ x: 0, y: 0 });
    const cameraRef  = useRef(camera);
    useEffect(() => { cameraRef.current = camera; }, [camera]);

    // ── Dice ──────────────────────────────────────────────────────────────────
    const [diceLog, setDiceLog] = useState([]);

    useEffect(() => {
        if (!activeSceneId) return;
        setScenes((prev) => prev.map((s) =>
            s.id === activeSceneId
                ? { ...s, tokens: objects }
                : s
        ));
    }, [objects]);

    // ── Активна сцена (ref для handlers) ─────────────────────────────────────
    const activeSceneIdRef = useRef(activeSceneId);
    useEffect(() => { activeSceneIdRef.current = activeSceneId; }, [activeSceneId]);

    // ── Fetch session ─────────────────────────────────────────────────────────
    useEffect(() => {
        const token   = localStorage.getItem('token');
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId  = String(payload.user_id);

        authApi().get(`/table/${code}/`)
            .then((res) => {
                if (!isMountedRef.current) return;
                setSession(res.data);
                setIsMaster(String(res.data.master) === userId);
            })
            .catch((err) => console.error('GET /table error:', err));
    }, [code]);

    // ── WS message handler ────────────────────────────────────────────────────
    const handleServerMessage = useCallback((data) => {
        switch (data.type) {

            case 'state':
                setScenes(data.payload.scenes || []);
                setActiveSceneId(data.payload.active_scene_id);
                setIsVisible(data.payload.is_visible);
                setObjects(data.payload.tokens || []);
                break;

            case 'move_token':
                setObjects((prev) => prev.map((o) =>
                    o.id === data.payload.id
                        ? { ...o, x: data.payload.x, y: data.payload.y }
                        : o
                ));
                break;

            case 'add_image':
            case 'delete_image':
                setObjects(data.payload.tokens);
                break;

            case 'roll_dice':
                setDiceLog((prev) => [data.payload, ...prev].slice(0, 50));
                break;

            // ── Сцени ────────────────────────────────────────────────────────

            case 'add_scene':
                setScenes((prev) => [...prev, data.payload]);
                break;

            case 'switch_scene':
                setActiveSceneId(data.payload.scene_id);
                setIsVisible(false);
                // Спочатку беремо з локального стану scenes, потім з бекенду
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

            default:
                break;
        }
    }, []);

    const handleServerMessageRef = useRef(handleServerMessage);
    useEffect(() => { handleServerMessageRef.current = handleServerMessage; }, [handleServerMessage]);

    // ── WebSocket ─────────────────────────────────────────────────────────────
    useEffect(() => {
        isMountedRef.current = true;
        const token = localStorage.getItem('token');
        const ws    = new WebSocket(`${WS_BASE}/ws/table/${code}/?token=${token}`);
        wsRef.current = ws;

        ws.onopen    = () => { if (isMountedRef.current) setIsConnected(true); };
        ws.onmessage = (e) => { if (isMountedRef.current) handleServerMessageRef.current(JSON.parse(e.data)); };
        ws.onclose   = () => { if (isMountedRef.current) setIsConnected(false); };
        ws.onerror   = (err) => console.error('WS error:', err);

        return () => {
            isMountedRef.current = false;
            ws.onopen = ws.onmessage = ws.onclose = null;
            ws.close();
        };
    }, [code]);

    const wsSend = useCallback((type, payload) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type, payload }));
        }
    }, []);

    // ── Scene actions ─────────────────────────────────────────────────────────

    const handleAddScene = () => {
        const name = `Сцена ${scenes.length + 1}`;
        wsSend('add_scene', { name });
    };

    const handleSwitchScene = (sceneId) => {
        if (sceneId === activeSceneId) return;

        // Зберігаємо поточні objects в локальний стан scenes
        setScenes((prev) => prev.map((s) =>
            s.id === activeSceneIdRef.current
                ? { ...s, tokens: objects }
                : s
        ));

        wsSend('switch_scene', {
            scene_id:         sceneId,
            current_scene_id: activeSceneIdRef.current,
            current_tokens:   objects,
        });
    };

    const handleRevealScene = () => {
        wsSend('reveal_scene', { scene_id: activeSceneId });
    };

    const handleDeleteScene = (sceneId) => {
        if (scenes.length <= 1) return; // не можна видалити останню
        wsSend('delete_scene', { scene_id: sceneId });
        if (sceneId === activeSceneId && scenes.length > 1) {
            const other = scenes.find((s) => s.id !== sceneId);
            if (other) handleSwitchScene(other.id);
        }
    };

    const handleRenameSubmit = (sceneId) => {
        if (renameValue.trim()) {
            wsSend('rename_scene', { scene_id: sceneId, name: renameValue.trim() });
        }
        setRenamingId(null);
        setRenameValue('');
    };

    // ── Dice ──────────────────────────────────────────────────────────────────
    const handleRoll = (sides) => {
        wsSend('roll_dice', {
            dice:   `d${sides}`,
            result: rollDice(sides),
            time:   new Date().toLocaleTimeString(),
        });
    };

    // ── Image upload ──────────────────────────────────────────────────────────
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const newObj = {
                id: Date.now(), type: 'image',
                x: 200, y: 200, w: 200, h: 150,
                src: ev.target.result, label: file.name,
            };
            setObjects((prev) => {
                const updated = [...prev, newObj];
                wsSend('add_image', { scene_id: activeSceneIdRef.current, tokens: updated });
                return updated;
            });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleAddToken = () => {
        tokenFileInputRef.current.click();
    };

    const handleTokenImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const newToken = {
                id: Date.now(), type: 'token',
                x: 200, y: 200, w: 60, h: 60,
                src: ev.target.result,
                label: file.name.replace(/\.[^.]+$/, ''), // ім'я без розширення
            };
            setObjects((prev) => {
                const updated = [...prev, newToken];
                wsSend('add_image', { scene_id: activeSceneIdRef.current, tokens: updated });
                return updated;
            });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleDelete = () => {
        if (!selectedId) return;
        setObjects((prev) => {
            const updated = prev.filter((o) => o.id !== selectedId);
            wsSend('delete_image', { scene_id: activeSceneIdRef.current, tokens: updated });
            return updated;
        });
        setSelectedId(null);
    };

    // ── Camera ────────────────────────────────────────────────────────────────
    const toCanvasCoords = useCallback((clientX, clientY) => {
        const rect = viewportRef.current.getBoundingClientRect();
        const cam  = cameraRef.current;
        return {
            x: (clientX - rect.left - cam.x) / cam.zoom,
            y: (clientY - rect.top  - cam.y) / cam.zoom,
        };
    }, []);

    const onWheelRef = useRef(null);
    onWheelRef.current = (e) => {
        e.preventDefault();
        const rect    = viewportRef.current.getBoundingClientRect();
        const cam     = cameraRef.current;
        const factor  = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = clamp(cam.zoom * factor, ZOOM_MIN, ZOOM_MAX);
        const mouseX  = e.clientX - rect.left;
        const mouseY  = e.clientY - rect.top;
        const newX    = mouseX - (mouseX - cam.x) * (newZoom / cam.zoom);
        const newY    = mouseY - (mouseY - cam.y) * (newZoom / cam.zoom);
        setCamera({ x: newX, y: newY, zoom: newZoom });
    };

    useEffect(() => {
        if (!session) return;
        const el = viewportRef.current;
        if (!el) return;
        const handler = (e) => onWheelRef.current(e);
        el.addEventListener('wheel', handler, { passive: false });
        return () => el.removeEventListener('wheel', handler);
    }, [session, isVisible]); // ← додай isVisible

    // ── Pan ───────────────────────────────────────────────────────────────────
    const onViewportMouseDown = (e) => {
        if (e.button === 1) {
            e.preventDefault();
            isPanning.current  = true;
            lastPanPos.current = { x: e.clientX, y: e.clientY };
        }
    };

    const onViewportMouseMove = (e) => {
        if (isPanning.current) {
            const dx = e.clientX - lastPanPos.current.x;
            const dy = e.clientY - lastPanPos.current.y;
            lastPanPos.current = { x: e.clientX, y: e.clientY };
            setCamera((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        }
        onMouseMove(e);
    };

    const onViewportMouseUp = (e) => {
        if (e.button === 1) isPanning.current = false;
        onMouseUp();
    };

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
            const dx = x - resizing.startX;
            const dy = y - resizing.startY;
            setObjects((prev) => prev.map((o) =>
                o.id === resizing.id
                    ? { ...o, w: Math.max(30, resizing.startW + dx), h: Math.max(30, resizing.startH + dy) }
                    : o
            ));
            return;
        }
        if (dragging) {
            setObjects((prev) => prev.map((o) =>
                o.id === dragging.id
                    ? { ...o, x: x - dragging.offsetX, y: y - dragging.offsetY }
                    : o
            ));
        }
    };

    const onMouseUp = () => {
        if (dragging) {
            const obj = objects.find((o) => o.id === dragging.id);
            if (obj) wsSend('move_token', { id: obj.id, x: obj.x, y: obj.y });
        }
        if (resizing) {
            wsSend('add_image', { scene_id: activeSceneIdRef.current, tokens: objects });
        }
        setDragging(null);
        setResizing(null);
    };

    // ── Render ────────────────────────────────────────────────────────────────

    if (!session) return (
        <p style={{ color: '#e0d6c8', padding: '40px', textAlign: 'center' }}>Loading...</p>
    );

    // Гравці бачать splash поки сцена не revealed
    const showSplash = !isMaster && !isVisible;

    return (
        <div style={wrapperStyle}>

            {/* ── Top bar ── */}
            <div style={topBarStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ color: '#ffc400', fontWeight: 'bold', fontSize: '16px' }}>
                        ⚔️ {session.name}
                    </span>
                    <span style={sessionCodeStyle}>{code}</span>
                    <span style={{ fontSize: '11px', color: isConnected ? '#81c784' : '#e57373' }}>
                        {isConnected ? '● Connected' : '○ Disconnected'}
                    </span>
                    {isMaster && <span style={dmBadgeStyle}>👑 DM</span>}
                    <span style={{ fontSize: '11px', color: '#888' }}>
                        {Math.round(camera.zoom * 100)}%
                    </span>
                    {/* Назва активної сцени */}
                    {activeSceneId && (
                        <span style={{ fontSize: '12px', color: '#aaa' }}>
                            📍 {scenes.find((s) => s.id === activeSceneId)?.name}
                        </span>
                    )}
                </div>
                <button onClick={() => navigate('/table')} style={btnDangerStyle}>Leave</button>
            </div>

            {/* ── Main area ── */}
            <div style={mainAreaStyle}>

                {/* ── Scenes panel (DM only) ── */}
                {isMaster && (
                    <div style={scenesPanelStyle}>
                        <div style={panelLabelStyle}>🎬 Сцени</div>

                        {scenes.map((scene) => (
                            <div key={scene.id} style={{
                                ...sceneItemStyle,
                                borderColor: scene.id === activeSceneId ? '#ffc400' : '#3a2e1e',
                                backgroundColor: scene.id === activeSceneId ? '#2a1f00' : 'transparent',
                            }}>
                                {renamingId === scene.id ? (
                                    <input
                                        autoFocus
                                        value={renameValue}
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
                                    >
                                        {scene.name}
                                    </span>
                                )}
                                <button
                                    style={sceneDeleteBtnStyle}
                                    onClick={() => handleDeleteScene(scene.id)}
                                    title="Видалити сцену"
                                >×</button>
                            </div>
                        ))}

                        <button style={addSceneBtnStyle} onClick={handleAddScene}>
                            + Нова сцена
                        </button>

                        {/* Reveal кнопка */}
                        {activeSceneId && (
                            <button
                                style={{
                                    ...addSceneBtnStyle,
                                    marginTop: '8px',
                                    color: isVisible ? '#81c784' : '#ffc400',
                                    borderColor: isVisible ? '#81c784' : '#ffc400',
                                }}
                                onClick={handleRevealScene}
                            >
                                {isVisible ? '👁️ Показано' : '👁️ Показати гравцям'}
                            </button>
                        )}
                    </div>
                )}

                {/* ── Canvas area ── */}
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
                                <div
                                    ref={canvasRef}
                                    style={{
                                        position:        'absolute',
                                        width:           '100%',
                                        height:          '100%',
                                        backgroundColor: 'transparent',
                                        transform:       `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
                                        transformOrigin: '0 0',
                                        cursor:          isPanning.current ? 'grabbing' : 'default',
                                        userSelect:      'none',
                                    }}
                                    onMouseDown={onMouseDown}
                                >
                                    {objects.map((obj) => (
                                        <div
                                            key={obj.id}
                                            style={{
                                                position:        'absolute',
                                                left:            obj.x,
                                                top:             obj.y,
                                                width:           obj.w,
                                                height:          obj.h,
                                                border:          selectedId === obj.id ? '2px solid #ffc400' : '1px solid #3a2e1e',
                                                borderRadius:    obj.type === 'token' ? '50%' : '4px',
                                                overflow:        'hidden',
                                                cursor:          'grab',
                                                backgroundColor: obj.type === 'token' ? '#2a1f00' : 'transparent',
                                            }}
                                        >
                                            {obj.src && (
                                                <img src={obj.src} alt={obj.label}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                                                />
                                            )}
                                            {obj.type === 'token' && !obj.src && (
                                                <div style={tokenLabelStyle}>{obj.label}</div>
                                            )}
                                            {isMaster && selectedId === obj.id && (
                                                <div style={resizeHandleStyle} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Toolbar (DM only) ── */}
                            {isMaster && (
                                <div style={toolbarStyle}>
                                    <input
                                        type="file" accept="image/*" ref={fileInputRef}
                                        style={{ display: 'none' }} onChange={handleImageUpload}
                                    />
                                    <button style={toolBtnStyle} onClick={() => fileInputRef.current.click()}>
                                        🖼️ Add Image
                                    </button>

                                    <input
                                        type="file" accept="image/*" ref={tokenFileInputRef}
                                        style={{ display: 'none' }} onChange={handleTokenImageSelect}
                                    />
                                    <button style={toolBtnStyle} onClick={handleAddToken}>
                                        👤 Add Token
                                    </button>
                                    <button
                                        style={{ ...toolBtnStyle, color: '#e57373', borderColor: '#e57373', opacity: selectedId ? 1 : 0.4 }}
                                        onClick={handleDelete}
                                        disabled={!selectedId}
                                    >
                                        🗑️ Delete
                                    </button>
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <button style={toolBtnStyle} onClick={() => setCamera((c) => ({ ...c, zoom: clamp(c.zoom * 1.2, ZOOM_MIN, ZOOM_MAX) }))}>＋</button>
                                        <button style={toolBtnStyle} onClick={() => setCamera({ x: 0, y: 0, zoom: 1 })}>Reset</button>
                                        <button style={toolBtnStyle} onClick={() => setCamera((c) => ({ ...c, zoom: clamp(c.zoom * 0.8, ZOOM_MIN, ZOOM_MAX) }))}>－</button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ── Right panel ── */}
                <div style={rightPanelStyle}>
                    <div style={diceSectionStyle}>
                        <div style={panelLabelStyle}>🎲 Dice Roller</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            {DICE_TYPES.map((sides) => (
                                <button key={sides} style={diceBtnStyle} onClick={() => handleRoll(sides)}>
                                    d{sides}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={logSectionStyle}>
                        <div style={panelLabelStyle}>📜 Roll Log</div>
                        <div style={logListStyle}>
                            {diceLog.length === 0 && (
                                <p style={{ color: '#555', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>
                                    No rolls yet
                                </p>
                            )}
                            {diceLog.map((entry, i) => (
                                <div key={i} style={logEntryStyle}>
                                    <span style={{ color: '#888', fontSize: '11px' }}>{entry.time}</span>
                                    <span style={{ color: '#e0d6c8' }}>{entry.user}</span>
                                    <span style={{ color: '#ffc400', fontWeight: 'bold' }}>
                                        {entry.dice} = {entry.result}
                                    </span>
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

const wrapperStyle = {
    display: 'flex', flexDirection: 'column',
    height: '100vh', backgroundColor: '#0d0d0d',
    color: '#e0d6c8', overflow: 'hidden',
};

const topBarStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 20px', backgroundColor: '#1a1510',
    borderBottom: '1px solid #3a2e1e', flexShrink: 0,
};

const sessionCodeStyle = {
    backgroundColor: '#1a1510', border: '1px solid #3a2e1e',
    borderRadius: '6px', padding: '4px 12px',
    color: '#ffc400', letterSpacing: '3px', fontSize: '14px',
};

const dmBadgeStyle = {
    fontSize: '11px', color: '#ffc400',
    backgroundColor: '#2a1f00', padding: '2px 8px', borderRadius: '4px',
};

const mainAreaStyle = {
    display: 'flex', flex: 1, overflow: 'hidden',
};

const scenesPanelStyle = {
    width: '160px', display: 'flex', flexDirection: 'column',
    borderRight: '1px solid #3a2e1e', backgroundColor: '#1a1510',
    padding: '12px 8px', gap: '6px', flexShrink: 0, overflowY: 'auto',
};

const sceneItemStyle = {
    display: 'flex', alignItems: 'center', gap: '4px',
    padding: '6px 8px', borderRadius: '6px',
    border: '1px solid #3a2e1e', cursor: 'pointer',
};

const sceneDeleteBtnStyle = {
    background: 'none', border: 'none', color: '#555',
    cursor: 'pointer', fontSize: '14px', lineHeight: 1,
    padding: '0 2px', flexShrink: 0,
};

const addSceneBtnStyle = {
    backgroundColor: 'transparent', color: '#888',
    border: '1px dashed #3a2e1e', borderRadius: '6px',
    padding: '6px', cursor: 'pointer', fontSize: '12px',
    textAlign: 'center', marginTop: '4px',
};

const renameInputStyle = {
    flex: 1, background: 'transparent', border: 'none',
    color: '#ffc400', fontSize: '12px', outline: 'none', width: '100%',
};

const canvasWrapperStyle = {
    display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden',
};

const viewportStyle = {
    flex: 1, overflow: 'hidden', position: 'relative',
    backgroundColor: '#111',
    backgroundImage: 'radial-gradient(circle, #1a1510 1px, transparent 1px)',
    backgroundSize: '30px 30px',
};

const tokenLabelStyle = {
    width: '100%', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#ffc400', fontSize: '11px', textAlign: 'center', padding: '4px',
};

const resizeHandleStyle = {
    position: 'absolute', right: 0, bottom: 0,
    width: '10px', height: '10px',
    backgroundColor: '#ffc400', cursor: 'nwse-resize',
};

const toolbarStyle = {
    display: 'flex', gap: '8px', padding: '10px 16px',
    backgroundColor: '#1a1510', borderTop: '1px solid #3a2e1e',
    flexShrink: 0, alignItems: 'center',
};

const rightPanelStyle = {
    width: '200px', display: 'flex', flexDirection: 'column',
    borderLeft: '1px solid #3a2e1e', backgroundColor: '#1a1510', flexShrink: 0,
};

const diceSectionStyle = {
    padding: '12px', borderBottom: '1px solid #3a2e1e',
};

const logSectionStyle = {
    flex: 1, padding: '12px', display: 'flex',
    flexDirection: 'column', overflow: 'hidden',
};

const logListStyle = {
    flex: 1, overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px',
};

const panelLabelStyle = {
    color: '#888', fontSize: '11px',
    letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px',
};

const logEntryStyle = {
    display: 'flex', flexDirection: 'column', gap: '2px',
    padding: '6px 8px', backgroundColor: '#0d0d0d',
    borderRadius: '6px', fontSize: '12px',
};

const diceBtnStyle = {
    backgroundColor: '#0d0d0d', color: '#ffc400',
    border: '1px solid #3a2e1e', borderRadius: '6px',
    padding: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
};

const toolBtnStyle = {
    backgroundColor: 'transparent', color: '#e0d6c8',
    border: '1px solid #3a2e1e', borderRadius: '6px',
    padding: '6px 12px', cursor: 'pointer', fontSize: '13px',
};

const btnDangerStyle = {
    backgroundColor: 'transparent', color: '#e57373',
    border: '1px solid #e57373', borderRadius: '6px',
    padding: '6px 16px', cursor: 'pointer', fontSize: '13px',
};

// ── Splash styles ──────────────────────────────────────────────────────────────

const splashStyle = {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0a0805',
    backgroundImage: 'radial-gradient(ellipse at center, #1a1005 0%, #0a0805 70%)',
};

const splashInnerStyle = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
};

const splashOrbStyle = {
    width: '80px', height: '80px', borderRadius: '50%',
    background: 'radial-gradient(circle, #ffc400 0%, #a06000 40%, transparent 70%)',
    boxShadow: '0 0 60px 20px rgba(255,196,0,0.15)',
    animation: 'pulse 2s ease-in-out infinite',
};

const splashTitleStyle = {
    fontSize: '48px', margin: 0,
};

const splashTextStyle = {
    color: '#888', fontSize: '14px', letterSpacing: '2px',
    textTransform: 'uppercase', margin: 0,
};

const splashDotsStyle = {
    display: 'flex', gap: '8px',
};

const dotStyle = (i) => ({
    width: '6px', height: '6px', borderRadius: '50%',
    backgroundColor: '#ffc400',
    animation: `blink 1.2s ease-in-out ${i * 0.2}s infinite`,
});

// ── Keyframes (inject once) ───────────────────────────────────────────────────
const styleTag = document.createElement('style');
styleTag.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50%       { transform: scale(1.1); opacity: 1; }
    }
    @keyframes blink {
        0%, 100% { opacity: 0.2; }
        50%       { opacity: 1; }
    }
`;
document.head.appendChild(styleTag);

export default GameTable;