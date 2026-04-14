import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../Api.jsx';
import Header from '../components/Header';
import Footer from '../components/Footer';

const GameLobby = () => {
    const navigate = useNavigate();

    // ── State ─────────────────────────────────────────────────────────────────
    const [masterSessions, setMasterSessions] = useState([]);
    const [joinedSessions, setJoinedSessions] = useState([]);
    const [isLoading,      setIsLoading]      = useState(true);

    const [sessionName, setSessionName] = useState('');
    const [isCreating,  setIsCreating]  = useState(false);
    const [createError, setCreateError] = useState('');

    const [joinCode,  setJoinCode]  = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [joinError, setJoinError] = useState('');

    // ── Fetch my sessions ─────────────────────────────────────────────────────
    const fetchSessions = async () => {
        setIsLoading(true);
        try {
            const res = await authApi().get('/table/my/');
            setMasterSessions(res.data.master);
            setJoinedSessions(res.data.joined);
        } catch (err) {
            console.error('Fetch sessions error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchSessions(); }, []);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleCreate = async () => {
        if (!sessionName.trim()) { setCreateError('Введіть назву сесії'); return; }
        setIsCreating(true);
        setCreateError('');
        try {
            const res = await authApi().post('/table/create/', { name: sessionName });
            navigate(`/table/${res.data.code}`);
        } catch (err) {
            setCreateError('Не вдалось створити сесію');
            console.error(err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoin = async () => {
        if (!joinCode.trim()) { setJoinError('Введіть код сесії'); return; }
        setIsJoining(true);
        setJoinError('');
        try {
            const res = await authApi().post('/table/join/', { code: joinCode.toUpperCase() });
            navigate(`/table/${res.data.code}`);
        } catch (err) {
            if (err.response?.status === 404) setJoinError('Сесію не знайдено');
            else setJoinError('Не вдалось приєднатись');
            console.error(err);
        } finally {
            setIsJoining(false);
        }
    };

    const handleDelete = async (pk) => {
        if (!window.confirm('Видалити цей стіл?')) return;
        try {
            await authApi().delete(`/table/my/${pk}/`);
            setMasterSessions((prev) => prev.filter((s) => s.id !== pk));
        } catch (err) {
            console.error('Delete error:', err);
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

                {/* ── Create + Join ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '48px' }}>

                    <div style={cardStyle}>
                        <h2 style={cardTitleStyle}>🎲 Новий стіл</h2>
                        <p style={cardDescStyle}>Створити гру як Dungeon Master</p>
                        <input
                            type="text"
                            placeholder="Назва кампанії..."
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
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
                            type="text"
                            placeholder="КОД СЕСІЇ..."
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
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
                        {/* Мої столи */}
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
                                            <div style={{ display: 'flex', gap: '8px' }}>
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

                        {/* Приєднані столи */}
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
                                            <button style={btnEnterStyle} onClick={() => navigate(`/table/${s.code}`)}>
                                                Увійти
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Порожній стан */}
                        {masterSessions.length === 0 && joinedSessions.length === 0 && (
                            <p style={{ textAlign: 'center', color: '#444', fontSize: '14px' }}>
                                У тебе ще немає столів. Створи новий або приєднайся до існуючого!
                            </p>
                        )}
                    </>
                )}
            </div>

            <Footer />
        </div>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const cardStyle = {
    backgroundColor: '#1a1510',
    border: '1px solid #3a2e1e',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
};

const cardTitleStyle = { color: '#ffc400', margin: 0, fontSize: '18px' };
const cardDescStyle  = { color: '#888', margin: 0, fontSize: '13px' };
const errorStyle     = { color: '#e57373', fontSize: '12px', margin: 0 };

const inputStyle = {
    backgroundColor: '#0d0d0d',
    border: '1px solid #3a2e1e',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#e0d6c8',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
};

const btnPrimaryStyle = {
    backgroundColor: '#ffc400',
    color: '#0d0d0d',
    border: 'none',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: 'auto',
};

const btnSecondaryStyle = {
    backgroundColor: 'transparent',
    color: '#ffc400',
    border: '1px solid #ffc400',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: 'auto',
};

const sectionTitleStyle = {
    color: '#888',
    fontSize: '12px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    marginBottom: '12px',
};

const tableListStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
};

const tableRowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    backgroundColor: '#1a1510',
    border: '1px solid #3a2e1e',
    borderRadius: '10px',
};

const btnEnterStyle = {
    backgroundColor: 'transparent',
    color: '#ffc400',
    border: '1px solid #ffc400',
    borderRadius: '8px',
    padding: '8px 20px',
    fontSize: '13px',
    cursor: 'pointer',
};

const btnDeleteStyle = {
    backgroundColor: 'transparent',
    color: '#e57373',
    border: '1px solid #e57373',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    cursor: 'pointer',
};

export default GameLobby;