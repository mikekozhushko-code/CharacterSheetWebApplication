import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Profile_style.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { authApi } from '../Api.jsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Masks an email address: wizard@gmail.com → wiz***@gmail.com */
const getMaskedEmail = (email) => {
    if (!email || !email.includes('@')) return email;
    const [name, domain] = email.split('@');
    return `${name.substring(0, 3)}***@${domain}`;
};

// ─── Change Password Modal ────────────────────────────────────────────────────

const ChangePasswordModal = ({ isOpen, onClose, email }) => {
    const { t } = useLanguage();
    const [step, setStep] = useState(1);
    const [code, setCode]           = useState('');
    const [newPass, setNewPass]     = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [error, setError]         = useState('');

    const handleClose = () => { setStep(1); setCode(''); setNewPass(''); setConfirmPass(''); setError(''); onClose(); };

    const handleVerify = () => {
        if (!code.trim()) { setError('Enter the verification code'); return; }
        // TODO: call verify endpoint
        setError('');
        setStep(2);
    };

    const handleUpdatePassword = () => {
        if (newPass !== confirmPass) { setError('Passwords do not match'); return; }
        if (newPass.length < 6)     { setError('Password must be at least 6 characters'); return; }
        // TODO: call update password endpoint
        setError('');
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <div className="epic-modal-overlay" onClick={handleClose}>
            <div className="epic-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="epic-modal-header">
                    <h3>{t('arcaneSecurity')}</h3>
                    <button className="epic-close-btn" onClick={handleClose}>×</button>
                </div>
                <div className="epic-modal-body">
                    {step === 1 ? (
                        <div className="security-step">
                            <p className="security-msg">
                                {t('securityMsg')} <br/>
                                <span className="highlight-email">{getMaskedEmail(email)}</span>
                            </p>
                            <div className="epic-field-group">
                                <label>{t('verificationCode')}</label>
                                <input
                                    type="text" placeholder="XB-99-21"
                                    className="epic-input text-center"
                                    value={code} onChange={(e) => setCode(e.target.value)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="security-step">
                            <div className="epic-field-group">
                                <label>{t('newPassword')}</label>
                                <input type="password" placeholder="••••••" className="epic-input"
                                    value={newPass} onChange={(e) => setNewPass(e.target.value)}/>
                            </div>
                            <div className="epic-field-group">
                                <label>{t('confirmPassword')}</label>
                                <input type="password" placeholder="••••••" className="epic-input"
                                    value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}/>
                            </div>
                        </div>
                    )}
                    {error && <p className="epic-error">{error}</p>}
                </div>
                <div className="epic-modal-footer">
                    {step === 1
                        ? <button className="epic-btn-save" onClick={handleVerify}>{t('verifyRune')}</button>
                        : <button className="epic-btn-save" onClick={handleUpdatePassword}>{t('updatePassBtn')}</button>
                    }
                </div>
            </div>
        </div>
    );
};

// ─── Character Card ───────────────────────────────────────────────────────────

const CharacterCard = ({ char, onOpen }) => {
    const { t } = useLanguage();

    // "New character" slot
    if (char.type === 'new') {
        return (
            <div className="epic-char-card new-slot" onClick={onOpen}>
                <div className="new-slot-inner">
                    <span className="epic-plus">+</span>
                    <span className="epic-new-text">{t('forgeLegend')}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="epic-char-card">
            <div className="epic-card-frame"/>
            <div
                className="epic-card-bg"
                style={{ backgroundImage: `url(http://localhost:8000${char.avatar})`, backgroundColor: '#1a120b' }}
            />
            <div className="epic-card-content">
                <div className="epic-card-header">
                    <span className="epic-lvl">{char.level}</span>
                </div>
                <div className="epic-card-footer">
                    <h3 className="epic-name">{char.name}</h3>
                    <p className="epic-race">
                        {char.race} • {t(char.class_type?.toLowerCase())}
                    </p>
                    <div className="epic-actions">
                        <button className="epic-btn-play" onClick={() => onOpen(char.id)}>
                            {t('openSheet')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Main Profile component ───────────────────────────────────────────────────

const Profile = () => {
    const { t, language } = useLanguage();
    const navigate        = useNavigate();
    const avatarInputRef  = useRef(null);

    // ── State ─────────────────────────────────────────────────────────────────
    const [user, setUser]                       = useState(null);
    const [formData, setFormData]               = useState({ username: '', bio: '' });
    const [activeTab, setActiveTab]             = useState('heroes');
    const [isPassModalOpen, setPassModalOpen]   = useState(false);
    const [isEditingEmail, setIsEditingEmail]   = useState(false);
    const [theme, setTheme]                     = useState('tavern');
    const [isSaving, setIsSaving]               = useState(false);

    // ── Fetch profile on mount ────────────────────────────────────────────────
    useEffect(() => {
        authApi().get('/profile/')
            .then((res) => {
                setUser(res.data);
                setTheme(res.data.theme ?? 'tavern');  // ← додай
                setFormData({ username: res.data.username ?? '', bio: res.data.bio ?? '' });
            })
            .catch((err) => console.error('GET /profile error:', err));
    }, []);

    const changeTheme = (newTheme) => {
        setTheme(newTheme);
        authApi()
            .patch('/profile/', { theme: newTheme })
            .catch((err) => console.error('Theme update error:', err));
    };

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    /** Saves username and bio via PATCH. */
    const saveChanges = async () => {
        setIsSaving(true);
        try {
            const res = await authApi().patch('/profile/', formData);
            setUser(res.data);
            setIsEditingEmail(false);
            alert(t('updateSuccess'));
        } catch (err) {
            console.error('PATCH /profile error:', err);
        } finally {
            setIsSaving(false);
        }
    };

    /** Uploads a new avatar image. */
    const handleAvatarUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formDataObj = new FormData();
        formDataObj.append('avatar', file);
        authApi()
            .patch('/profile/', formDataObj, { headers: { 'Content-Type': 'multipart/form-data' } })
            .then((res) => setUser(res.data))
            .catch((err) => console.error('Avatar upload error:', err));
    };

    /** Logs out the user and redirects to home. */
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };
    const handleCreateCharacter = async () => {
        try {
            const res = await authApi().post("/characters/create/", {
                name: "New Character",
            });
            const newCharacterId = res.data.id;
            alert("Character create success");
            navigate(`/character-info/${newCharacterId}/edit`);
        } catch (error) {
            alert(error);
        }
    };


    // ── Loading guard ─────────────────────────────────────────────────────────
    if (!user) return <p>Loading...</p>;

    // Append "new character" slot to the end of the characters list
    const characters = [...(user.characters ?? []), { id: 0, type: 'new' }];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className={`epic-wrapper bg-${theme} ${language === 'uk' ? 'lang-uk' : ''}`}>
            <Header />

            <div className="epic-container">

                {/* ── Profile header ── */}
                <div className="epic-profile-header">
                    <div className="epic-avatar-container">
                        <div
                            className="epic-avatar-frame"
                            onClick={() => avatarInputRef.current.click()}
                            style={{ cursor: 'pointer' }}
                            title={t('changePortrait')}
                        >
                            <input
                                type="file" accept="image/*" ref={avatarInputRef}
                                style={{ display: 'none' }} onChange={handleAvatarUpload}
                            />
                            {user.avatar
                                ? <img src={user.avatar} alt="User" onError={(e) => { e.target.style.display = 'none'; }}/>
                                : <div className="epic-avatar-placeholder">{user.username?.charAt(0)}</div>
                            }
                        </div>
                    </div>

                    <div className="epic-user-info">
                        <h1 className="epic-username">{user.username}</h1>
                        <p className="epic-bio">"{user.bio || '...'}"</p>
                        <p className="epic-joined-date">
                            Est. {new Date(user.created_at).getFullYear()}
                        </p>
                    </div>
                </div>

                {/* ── Tab navigation ── */}
                <div className="epic-nav-bar">
                    <div className="nav-line"/>
                    <button
                        className={`epic-nav-btn ${activeTab === 'heroes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('heroes')}
                    >
                        {t('myHeroes')}
                    </button>
                    <button
                        className={`epic-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        {t('settings')}
                    </button>
                    <div className="nav-line"/>
                </div>

                <div className="epic-content-area">

                    {/* ── Heroes tab ── */}
                    {activeTab === 'heroes' && (
                        <div className="epic-grid">
                            {characters.map((char) => (
                                <CharacterCard
                                    key={char.id}
                                    char={char}
                                    onOpen={char.type === 'new'
                                        ? handleCreateCharacter
                                        : () => navigate(`/character-info/${char.id}/edit`)
                                    }
                                />
                            ))}
                        </div>
                    )}

                    {/* ── Settings tab ── */}
                    {activeTab === 'settings' && (
                        <div className="epic-settings-panel">
                            <h2 className="settings-title">{t('accountScrolls')}</h2>

                            <div className="settings-grid">

                                {/* Avatar + theme */}
                                <div className="settings-section avatar-section">
                                    <div className="settings-avatar-preview">
                                        <img src={user.avatar} alt="Avatar"
                                            onError={(e) => { e.target.style.display = 'none'; }}/>
                                    </div>
                                    <button
                                        className="epic-btn-outline mb-20"
                                        onClick={() => avatarInputRef.current.click()}
                                    >
                                        {t('changePortrait')}
                                    </button>

                                    <label className="epic-label-small">{t('currentRealm')}</label>
                                    <div className="realm-selector">
                                        <button className={`realm-btn ${theme === 'tavern'  ? 'active' : ''}`} onClick={() => changeTheme('tavern')}  title={t('tavern')}>🍺</button>
                                        <button className={`realm-btn ${theme === 'forest'  ? 'active' : ''}`} onClick={() => changeTheme('forest')}  title={t('forest')}>🌲</button>
                                        <button className={`realm-btn ${theme === 'crypt'   ? 'active' : ''}`} onClick={() => changeTheme('crypt')}   title={t('crypt')}>💀</button>
                                        <button className={`realm-btn ${theme === 'citadel' ? 'active' : ''}`} onClick={() => changeTheme('citadel')} title={t('citadel')}>🏰</button>
                                    </div>
                                </div>

                                {/* Form fields */}
                                <div className="settings-section form-section">
                                    <div className="epic-field-group">
                                        <label>{t('advName')}</label>
                                        <input
                                            type="text" name="username"
                                            className="epic-input"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="epic-field-group">
                                        <label>{t('emailScroll')}</label>
                                        <div className="email-input-wrapper">
                                            {isEditingEmail ? (
                                                <input
                                                    type="email" name="email"
                                                    className="epic-input" autoFocus
                                                    value={formData.email ?? ''}
                                                    onChange={handleInputChange}
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    className="epic-input disabled"
                                                    value={getMaskedEmail(user.email)}
                                                    disabled
                                                />
                                            )}
                                            <button
                                                className="epic-icon-btn"
                                                onClick={() => setIsEditingEmail((v) => !v)}
                                            >
                                                {isEditingEmail ? '✖' : '✎'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="epic-field-group">
                                        <label>{t('legendAbout')}</label>
                                        <textarea
                                            name="bio"
                                            className="epic-input epic-textarea"
                                            value={formData.bio}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="settings-footer">
                                <button className="epic-btn-outline" onClick={() => setPassModalOpen(true)}>
                                    {t('changePass')}
                                </button>
                                <div className="spacer"/>
                                <button className="epic-btn-save" onClick={saveChanges} disabled={isSaving}>
                                    {isSaving ? '...' : t('saveChanges')}
                                </button>
                            </div>

                            <div className="settings-danger-zone">
                                <button className="epic-btn-danger" onClick={handleLogout}>
                                    {t('logOut')}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            <ChangePasswordModal
                isOpen={isPassModalOpen}
                onClose={() => setPassModalOpen(false)}
                email={user.email}
            />

            <Footer />
        </div>
    );
};

export default Profile;