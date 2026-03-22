import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../Api.jsx';
import Header from '../components/Header';
import Footer from '../components/Footer';

// ─── GameLobby ────────────────────────────────────────────────────────────────

const GameLobby = () => {
    const navigate = useNavigate();

    // ── Create session state ──────────────────────────────────────────────────
    const [sessionName, setSessionName] = useState('');
    const [isCreating, setIsCreating]   = useState(false);
    const [createError, setCreateError] = useState('');

    // ── Join session state ────────────────────────────────────────────────────
    const [joinCode, setJoinCode]   = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [joinError, setJoinError] = useState('');

    // ── Handlers ──────────────────────────────────────────────────────────────

    /** Creates a new session and navigates to the table. */
    const handleCreate = async () => {
        if (!sessionName.trim()) { setCreateError('Enter a session name'); return; }
        setIsCreating(true);
        setCreateError('');
        try {
            const res = await authApi().post('/table/create/', { name: sessionName });
            navigate(`/table/${res.data.code}`);
        } catch (err) {
            setCreateError('Failed to create session. Try again.');
            console.error('Create session error:', err);
        } finally {
            setIsCreating(false);
        }
    };

    /** Joins an existing session by code and navigates to the table. */
    const handleJoin = async () => {
        if (!joinCode.trim()) { setJoinError('Enter a session code'); return; }
        setIsJoining(true);
        setJoinError('');
        try {
            const res = await authApi().post('/table/join/', { code: joinCode.toUpperCase() });
            navigate(`/table/${res.data.code}`);
        } catch (err) {
            if (err.response?.status === 404) setJoinError('Session not found. Check the code.');
            else setJoinError('Failed to join. Try again.');
            console.error('Join session error:', err);
        } finally {
            setIsJoining(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0d0d0d', color: '#e0d6c8' }}>
            <Header />

            <div style={{ maxWidth: '600px', margin: '80px auto', padding: '0 20px' }}>
                <h1 style={{ textAlign: 'center', color: '#ffc400', letterSpacing: '2px', marginBottom: '48px' }}>
                    ⚔️ Game Table
                </h1>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                    {/* ── Create session ── */}
                    <div style={cardStyle}>
                        <h2 style={cardTitleStyle}>🎲 Create Session</h2>
                        <p style={cardDescStyle}>Start a new game as Dungeon Master</p>
                        <input
                            type="text"
                            placeholder="Session name..."
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                            style={inputStyle}
                        />
                        {createError && <p style={errorStyle}>{createError}</p>}
                        <button
                            onClick={handleCreate}
                            disabled={isCreating}
                            style={btnPrimaryStyle}
                        >
                            {isCreating ? '...' : 'Create'}
                        </button>
                    </div>

                    {/* ── Join session ── */}
                    <div style={cardStyle}>
                        <h2 style={cardTitleStyle}>🚪 Join Session</h2>
                        <p style={cardDescStyle}>Join an existing game as Player</p>
                        <input
                            type="text"
                            placeholder="Session code..."
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                            maxLength={8}
                            style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '4px', textAlign: 'center' }}
                        />
                        {joinError && <p style={errorStyle}>{joinError}</p>}
                        <button
                            onClick={handleJoin}
                            disabled={isJoining}
                            style={btnSecondaryStyle}
                        >
                            {isJoining ? '...' : 'Join'}
                        </button>
                    </div>

                </div>
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

const cardTitleStyle = {
    color: '#ffc400',
    margin: 0,
    fontSize: '18px',
};

const cardDescStyle = {
    color: '#888',
    margin: 0,
    fontSize: '13px',
};

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

const errorStyle = {
    color: '#e57373',
    fontSize: '12px',
    margin: 0,
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

export default GameLobby;