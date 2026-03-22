import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authApi } from '../Api.jsx';

// ─── Constants ────────────────────────────────────────────────────────────────

const WS_BASE    = 'ws://localhost:8000';
const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rollDice = (sides) => Math.floor(Math.random() * sides) + 1;

// ─── GameTable ────────────────────────────────────────────────────────────────

const GameTable = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // WebSocket refs — using refs so cleanup works correctly with StrictMode
    const wsRef      = useRef(null);
    const isMountedRef = useRef(true);

    // ── Session state ─────────────────────────────────────────────────────────
    const [session, setSession]         = useState(null);
    const [isMaster, setIsMaster]       = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    // ── Canvas objects state ──────────────────────────────────────────────────
    const [objects, setObjects]       = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [dragging, setDragging]     = useState(null);
    const [resizing, setResizing]     = useState(null);

    // ── Dice log state ────────────────────────────────────────────────────────
    const [diceLog, setDiceLog] = useState([]);

    // ── Fetch session info ────────────────────────────────────────────────────
    useEffect(() => {
        const token   = localStorage.getItem('token');
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId  = String(payload.user_id);

        authApi().get(`/table/${code}/`)
            .then((res) => {
                if (!isMountedRef.current) return;
                setSession(res.data);
                setIsMaster(String(res.data.master) === userId);
                if (res.data.tokens?.length) setObjects(res.data.tokens);
            })
            .catch((err) => console.error('GET /table error:', err));
    }, [code]);

    // ── Server message handler (stable ref — avoids stale closure in WS) ─────
    const handleServerMessage = useCallback((data) => {
        switch (data.type) {
            case 'state':
                if (data.payload.tokens?.length) setObjects(data.payload.tokens);
                break;

            case 'move_token':
                setObjects((prev) => prev.map((obj) =>
                    obj.id === data.payload.id
                        ? { ...obj, x: data.payload.x, y: data.payload.y }
                        : obj
                ));
                break;

            case 'add_image':
                setObjects(data.payload.tokens);
                break;

            case 'delete_image':
                setObjects(data.payload.tokens);
                break;

            case 'roll_dice':
                setDiceLog((prev) => [data.payload, ...prev].slice(0, 50));
                break;

            default:
                break;
        }
    }, []);

    // Store handler in ref so WS onmessage always calls the latest version
    const handleServerMessageRef = useRef(handleServerMessage);
    useEffect(() => {
        handleServerMessageRef.current = handleServerMessage;
    }, [handleServerMessage]);

    // ── WebSocket connection ──────────────────────────────────────────────────
    useEffect(() => {
        isMountedRef.current = true;
        const token = localStorage.getItem('token');
        const ws    = new WebSocket(`${WS_BASE}/ws/table/${code}/?token=${token}`);
        wsRef.current = ws;

        ws.onopen = () => {
            if (!isMountedRef.current) return;
            setIsConnected(true);
        };

        ws.onmessage = (e) => {
            if (!isMountedRef.current) return;
            const data = JSON.parse(e.data);
            handleServerMessageRef.current(data);
        };

        ws.onclose = () => {
            if (!isMountedRef.current) return;
            setIsConnected(false);
        };

        ws.onerror = (err) => console.error('WebSocket error:', err);

        // Cleanup — called on unmount or when code changes
        return () => {
            isMountedRef.current = false;
            ws.onopen    = null;
            ws.onmessage = null;
            ws.onclose   = null;
            ws.close();
        };
    }, [code]); // Only re-connect when session code changes

    // ── WebSocket send helper ─────────────────────────────────────────────────
    const wsSend = useCallback((type, payload) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type, payload }));
        }
    }, []);

    // ── Dice roller ───────────────────────────────────────────────────────────
    const handleRoll = (sides) => {
        const result = rollDice(sides);
        wsSend('roll_dice', {
            dice:   `d${sides}`,
            result,
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
                id:    Date.now(),
                type:  'image',
                x:     100, y: 100, w: 200, h: 150,
                src:   ev.target.result,
                label: file.name,
            };
            setObjects((prev) => {
                const updated = [...prev, newObj];
                wsSend('add_image', { tokens: updated });
                return updated;
            });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    // ── Add token ─────────────────────────────────────────────────────────────
    const handleAddToken = () => {
        const newToken = {
            id:    Date.now(),
            type:  'token',
            x:     150, y: 150, w: 60, h: 60,
            src:   null,
            label: 'Token',
        };
        setObjects((prev) => {
            const updated = [...prev, newToken];
            wsSend('add_image', { tokens: updated });
            return updated;
        });
    };

    // ── Delete selected ───────────────────────────────────────────────────────
    const handleDelete = () => {
        if (!selectedId) return;
        setObjects((prev) => {
            const updated = prev.filter((o) => o.id !== selectedId);
            wsSend('delete_image', { tokens: updated });
            return updated;
        });
        setSelectedId(null);
    };

    // ── Canvas mouse events ───────────────────────────────────────────────────
    const canvasRef = useRef(null);

    const getObjectAt = (x, y) => {
        for (let i = objects.length - 1; i >= 0; i--) {
            const o = objects[i];
            if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) return o;
        }
        return null;
    };

    const isResizeHandle = (obj, x, y) => {
        const s = 10;
        return x >= obj.x + obj.w - s && x <= obj.x + obj.w + s / 2
            && y >= obj.y + obj.h - s && y <= obj.y + obj.h + s / 2;
    };

    const onMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
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
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

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
            wsSend('add_image', { tokens: objects });
        }
        setDragging(null);
        setResizing(null);
    };

    // ── Render ────────────────────────────────────────────────────────────────

    if (!session) return (
        <p style={{ color: '#e0d6c8', padding: '40px', textAlign: 'center' }}>Loading...</p>
    );

    console.log(session)

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
                </div>
                <button onClick={() => navigate('/table')} style={btnDangerStyle}>Leave</button>
            </div>

            {/* ── Main area ── */}
            <div style={mainAreaStyle}>

                {/* ── Canvas area ── */}
                <div style={canvasWrapperStyle}>
                    <div
                        ref={canvasRef}
                        style={canvasStyle}
                        onMouseDown={onMouseDown}
                        onMouseMove={onMouseMove}
                        onMouseUp={onMouseUp}
                        onMouseLeave={onMouseUp}
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
                                    userSelect:      'none',
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
                                {/* Resize handle — master only */}
                                {isMaster && selectedId === obj.id && (
                                    <div style={resizeHandleStyle}/>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* ── Toolbar — master only ── */}
                    {isMaster && (
                        <div style={toolbarStyle}>
                            <input
                                type="file" accept="image/*" ref={fileInputRef}
                                style={{ display: 'none' }} onChange={handleImageUpload}
                            />
                            <button style={toolBtnStyle} onClick={() => fileInputRef.current.click()}>
                                🖼️ Add Image
                            </button>
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
                        </div>
                    )}
                </div>

                {/* ── Right panel ── */}
                <div style={rightPanelStyle}>

                    {/* Dice roller */}
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

                    {/* Roll log */}
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

const canvasWrapperStyle = {
    display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden',
};

const canvasStyle = {
    flex: 1, position: 'relative',
    backgroundColor: '#111',
    backgroundImage: 'radial-gradient(circle, #1a1510 1px, transparent 1px)',
    backgroundSize: '30px 30px',
    overflow: 'hidden', cursor: 'default',
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
    backgroundColor: '#1a1510', borderTop: '1px solid #3a2e1e', flexShrink: 0,
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

export default GameTable;