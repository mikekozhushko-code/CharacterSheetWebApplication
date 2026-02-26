import React, { useState } from 'react';
import '../styles/Profile_style.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext'; // ✅ Імпорт

const getMaskedEmail = (email) => {
    if (!email || !email.includes('@')) return email;
    const [name, domain] = email.split('@');
    const visiblePart = name.substring(0, 3);
    return `${visiblePart}***@${domain}`;
};

const ChangePasswordModal = ({ isOpen, onClose, email }) => {
    const { t } = useLanguage(); // ✅ Додаємо переклад
    const [step, setStep] = useState(1); 

    if (!isOpen) return null;

    const handleVerify = () => setStep(2); 
    
    const handleClose = () => {
        setStep(1);
        onClose();
    };

    return (
        <div className="epic-modal-overlay" onClick={handleClose}>
            <div className="epic-modal-content" onClick={e => e.stopPropagation()}>
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
                                <input type="text" placeholder="XB-99-21" className="epic-input text-center" />
                            </div>
                        </div>
                    ) : (
                        <div className="security-step">
                            <div className="epic-field-group">
                                <label>{t('newPassword')}</label>
                                <input type="password" placeholder="••••••" className="epic-input" />
                            </div>
                            <div className="epic-field-group">
                                <label>{t('confirmPassword')}</label>
                                <input type="password" placeholder="••••••" className="epic-input" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="epic-modal-footer">
                    {step === 1 ? (
                        <button className="epic-btn-save" onClick={handleVerify}>{t('verifyRune')}</button>
                    ) : (
                        <button className="epic-btn-save" onClick={handleClose}>{t('updatePassBtn')}</button>
                    )}
                </div>
            </div>
        </div>
    );
};

const CharacterCard = ({ char }) => {
    const { t } = useLanguage(); // ✅ Додаємо переклад
    if (char.type === 'new') {
        return (
            <div className="epic-char-card new-slot">
                <div className="new-slot-inner">
                    <span className="epic-plus">+</span>
                    <span className="epic-new-text">{t('forgeLegend')}</span>
                </div>
            </div>
        );
    }
    return (
        <div className="epic-char-card">
            <div className="epic-card-frame"></div>
            <div className="epic-card-bg" style={{backgroundImage: `url(${char.img})`, backgroundColor: '#1a120b'}}></div>
            <div className="epic-card-content">
                <div className="epic-card-header">
                    <span className="epic-lvl">{char.lvl}</span>
                </div>
                <div className="epic-card-footer">
                    <h3 className="epic-name">{char.name}</h3>
                    <p className="epic-race">{char.race} • {t(char.class.toLowerCase())}</p> {/* ✅ Переклад класу */}
                    <div className="epic-actions">
                        <button className="epic-btn-play">{t('openSheet')}</button>
                        <button className="epic-btn-edit">⚙️</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Profile = () => {
    const { t, language } = useLanguage(); // ✅ Додаємо t та мову
    const [activeTab, setActiveTab] = useState('heroes');
    const [isPassModalOpen, setPassModalOpen] = useState(false);
    const [isEditingEmail, setIsEditingEmail] = useState(false);

    const [user, setUser] = useState({
        name: "DungeonMaster_99",
        email: "wizard_master@gmail.com",
        rank: "Grand Wizard",
        avatar: "/assets/images/user_avatar_main.jpg",
        theme: "tavern", 
        about: "Weaving tales of darkness and glory since the 3rd Era.",
        joined: "Est. 2024"
    });

    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        about: user.about
    });

    const characters = [
        { id: 1, name: "DreadNote", class: "Wizard", race: "Tiefling", lvl: 3, img: "/assets/images/Wizard.jpg" },
        { id: 2, name: "Thorgar", class: "Barbarian", race: "Dwarf", lvl: 5, img: "/assets/images/Barbarian.jpg" },
        { id: 3, name: "Elara", class: "Rogue", race: "Elf", lvl: 2, img: "/assets/images/Rogue.jpg" },
        { id: 0, name: "New", type: "new" } 
    ];

    const changeTheme = (newTheme) => {
        setUser(prev => ({ ...prev, theme: newTheme }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const saveChanges = () => {
        setUser(prev => ({
            ...prev,
            name: formData.name,
            email: formData.email,
            about: formData.about
        }));
        setIsEditingEmail(false);
        alert(t('updateSuccess')); // ✅ Локалізоване сповіщення
    };

    return (
        <div className={`epic-wrapper bg-${user.theme} ${language === 'uk' ? 'lang-uk' : ''}`}>
            <Header />
            
            <div className="epic-container">
                
                <div className="epic-profile-header">
                    <div className="epic-avatar-container">
                        <div className="epic-avatar-frame">
                            {user.avatar ? (
                                <img src={user.avatar} alt="User" onError={(e) => e.target.style.display='none'} />
                            ) : (
                                <div className="epic-avatar-placeholder">{user.name.charAt(0)}</div>
                            )}
                        </div>
                        <div className="epic-rank-banner">{user.rank}</div>
                    </div>
                    
                    <div className="epic-user-info">
                        <h1 className="epic-username">{user.name}</h1>
                        <p className="epic-bio">“{user.about}”</p>
                        <p className="epic-joined-date">{user.joined}</p>
                    </div>
                </div>

                <div className="epic-nav-bar">
                    <div className="nav-line"></div>
                    <button className={`epic-nav-btn ${activeTab === 'heroes' ? 'active' : ''}`} onClick={() => setActiveTab('heroes')}>{t('myHeroes')}</button>
                    <button className={`epic-nav-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>{t('settings')}</button>
                    <div className="nav-line"></div>
                </div>

                <div className="epic-content-area">
                    
                    {activeTab === 'heroes' && (
                        <div className="epic-grid">
                            {characters.map(char => (
                                <CharacterCard key={char.id} char={char} />
                            ))}
                        </div>
                    )}
                    
                    {activeTab === 'settings' && (
                         <div className="epic-settings-panel">
                            <h2 className="settings-title">{t('accountScrolls')}</h2>

                            <div className="settings-grid">
                                
                                <div className="settings-section avatar-section">
                                    <div className="settings-avatar-preview">
                                        <img src={user.avatar} alt="Avatar" />
                                    </div>
                                    <button className="epic-btn-outline mb-20">{t('changePortrait')}</button>

                                    <label className="epic-label-small">{t('currentRealm')}</label>
                                    <div className="realm-selector">
                                        <button className={`realm-btn ${user.theme === 'tavern' ? 'active' : ''}`} onClick={() => changeTheme('tavern')} title={t('tavern')}>🍺</button>
                                        <button className={`realm-btn ${user.theme === 'forest' ? 'active' : ''}`} onClick={() => changeTheme('forest')} title={t('forest')}>🌲</button>
                                        <button className={`realm-btn ${user.theme === 'crypt' ? 'active' : ''}`} onClick={() => changeTheme('crypt')} title={t('crypt')}>💀</button>
                                        <button className={`realm-btn ${user.theme === 'citadel' ? 'active' : ''}`} onClick={() => changeTheme('citadel')} title={t('citadel')}>🏰</button>
                                    </div>
                                </div>

                                <div className="settings-section form-section">
                                    <div className="epic-field-group">
                                        <label>{t('advName')}</label>
                                        <input 
                                            type="text" 
                                            name="name"
                                            value={formData.name} 
                                            onChange={handleInputChange} 
                                            className="epic-input" 
                                        />
                                    </div>

                                    <div className="epic-field-group">
                                        <label>{t('emailScroll')}</label>
                                        <div className="email-input-wrapper">
                                            {isEditingEmail ? (
                                                <input 
                                                    type="email" 
                                                    name="email"
                                                    value={formData.email} 
                                                    onChange={handleInputChange} 
                                                    className="epic-input"
                                                    autoFocus
                                                />
                                            ) : (
                                                <input 
                                                    type="text" 
                                                    name="email"
                                                    value={getMaskedEmail(user.email)} 
                                                    disabled 
                                                    className="epic-input disabled" 
                                                />
                                            )}
                                            <button 
                                                className="epic-icon-btn" 
                                                onClick={() => setIsEditingEmail(!isEditingEmail)}
                                                title="Edit Email"
                                            >
                                                {isEditingEmail ? "✖" : "✎"}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="epic-field-group">
                                        <label>{t('legendAbout')}</label>
                                        <textarea 
                                            name="about"
                                            value={formData.about} 
                                            onChange={handleInputChange} 
                                            className="epic-input epic-textarea" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="settings-footer">
                                <button className="epic-btn-outline" onClick={() => setPassModalOpen(true)}>{t('changePass')}</button>
                                <div className="spacer"></div>
                                <button className="epic-btn-save" onClick={saveChanges}>{t('saveChanges')}</button>
                            </div>

                            <div className="settings-danger-zone">
                                <button className="epic-btn-danger">{t('logOut')}</button>
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