import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { authApi } from '../Api.jsx';
import { useLanguage } from '../context/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Character_style.css';

const SKILL_NAME_TO_KEY = {
    'Athletics':       'athletics',   'Acrobatics':      'acrobatics',
    'Sleight of Hand': 'sleight',     'Stealth':         'stealth',
    'Arcana':          'arcana',      'History':         'history',
    'Investigation':   'investigation','Insight':         'insight',
    'Medicine':        'medicine',    'Perception':      'perception',
    'Deception':       'deception',   'Persuasion':      'persuasion',
    'Nature':          'nature',      'Religion':        'religion',
    'Animal Handling': 'animalHandling','Survival':      'survival',
    'Intimidation':    'intimidation','Performance':     'performance',
};

const VerticalStat = ({ stat, t }) => (
    <div className="v-stat-card">
        <div className="v-stat-mod">{stat.mod >= 0 ? `+${stat.mod}` : stat.mod}</div>
        <div className="v-stat-val">{stat.val}</div>
        <div className="v-stat-name">{t(stat.id).slice(0, 3).toUpperCase()}</div>
        <div className="v-stat-save-tiny">SV {stat.save}</div>
    </div>
);

const SkillPanel = ({ skill, t }) => {
    const translationKey = SKILL_NAME_TO_KEY[skill.n] ?? skill.n;
    return (
        <div className="skill-strip">
            <div className={`skill-indicator ${skill.proof ? 'proficient' : ''}`}/>
            <span className="skill-name">
                {t(translationKey)} <span className="skill-stat-tag">({skill.id.toUpperCase()})</span>
            </span>
            <span className="skill-val">{skill.v}</span>
        </div>
    );
};

const MasterCharacterView = () => {
    const { code, characterId } = useParams();
    const { t } = useLanguage();
    const [data, setData]       = useState(null);
    const [error, setError]     = useState(null);
    const [activeTab, setActiveTab] = useState('attacks');

    useEffect(() => {
        authApi.get(`/table/${code}/character/${characterId}/`)
            .then((res) => setData(res.data))
            .catch((err) => {
                if (err.response?.status === 403) setError('forbidden');
                else setError('invalid');
            });
    }, [code, characterId]);

    if (error === 'forbidden') return (
        <div><Header />
            <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                <div style={{ fontSize: '64px' }}>🔒</div>
                <h2 style={{ color: '#ffc400', marginTop: '16px' }}>Доступ заборонено</h2>
                <p style={{ color: '#888', marginTop: '8px' }}>Тільки майстер сесії може переглядати листи гравців.</p>
            </div>
        <Footer /></div>
    );

    if (error) return (
        <div><Header />
            <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                <div style={{ fontSize: '64px' }}>❌</div>
                <h2 style={{ color: '#ffc400', marginTop: '16px' }}>Не знайдено</h2>
            </div>
        <Footer /></div>
    );

    if (!data) return <p style={{ color: '#e0d6c8', padding: '40px', textAlign: 'center' }}>Loading...</p>;

    const { character } = data;
    const { char, stats, skills } = character;
    const xpPerc = Math.min(((char?.xp ?? 0) / (char?.maxXp ?? 300)) * 100, 100);

    const TABS = [
        { id: 'attacks',    label: t('tabAttacks') },
        { id: 'spells',     label: t('tabSpells')  },
        { id: 'inventory',  label: t('tabItems')   },
        { id: 'notes',      label: t('tabNotes')   },
        { id: 'appearance', label: t('tabLook')    },
        { id: 'goals',      label: t('tabGoals')   },
    ];

    const COMBAT_STATS = [
        { key: 'initiative',  label: t('initiative')  },
        { key: 'inspiration', label: t('inspiration') },
        { key: 'exhaustion',  label: t('exhaustion')  },
    ];

    const HUD_STATS = [
        { key: 'ac',    label: t('ac')   },
        { key: 'speed', label: t('spd')  },
        { key: 'prof',  label: t('prof') },
    ];

    return (
        <div className="char-info-wrapper">
            <Header />

            <div style={{
                textAlign: 'center', padding: '8px',
                backgroundColor: '#1a1005', color: '#ffc400',
                fontSize: '13px', letterSpacing: '1px',
                borderBottom: '1px solid #3a2e1e',
            }}>
                👑 Майстер · Перегляд листа персонажа — {character.name}
            </div>

            {/* HUD */}
            <div className="hud-panel">
                <div className="hud-left">
                    <div className="hud-avatar">
                        <img
                            src={character.avatar} alt="Avatar"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/150/15100d/ffc400?text=No+Image'; }}
                        />
                    </div>
                    <div className="hud-info">
                        <h1 className="editable-text">{character.name}</h1>
                        <div className="hud-sub">
                            <span>{character.race || '—'}</span>
                            <span className="hud-sub-separator">•</span>
                            <span>{character.class_type || '—'}</span>
                        </div>
                        <div className="hud-xp-bar">
                            <div className="hud-xp-fill" style={{ width: `${xpPerc}%` }}/>
                            <span className="hud-xp-text">{t('lvl')} {character.level} • {char.xp} / {char.maxXp}</span>
                        </div>
                    </div>
                </div>
                <div className="hud-stats">
                    {HUD_STATS.map(({ key, label }) => (
                        <div key={key} className="hud-stat-hex">
                            <span className="hex-val">{char[key]}</span>
                            <span className="hex-lbl">{label}</span>
                        </div>
                    ))}
                    <div className="hud-stat-pill">
                        <span style={{ color: '#ffc107' }}>$</span> {char.wallet?.gp ?? 0}
                    </div>
                    <div className="hud-hp-block">
                        <img src="/assets/icons/Hp.svg" className="hud-hp-icon" alt="HP"/>
                        <div className="hud-hp-vals">
                            {char.hpCurrent} <span className="max-hp">/{char.hpMax}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard */}
            <div className="dashboard-grid">
                <div className="col-attributes">
                    {stats.map((s) => <VerticalStat key={s.id} stat={s} t={t}/>)}
                </div>

                <div className="col-action-deck">
                    <div className="combat-quick-row">
                        {COMBAT_STATS.map(({ key, label }) => (
                            <div key={key} className="quick-stat">
                                <span className="qs-label">{label}</span>
                                <span className="qs-val">{char[key]}</span>
                            </div>
                        ))}
                    </div>

                    <div className="deck-tabs-wrapper">
                        <div className="deck-nav">
                            {TABS.map(({ id: tabId, label }) => (
                                <label key={tabId} className={activeTab === tabId ? 'active' : ''} onClick={() => setActiveTab(tabId)}>
                                    {label}
                                </label>
                            ))}
                        </div>

                        <div className="deck-content">
                            {activeTab === 'attacks' && (
                                <div className="deck-pane">
                                    <div className="attacks-list-clean">
                                        {(character.attacks ?? []).map((att) => (
                                            <div key={att.id} className="attack-row-clean">
                                                <span className="clean-input name">{att.name}</span>
                                                <div className="bonus-box"><span className="clean-input bonus">{att.bonus}</span></div>
                                                <div className="damage-box"><span className="clean-input damage">{att.damage}</span></div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="sheet-section">
                                        <div className="sheet-label">{t('atkAndSpellcasting')}</div>
                                        <p className="sheet-readonly-text">{character.attack_notes || '—'}</p>
                                    </div>
                                    <div className="sheet-section">
                                        <div className="sheet-label">{t('featuresAndTraits')}</div>
                                        <p className="sheet-readonly-text">{character.features_notes || '—'}</p>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'spells' && (
                                <div className="deck-pane">
                                    <p className="sheet-readonly-text" style={{ color: '#888', textAlign: 'center', paddingTop: '40px' }}>
                                        Spells view coming soon
                                    </p>
                                </div>
                            )}
                            {activeTab === 'inventory' && (
                                <div className="deck-pane">
                                    <div className="sheet-section">
                                        <div className="sheet-label">{t('equipment')}</div>
                                        <p className="sheet-readonly-text">{character.inventory || '—'}</p>
                                    </div>
                                    <div className="sheet-section">
                                        <div className="sheet-label">{t('treasures')}</div>
                                        <p className="sheet-readonly-text">{character.treasure || '—'}</p>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'notes' && (
                                <div className="deck-pane">
                                    <p className="sheet-readonly-text">{character.notes || '—'}</p>
                                </div>
                            )}
                            {activeTab === 'appearance' && (
                                <div className="deck-pane">
                                    <p className="sheet-readonly-text">{character.appearance || '—'}</p>
                                </div>
                            )}
                            {activeTab === 'goals' && (
                                <div className="deck-pane">
                                    <p className="sheet-readonly-text">{character.goals || '—'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-skills-panel">
                    <div className="panel-header">{t('skillsTitle')}</div>
                    {skills.map((s, i) => (
                        <SkillPanel key={`${s.id}-${i}`} skill={s} t={t}/>
                    ))}
                    <div className="passives-box">
                        <div className="passive-line"><span className="pv-val">—</span> {t('perception')}</div>
                        <div className="passive-line"><span className="pv-val">—</span> {t('investigation')}</div>
                        <div className="passive-line"><span className="pv-val">—</span> {t('insight')}</div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default MasterCharacterView;
