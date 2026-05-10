import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../Api.jsx';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DungeonCrawler from '../components/DungeonCrawler';

const GameLobby = () => {
    const navigate = useNavigate();

    const [masterSessions, setMasterSessions] = useState([]);
    const [joinedSessions, setJoinedSessions] = useState([]);
    const [isLoading,      setIsLoading]      = useState(true);

    const [sessionName, setSessionName] = useState('');
    const [isCreating,  setIsCreating]  = useState(false);
    const [createError, setCreateError] = useState('');

    const [joinCode,  setJoinCode]  = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [joinError, setJoinError] = useState('');

    const [showDungeon, setShowDungeon] = useState(false);

    // ── Wiki modal state ──────────────────────────────────────────────────────
    const [wikiModal,    setWikiModal]    = useState(null); // { sessionId, sessionName }
    const [worlds,       setWorlds]       = useState([]);
    const [wikiSettings, setWikiSettings] = useState({}); // { [sessionId]: WikiSettings }
    const [savingWiki,   setSavingWiki]   = useState(false);
    const [wikiForm,     setWikiForm]     = useState({ world: '', is_enabled: false });

    // ── Fetch sessions ────────────────────────────────────────────────────────
    const fetchSessions = async () => {
        setIsLoading(true);
        try {
            const res = await authApi.get('/table/my/');
            setMasterSessions(res.data.master);
            setJoinedSessions(res.data.joined);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // ── Fetch worlds для модалки ──────────────────────────────────────────────
    const fetchWorlds = async () => {
        try {
            const res = await authApi.get('/worlds/');
            setWorlds(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchSessions();
        fetchWorlds();
    }, []);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleCreate = async () => {
        if (!sessionName.trim()) { setCreateError('Введіть назву сесії'); return; }
        setIsCreating(true); setCreateError('');
        try {
            const res = await authApi.post('/table/create/', { name: sessionName });
            navigate(`/table/${res.data.code}`);
        } catch (err) {
            setCreateError('Не вдалось створити сесію');
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoin = async () => {
        if (!joinCode.trim()) { setJoinError('Введіть код сесії'); return; }
        setIsJoining(true); setJoinError('');
        try {
            const res = await authApi.post('/table/join/', { code: joinCode.toUpperCase() });
            navigate(`/table/${res.data.code}`);
        } catch (err) {
            if (err.response?.status === 404) setJoinError('Сесію не знайдено');
            else setJoinError('Не вдалось приєднатись');
        } finally {
            setIsJoining(false);
        }
    };

    const handleDelete = async (pk) => {
        if (!window.confirm('Видалити цей стіл?')) return;
        try {
            await authApi.delete(`/table/my/${pk}/`);
            setMasterSessions((prev) => prev.filter((s) => s.id !== pk));
        } catch (err) {
            console.error(err);
        }
    };

    // ── Wiki modal ────────────────────────────────────────────────────────────
    const openWikiModal = async (session) => {
        setWikiModal({ sessionId: session.id, sessionName: session.name });
        setWikiForm({ world: '', is_enabled: false });
        // Спробуємо завантажити існуючі налаштування
        try {
            const res = await authApi.get(`/sessions/${session.id}/wiki/`);
            setWikiForm({
                world:      res.data.world || '',
                is_enabled: res.data.is_enabled,
            });
        } catch (err) {
            // 404 — ще не налаштовано, це нормально
        }
    };

    const handleSaveWiki = async () => {
        setSavingWiki(true);
        try {
            await authApi.post(`/sessions/${wikiModal.sessionId}/wiki/`, {
                world:      wikiForm.world || null,
                is_enabled: wikiForm.is_enabled,
            });
            setWikiSettings((prev) => ({
                ...prev,
                [wikiModal.sessionId]: wikiForm,
            }));
            setWikiModal(null);
        } catch (err) {
            console.error(err);
        } finally {
            setSavingWiki(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0d0d0d', color: '#e0d6c8' }}>
            <Header />

            <div style={{ maxWidth: '860px', margin: '60px auto', padding: '0 20px' }}>
                <h1 style={{ textAlign: 'center', color: '#ffc400', letterSpacing: '2px', marginBottom: '48px' }}>
                    ⚔️ Game Lobby
                </h1>
                <button
                    onClick={() => setShowDungeon(true)}
                    style={{
                        background: "transparent", color: "#ffc400",
                        border: "1px solid #5e3a03", borderRadius: 8,
                        padding: "10px 20px", fontSize: 14, cursor: "pointer",
                        display: "block", margin: "0 auto 32px",
                    }}
                >🎮 Зіграти поки чекаєш</button>

                {/* ── Create + Join ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '48px' }}>
                    <div style={cardStyle}>
                        <h2 style={cardTitleStyle}>🎲 Новий стіл</h2>
                        <p style={cardDescStyle}>Створити гру як Dungeon Master</p>
                        <input
                            type="text" placeholder="Назва кампанії..."
                            value={sessionName} onChange={(e) => setSessionName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                            style={inputStyle}
                        />
                        {createError && <p style={errorStyle}>{createError}</p>}
                        <button onClick={handleCreate} disabled={isCreating} style={btnPrimaryStyle}>
                            {isCreating ? '...' : 'Створити'}
                        </button>
                    </div>

                    <div style={cardStyle}>
                        <h2 style={cardTitleStyle}>🚪 Приєднатись</h2>
                        <p style={cardDescStyle}>Увійти в гру як гравець</p>
                        <input
                            type="text" placeholder="КОД СЕСІЇ..."
                            value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                            maxLength={8}
                            style={{ ...inputStyle, letterSpacing: '4px', textAlign: 'center' }}
                        />
                        {joinError && <p style={errorStyle}>{joinError}</p>}
                        <button onClick={handleJoin} disabled={isJoining} style={btnSecondaryStyle}>
                            {isJoining ? '...' : 'Приєднатись'}
                        </button>
                    </div>
                </div>

                {/* ── Списки столів ── */}
                {isLoading ? (
                    <p style={{ textAlign: 'center', color: '#555' }}>Завантаження...</p>
                ) : (
                    <>
                        {masterSessions.length > 0 && (
                            <div style={{ marginBottom: '36px' }}>
                                <h3 style={sectionTitleStyle}>👑 Мої столи</h3>
                                <div style={tableListStyle}>
                                    {masterSessions.map((s) => (
                                        <div key={s.id} style={tableRowStyle}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ color: '#ffc400', fontWeight: 'bold', fontSize: '15px' }}>
                                                    {s.name}
                                                </span>
                                                <span style={{ color: '#555', fontSize: '12px', letterSpacing: '2px' }}>
                                                    {s.code}
                                                </span>
                                                <span style={{ color: '#444', fontSize: '11px' }}>
                                                    {s.scenes?.length || 0} сцен · {new Date(s.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                {/* Кнопка вікі */}
                                                <button
                                                    style={btnWikiStyle}
                                                    onClick={() => openWikiModal(s)}
                                                    title="Налаштувати вікі лору"
                                                >
                                                    📖 Вікі
                                                </button>
                                                <button style={btnEnterStyle} onClick={() => navigate(`/table/${s.code}`)}>
                                                    Увійти
                                                </button>
                                                <button style={btnDeleteStyle} onClick={() => handleDelete(s.id)}>
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {joinedSessions.length > 0 && (
                            <div>
                                <h3 style={sectionTitleStyle}>🎮 Столи де я граю</h3>
                                <div style={tableListStyle}>
                                    {joinedSessions.map((s) => (
                                        <div key={s.id} style={tableRowStyle}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ color: '#e0d6c8', fontWeight: 'bold', fontSize: '15px' }}>
                                                    {s.name}
                                                </span>
                                                <span style={{ color: '#555', fontSize: '12px', letterSpacing: '2px' }}>
                                                    {s.code}
                                                </span>
                                                <span style={{ color: '#444', fontSize: '11px' }}>
                                                    {new Date(s.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {/* Гравець може відкрити вікі якщо воно є */}
                                                <button
                                                    style={btnWikiStyle}
                                                    onClick={() => navigate(`/wiki/${s.id}`)}
                                                    title="Відкрити вікі лору"
                                                >
                                                    📖 Вікі
                                                </button>
                                                <button style={btnEnterStyle} onClick={() => navigate(`/table/${s.code}`)}>
                                                    Увійти
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {masterSessions.length === 0 && joinedSessions.length === 0 && (
                            <p style={{ textAlign: 'center', color: '#444', fontSize: '14px' }}>
                                У тебе ще немає столів. Створи новий або приєднайся до існуючого!
                            </p>
                        )}
                    </>
                )}
            </div>

            <Footer />

            {/* ── Wiki Modal ── */}
            {wikiModal && (
                <div style={modalOverlayStyle} onClick={() => setWikiModal(null)}>
                    <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                        <div style={modalHeaderStyle}>
                            <h2 style={{ margin: 0, color: '#ffc400', fontSize: '20px' }}>
                                📖 Вікі лору — {wikiModal.sessionName}
                            </h2>
                            <button style={modalCloseBtnStyle} onClick={() => setWikiModal(null)}>✕</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={modalLabelStyle}>Світ (лор)</label>
                                <select
                                    value={wikiForm.world}
                                    onChange={(e) => setWikiForm({ ...wikiForm, world: e.target.value })}
                                    style={modalSelectStyle}
                                >
                                    <option value="">— Не підключено —</option>
                                    {worlds.map((w) => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                                <p style={{ color: '#555', fontSize: '12px', margin: '6px 0 0' }}>
                                    Який світ показувати гравцям у вікі
                                </p>
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={wikiForm.is_enabled}
                                    onChange={(e) => setWikiForm({ ...wikiForm, is_enabled: e.target.checked })}
                                    style={{ width: '16px', height: '16px', accentColor: '#ffc400' }}
                                />
                                <span style={{ color: '#e0d6c8', fontSize: '14px' }}>
                                    Увімкнути вікі для гравців
                                </span>
                            </label>

                            {wikiForm.world && wikiForm.is_enabled && (
                                <div style={wikiPreviewStyle}>
                                    <span style={{ color: '#81c784', fontSize: '13px' }}>
                                        ✓ Гравці зможуть відкрити вікі через кнопку на сторінці лобі
                                    </span>
                                    <button
                                        style={{ ...btnWikiStyle, marginTop: '8px' }}
                                        onClick={() => navigate(`/wiki/${wikiModal.sessionId}`)}
                                    >
                                        Переглянути вікі →
                                    </button>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                                <button style={btnSecondaryStyle} onClick={() => setWikiModal(null)}>
                                    Скасувати
                                </button>
                                <button style={btnPrimaryStyle} onClick={handleSaveWiki} disabled={savingWiki}>
                                    {savingWiki ? 'Збереження...' : 'Зберегти'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showDungeon && <DungeonCrawler onClose={() => setShowDungeon(false)} />}
        </div>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const cardStyle = {
    backgroundColor: '#1a1510', border: '1px solid #3a2e1e',
    borderRadius: '12px', padding: '24px',
    display: 'flex', flexDirection: 'column', gap: '12px',
};
const cardTitleStyle = { color: '#ffc400', margin: 0, fontSize: '18px' };
const cardDescStyle  = { color: '#888', margin: 0, fontSize: '13px' };
const errorStyle     = { color: '#e57373', fontSize: '12px', margin: 0 };

const inputStyle = {
    backgroundColor: '#0d0d0d', border: '1px solid #3a2e1e',
    borderRadius: '8px', padding: '10px 14px',
    color: '#e0d6c8', fontSize: '14px', outline: 'none',
    width: '100%', boxSizing: 'border-box',
};

const btnPrimaryStyle = {
    backgroundColor: '#ffc400', color: '#0d0d0d', border: 'none',
    borderRadius: '8px', padding: '10px', fontSize: '14px',
    fontWeight: 'bold', cursor: 'pointer', marginTop: 'auto',
};
const btnSecondaryStyle = {
    backgroundColor: 'transparent', color: '#ffc400',
    border: '1px solid #ffc400', borderRadius: '8px',
    padding: '10px', fontSize: '14px', fontWeight: 'bold',
    cursor: 'pointer', marginTop: 'auto',
};
const btnEnterStyle = {
    backgroundColor: 'transparent', color: '#ffc400',
    border: '1px solid #ffc400', borderRadius: '8px',
    padding: '8px 20px', fontSize: '13px', cursor: 'pointer',
};
const btnDeleteStyle = {
    backgroundColor: 'transparent', color: '#e57373',
    border: '1px solid #e57373', borderRadius: '8px',
    padding: '8px 12px', fontSize: '13px', cursor: 'pointer',
};
const btnWikiStyle = {
    backgroundColor: 'transparent', color: '#81c784',
    border: '1px solid #81c784', borderRadius: '8px',
    padding: '8px 14px', fontSize: '13px', cursor: 'pointer',
};
const sectionTitleStyle = {
    color: '#888', fontSize: '12px', letterSpacing: '2px',
    textTransform: 'uppercase', marginBottom: '12px',
};
const tableListStyle = { display: 'flex', flexDirection: 'column', gap: '8px' };
const tableRowStyle  = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px', backgroundColor: '#1a1510',
    border: '1px solid #3a2e1e', borderRadius: '10px',
};

// Modal styles
const modalOverlayStyle = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(4px)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const modalStyle = {
    background: '#1a1510', border: '2px solid #835F0A',
    borderRadius: '12px', padding: '28px',
    width: '460px', maxWidth: '90vw',
    boxShadow: '0 0 40px rgba(0,0,0,0.8)',
};
const modalHeaderStyle = {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '24px',
    borderBottom: '1px solid #3a2e1e', paddingBottom: '12px',
};
const modalCloseBtnStyle = {
    background: 'none', border: 'none', color: '#888',
    fontSize: '18px', cursor: 'pointer',
};
const modalLabelStyle = {
    display: 'block', color: '#888', fontSize: '12px',
    textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px',
};
const modalSelectStyle = {
    width: '100%', backgroundColor: '#0d0d0d',
    border: '1px solid #3a2e1e', borderRadius: '8px',
    color: '#e0d6c8', padding: '10px 12px', fontSize: '14px', outline: 'none',
};
const wikiPreviewStyle = {
    backgroundColor: 'rgba(129,199,132,0.08)',
    border: '1px solid rgba(129,199,132,0.3)',
    borderRadius: '8px', padding: '12px 16px',
    display: 'flex', flexDirection: 'column', gap: '4px',
};

export default GameLobby;