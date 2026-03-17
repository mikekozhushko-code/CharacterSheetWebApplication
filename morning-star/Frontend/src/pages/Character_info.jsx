import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import spellsDataEn from '../data/spells.json';
import spellsDataUk from '../data/spells-ukr.json';
import '../styles/Character_style.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { authApi } from '../Api.jsx';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconSword = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/>
    </svg>
);

const IconTarget = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
);

const IconSkull = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6 0"/><path d="M10 22l4 0"/><path d="M12 2v4"/><circle cx="12" cy="12" r="8"/>
        <path d="M9.5 12a.5 .5 0 1 0 0 -1a.5 .5 0 0 0 0 1"/><path d="M14.5 12a.5 .5 0 1 0 0 -1a.5 .5 0 0 0 0 1"/>
    </svg>
);

const IconChevronDown = ({ rotated }) => (
    <svg
        width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="3"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: rotated ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }}
    >
        <polyline points="6 9 12 15 18 9"/>
    </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
const getModifier = (score) => Math.floor((score - 10) / 2);

const getSpellStats = (spell) => {
    const desc = spell.description || '';

    const healMatch = desc.match(/(?:regains|restores|regain|restore).*?(\d+d\d+(?:\s?\+\s?\d+)?)/i);
    if (healMatch) return { value: `${healMatch[1]} Heal`, className: 'stat-heal' };

    const dmgMatch = desc.match(/(\d+d\d+(?:\s?\+\s?\d+)?)\s(\w+)\sdamage/i);
    if (dmgMatch) return { value: `${dmgMatch[1]} ${capitalize(dmgMatch[2])}`, className: 'stat-dmg' };

    const genericMatch = desc.match(/(\d+d\d+)/);
    if (genericMatch) return { value: genericMatch[1], className: '' };

    return { value: '-', className: '' };
};

const XP_THRESHOLDS = {
    1: 0, 2: 300, 3: 900, 4: 2700, 5: 6500,
    6: 14000, 7: 23000, 8: 34000, 9: 48000, 10: 64000,
    11: 85000, 12: 100000, 13: 120000, 14: 140000, 15: 165000,
    16: 195000, 17: 225000, 18: 265000, 19: 305000, 20: 355000,
};

const SPELL_CLASSES = ['All', 'bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard'];
const SPELL_LEVELS  = ['All', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

// ─── Small UI components ──────────────────────────────────────────────────────

const VerticalStat = ({ stat, onClick }) => (
    <div className="v-stat-card" onClick={onClick}>
        <div className="v-stat-mod">{stat.mod}</div>
        <div className="v-stat-val">{stat.val}</div>
        <div className="v-stat-name">{stat.name.slice(0, 3).toUpperCase()}</div>
        <div className="v-stat-save-tiny">SV {stat.save}</div>
    </div>
);

const SkillPanel = ({ skill, onClick }) => (
    <div className="skill-strip" onClick={onClick}>
        <div className={`skill-indicator ${skill.proof ? 'proficient' : ''}`}/>
        <span className="skill-name">
            {skill.n} <span className="skill-stat-tag">({skill.id.toUpperCase()})</span>
        </span>
        <span className="skill-val">{skill.v}</span>
    </div>
);

const AttackRow = ({ attack, onUpdate, onRemove }) => (
    <div className="attack-row-clean">
        <input
            type="text" className="clean-input name" value={attack.name}
            onChange={(e) => onUpdate(attack.id, 'name', e.target.value)}
        />
        <div className="bonus-box">
            <input
                type="text" className="clean-input bonus" value={attack.bonus}
                onChange={(e) => onUpdate(attack.id, 'bonus', e.target.value)}
            />
        </div>
        <div className="damage-box">
            <input
                type="text" className="clean-input damage" value={attack.damage}
                onChange={(e) => onUpdate(attack.id, 'damage', e.target.value)}
            />
        </div>
        <button className="clean-delete-btn" onClick={() => onRemove(attack.id)}>−</button>
    </div>
);

// ─── Modals ───────────────────────────────────────────────────────────────────

const StatModal = ({ isOpen, onClose, stat, onSave }) => {
    const [localVal, setLocalVal]   = useState(stat?.val ?? 10);
    const [localSave, setLocalSave] = useState(stat?.save ?? 0);

    useEffect(() => {
        if (stat) { setLocalVal(stat.val); setLocalSave(stat.save); }
    }, [stat]);

    if (!isOpen || !stat) return null;

    const modifier   = getModifier(localVal);
    const displayMod = modifier >= 0 ? `+${modifier}` : String(modifier);

    const handleSave = () => {
        onSave({ ...stat, val: parseInt(localVal, 10), mod: displayMod, save: localSave });
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{stat.name} <span style={{ color: '#ffc400' }}>{displayMod}</span></h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <div className="modal-field">
                        <label>Score</label>
                        <input type="number" className="modal-input" value={localVal} onChange={(e) => setLocalVal(e.target.value)}/>
                    </div>
                    <div className="modal-field">
                        <label>Save Bonus</label>
                        <input type="text" className="modal-input" value={localSave} onChange={(e) => setLocalSave(e.target.value)}/>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="save-btn" onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    );
};

const HPCalculatorModal = ({ isOpen, onClose, currentHP, maxHP, onSave }) => {
    const [inputVal, setInputVal]     = useState('');
    const [localMax, setLocalMax]     = useState(maxHP);
    const [hitDie, setHitDie]         = useState('1d8');
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => { setLocalMax(maxHP); setInputVal(''); setShowSettings(false); }, [isOpen, maxHP]);

    if (!isOpen) return null;

    const applyChange = (type) => {
        const val  = parseInt(inputVal, 10) || 0;
        const raw  = type === 'heal' ? currentHP + val : currentHP - val;
        const newHP = Math.max(0, Math.min(raw, localMax));
        onSave(newHP, localMax);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content calculator-theme" onClick={(e) => e.stopPropagation()}>
                <div className="calc-header"><button className="close-btn" onClick={onClose}>×</button></div>
                <div className="calc-main-display">
                    <span style={{ color: '#e57373' }}>♥</span>{' '}
                    <span className="calc-val-accent">{currentHP}</span> / {localMax}
                </div>
                <div className="calc-input-screen">
                    <span>{inputVal}</span>
                    <button className="calc-backspace-btn" onClick={() => setInputVal((p) => p.slice(0, -1))}>⌫</button>
                </div>
                <div className="calc-grid">
                    {[7, 8, 9, 4, 5, 6, 1, 2, 3, 0].map((n) => (
                        <button key={n} className="calc-key" onClick={() => setInputVal((p) => p + n)}>{n}</button>
                    ))}
                    <div className="calc-key calc-icon-slot" style={{ color: '#81c784' }}>🧪</div>
                    <div className="calc-key calc-icon-slot" style={{ color: '#e57373' }}>🩸</div>
                </div>
                <div className="calc-actions-row">
                    <button className="calc-action-btn btn-temp"   onClick={() => applyChange('temp')}>Temp</button>
                    <button className="calc-action-btn btn-heal"   onClick={() => applyChange('heal')}>Heal</button>
                    <button className="calc-action-btn btn-damage" onClick={() => applyChange('dmg')}>Dmg</button>
                    <button
                        className={`calc-action-btn btn-settings-toggle ${showSettings ? 'active' : ''}`}
                        onClick={() => setShowSettings((s) => !s)}
                    >⚙️</button>
                </div>
                <div className={`calc-settings-drawer ${showSettings ? 'open' : ''}`}>
                    <div className="calc-settings-grid">
                        <div className="calc-input-group">
                            <span className="calc-label">Max HP</span>
                            <input type="number" className="calc-settings-input" value={localMax}
                                onChange={(e) => setLocalMax(parseInt(e.target.value, 10) || 0)}/>
                        </div>
                        <div className="calc-input-group">
                            <span className="calc-label">Hit Die</span>
                            <input type="text" className="calc-settings-input" value={hitDie} onChange={(e) => setHitDie(e.target.value)}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const XPCalculatorModal = ({ isOpen, onClose, xp, maxXp, level, onSave }) => {
    const [inputVal, setInputVal]     = useState('');
    const [localXP, setLocalXP]       = useState(xp);
    const [localMaxXP, setLocalMaxXP] = useState(maxXp);
    const [localLevel, setLocalLevel] = useState(level);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        setLocalXP(xp); setLocalMaxXP(maxXp); setLocalLevel(level); setInputVal('');
    }, [isOpen, xp, maxXp, level]);

    if (!isOpen) return null;

    const addXP = () => {
        const newXP = localXP + (parseInt(inputVal, 10) || 0);
        setLocalXP(newXP); setInputVal('');
        onSave(newXP, localMaxXP, localLevel);
    };

    const handleLevelUp = () => {
        const newXP    = localXP - localMaxXP;
        const newLevel = localLevel + 1;
        const newMaxXP = XP_THRESHOLDS[newLevel + 1] ?? localMaxXP;
        setLocalXP(newXP); setLocalLevel(newLevel); setLocalMaxXP(newMaxXP);
        onSave(newXP, newMaxXP, newLevel);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content calculator-theme" onClick={(e) => e.stopPropagation()}>
                <div className="calc-header"><button className="close-btn" onClick={onClose}>×</button></div>
                <div className="calc-main-display">
                    <span style={{ fontSize: '24px', display: 'block', color: '#888' }}>Level {localLevel}</span>
                    <span className="calc-xp-accent">{localXP}</span> / {localMaxXP}
                </div>
                <div className="calc-input-screen">
                    <span>{inputVal}</span>
                    <button className="calc-backspace-btn" onClick={() => setInputVal((p) => p.slice(0, -1))}>⌫</button>
                </div>
                <div className="calc-grid">
                    {[7, 8, 9, 4, 5, 6, 1, 2, 3, 0].map((n) => (
                        <button key={n} className="calc-key" onClick={() => setInputVal((p) => p + n)}>{n}</button>
                    ))}
                    <div className="calc-key"/><div className="calc-key"/>
                </div>
                <div className="calc-actions-row">
                    {localXP >= localMaxXP
                        ? <button className="calc-action-btn btn-level-up" onClick={handleLevelUp}>Level Up</button>
                        : <button className="calc-action-btn btn-add-xp"   onClick={addXP}>Add XP</button>
                    }
                    <button
                        className={`calc-action-btn btn-settings-toggle ${showSettings ? 'active' : ''}`}
                        onClick={() => setShowSettings((s) => !s)}
                    >⚙️</button>
                </div>
                <div className={`calc-settings-drawer ${showSettings ? 'open' : ''}`}>
                    <div className="calc-settings-grid">
                        <div className="calc-input-group">
                            <span className="calc-label">Max XP</span>
                            <input type="number" className="calc-settings-input" value={localMaxXP}
                                onChange={(e) => setLocalMaxXP(parseInt(e.target.value, 10) || 0)}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MoneyCalculatorModal = ({ isOpen, onClose, wallet, onSave }) => {
    const [inputVal, setInputVal]       = useState('');
    const [coin, setCoin]               = useState('gp');
    const [localWallet, setLocalWallet] = useState(wallet);

    useEffect(() => { setLocalWallet(wallet); setInputVal(''); }, [isOpen, wallet]);

    if (!isOpen) return null;

    const update = (type) => {
        const val    = parseInt(inputVal, 10) || 0;
        const newAmt = type === 'add' ? localWallet[coin] + val : Math.max(0, localWallet[coin] - val);
        const newW   = { ...localWallet, [coin]: newAmt };
        setLocalWallet(newW); setInputVal(''); onSave(newW);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content calculator-theme" onClick={(e) => e.stopPropagation()}>
                <div className="calc-header"><button className="close-btn" onClick={onClose}>×</button></div>
                <div className="calc-main-display" style={{ color: '#ffc107' }}>{localWallet.gp} G</div>
                <div className="calc-coin-row">
                    {['pp', 'gp', 'sp', 'cp'].map((c) => (
                        <button key={c} className={`calc-coin-btn coin-${c} ${coin === c ? 'active' : ''}`} onClick={() => setCoin(c)}>
                            {c.toUpperCase()} <span>{localWallet[c]}</span>
                        </button>
                    ))}
                </div>
                <div className="calc-input-screen">
                    <span>{inputVal}</span>
                    <button className="calc-backspace-btn" onClick={() => setInputVal((p) => p.slice(0, -1))}>⌫</button>
                </div>
                <div className="calc-grid">
                    {[7, 8, 9, 4, 5, 6, 1, 2, 3, 0].map((n) => (
                        <button key={n} className="calc-key" onClick={() => setInputVal((p) => p + n)}>{n}</button>
                    ))}
                    <div className="calc-key"/><div className="calc-key"/>
                </div>
                <div className="calc-actions-row">
                    <button className="calc-action-btn btn-add-xp"  onClick={() => update('add')}>Add</button>
                    <button className="calc-action-btn btn-damage"   onClick={() => update('sub')}>Rem</button>
                </div>
            </div>
        </div>
    );
};

const GenericEditModal = ({ isOpen, onClose, title, value, onSave }) => {
    const [val, setVal] = useState(value ?? '');

    useEffect(() => setVal(value ?? ''), [isOpen, value]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ width: '300px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <input className="modal-input" value={val} onChange={(e) => setVal(e.target.value)}/>
                </div>
                <div className="modal-footer">
                    <button className="save-btn" onClick={() => { onSave(val); onClose(); }}>Save</button>
                </div>
            </div>
        </div>
    );
};

const SpellSettingsModal = ({ isOpen, onClose, learnedSpells, onToggleSpell, initialLevelFilter, t, currentSpellsData }) => {
    const [filterClass, setFilterClass]   = useState('All');
    const [filterLevel, setFilterLevel]   = useState('0');
    const [expandedSpell, setExpandedSpell] = useState(null);

    useEffect(() => {
        if (isOpen && initialLevelFilter !== null) setFilterLevel(initialLevelFilter.toString());
        setExpandedSpell(null);
    }, [isOpen, initialLevelFilter]);

    if (!isOpen) return null;

    const filteredSpells = currentSpellsData.filter((spell) => {
        const classMatch = filterClass === 'All' || spell.classes?.includes(filterClass);
        const levelMatch = filterLevel === 'All' || spell.level.toString() === filterLevel;
        return classMatch && levelMatch;
    });

    const isLearned  = (name) => learnedSpells.some((s) => s.name === name);
    const toggleDesc = (name) => setExpandedSpell((prev) => (prev === name ? null : name));

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content spell-settings-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{t('arcaneGrimoire')}</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <div className="spell-config-body">
                    <div className="filters-row">
                        <select className="filter-select" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
                            {SPELL_CLASSES.map((c) => (
                                <option key={c} value={c}>{c === 'All' ? t('allClasses') : t(c)}</option>
                            ))}
                        </select>
                        <select className="filter-select" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
                            {SPELL_LEVELS.map((l) => (
                                <option key={l} value={l}>
                                    {l === 'All' ? t('allLevels') : l === '0' ? t('cantrips') : `${t('level')} ${l}`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="spell-picker-list">
                        {filteredSpells.map((spell) => {
                            const learned    = isLearned(spell.name);
                            const isExpanded = expandedSpell === spell.name;
                            const stats      = getSpellStats(spell);
                            return (
                                <div key={spell.name} className={`spell-picker-item-wrapper ${learned ? 'learned' : ''}`}>
                                    <div className="spell-picker-header" onClick={() => toggleDesc(spell.name)}>
                                        <div className="spi-left">
                                            <span className="spi-name">{spell.name}</span>
                                            <span className="spi-level-tag">Lvl {spell.level}</span>
                                            {stats.value !== '-' && <span className="spi-dmg-mini">{stats.value}</span>}
                                        </div>
                                        <div className="spi-right">
                                            <button
                                                className={`spi-btn ${learned ? 'prepared' : 'add'}`}
                                                onClick={(e) => { e.stopPropagation(); onToggleSpell(spell); }}
                                            >
                                                {learned ? t('prepared') : t('add')}
                                            </button>
                                            <div className="spi-chevron"><IconChevronDown rotated={isExpanded}/></div>
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div className="spell-picker-details">
                                            <div className="spd-meta">
                                                <span><strong>{t('school')}:</strong> {capitalize(spell.school)}</span>
                                                <span><strong>{t('time')}:</strong> {spell.actionType}</span>
                                                <span><strong>{t('range')}:</strong> {spell.range}</span>
                                                <span><strong>{t('dur')}:</strong> {spell.duration}</span>
                                            </div>
                                            <p className="spd-desc">{spell.description}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="save-btn close-grimoire" onClick={onClose}>{t('closeGrimoire')}</button>
                </div>
            </div>
        </div>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────

const Character_info = () => {
    const { t, language } = useLanguage();
    const { id }          = useParams();
    const fileInputRef    = useRef(null);

    const activeSpellsDatabase = language === 'uk' ? spellsDataUk : spellsDataEn;

    // ── Server state ──────────────────────────────────────────────────────────
    const [character, setCharacter] = useState(null);
    const [char, setChar]           = useState(null);
    const [stats, setStats]         = useState([]);
    const [skills, setSkills]       = useState([]);
    const [attacks, setAttacks]     = useState([]);
    const [attackNotes, setAttackNotes] = useState('');
    const [inventoryCapacity, setInventoryCapacity] = useState("");
    const [creatureSize, setCreatureSize] = useState("Medium");
    const [inventory, setInventory] = useState(""); 
    const [treasure, setTreasure] = useState("");   

    // ── UI state ──────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab]       = useState('attacks');
    const [featuresNotes, setFeaturesNotes] = useState('');
    const [modals, setModals]             = useState({ stat: false, hp: false, xp: false, money: false, generic: false });
    const [selectedStat, setSelectedStat] = useState(null);
    const [genericData, setGenericData]   = useState({ title: '', key: '' });

    // ── API helpers ───────────────────────────────────────────────────────────

    // Єдина функція синхронізації стейту з відповіддю сервера
    const syncFromResponse = useCallback((data) => {
        setCharacter(data);
        setStats(data.stats ?? []);
        setChar(data.char ?? null);
        setSkills(data.skills ?? []);
        setAttacks(data.attacks ?? []);
        if (data.attack_notes !== undefined) setAttackNotes(data.attack_notes);
        if (data.features_notes !== undefined) setFeaturesNotes(data.features_notes);
        if (data.inventory_capacity !== undefined) setInventoryCapacity(data.inventory_capacity);
        if (data.creature_size !== undefined) setCreatureSize(data.creature_size);
        if (data.inventory !== undefined) setInventory(data.inventory);
        if (data.treasure !== undefined) setTreasure(data.treasure);
    }, []);

    // Універсальний PATCH — приймає довільний payload
    const patch = useCallback(async (payload) => {
        try {
            const res = await authApi().patch(`/character-info/${id}/`, payload);
            syncFromResponse(res.data);
        } catch (err) {
            console.error('PATCH /character-info error:', err);
        }
    }, [id, syncFromResponse]);

    const updateField = (key, value)  => patch({ [key]: value });
    const updateBulk  = (data)        => patch(data);

    // ── Effects ───────────────────────────────────────────────────────────────

    useEffect(() => {
        authApi()
            .get(`/character-info/${id}/`)
            .then((res) => syncFromResponse(res.data))
            .catch((err) => console.error('GET /character-info error:', err));
    }, [id, syncFromResponse]);

    // ── Modal helpers ─────────────────────────────────────────────────────────

    const toggleModal = (name, state) => setModals((prev) => ({ ...prev, [name]: state }));
    const openStat    = (stat)  => { setSelectedStat(stat); toggleModal('stat', true); };
    const openGeneric = (key, title) => { setGenericData({ key, title }); toggleModal('generic', true); };

    // ── Character actions ─────────────────────────────────────────────────────

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('avatar', file);
        authApi()
            .patch(`/character-info/${id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            .then((res) => syncFromResponse(res.data))
            .catch((err) => console.error('Avatar upload error:', err.response?.data || err));
    };

    const updateStat = (newStat) => {
        patch({
            [newStat.id]: newStat.val,
            [`${newStat.id}_save`]: newStat.save,
        });
    };

    const toggleSkillProficiency = async (skillName) => {
        if (!character) return;
        const proficiencies = character.proficiencies ?? [];
        const updated = proficiencies.includes(skillName)
            ? proficiencies.filter((n) => n !== skillName)
            : [...proficiencies, skillName];
        try {
            const res = await authApi().patch(`/character-info/${id}/`, { proficiencies: updated });
            setCharacter(res.data);
            setSkills(res.data.skills ?? []);
        } catch (err) {
            console.error('Toggle skill error:', err);
        }
    };

    const addAttack = () => {
        const updated = [...attacks, { id: Date.now(), name: 'New Attack', bonus: '+0', damage: '1d6 Type' }];
        setAttacks(updated);
        updateField('attacks', updated);
    };

    const updateAttack = (attackId, field, value) => {
        const updated = attacks.map((att) => att.id === attackId ? { ...att, [field]: value } : att);
        setAttacks(updated);
        updateField('attacks', updated);
    };

    const removeAttack = (attackId) => {
        const updated = attacks.filter((att) => att.id !== attackId);
        setAttacks(updated);
        updateField('attacks', updated);
    };

    // ── Derived values ────────────────────────────────────────────────────────

    const xpPerc = Math.min(((char?.xp ?? 0) / (char?.maxXp ?? 300)) * 100, 100);

    const COMBAT_STATS = [
        { key: 'initiative',  label: 'INITIATIVE'  },
        { key: 'inspiration', label: 'INSPIRATION' },
        { key: 'exhaustion',  label: 'EXHAUSTION'  },
    ];

    const TABS = [
        { id: 'attacks',    label: t('tabAttacks') },
        { id: 'spells',     label: t('tabSpells')  },
        { id: 'inventory',  label: t('tabItems')   },
        { id: 'notes',      label: t('tabNotes')   },
        { id: 'appearance', label: t('tabLook')    },
        { id: 'goals',      label: t('tabGoals')   },
    ];

    // ── Render ────────────────────────────────────────────────────────────────

    if (!character || !char || !stats.length) return <p>Loading...</p>;

    return (
        <div className="char-info-wrapper">
            <Header />

            {/* ── HUD ── */}
            <div className="hud-panel">
                <div className="hud-left">
                    <div className="hud-avatar" onClick={() => fileInputRef.current.click()}>
                        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload}/>
                        <img
                            src={character.avatar} alt="Avatar"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/150/15100d/ffc400?text=No+Image'; }}
                        />
                    </div>
                    <div className="hud-info">
                        <h1 className="editable-text" onClick={() => openGeneric('name', 'Character Name')}>
                            {character.name} <span className="edit-icon">✎</span>
                        </h1>
                        <div className="hud-sub">
                            <span className="editable-text" onClick={() => openGeneric('race', 'Race')}>
                                {character.race || 'Race'} <span className="edit-icon">✎</span>
                            </span>
                            <span className="hud-sub-separator">•</span>
                            <span className="editable-text" onClick={() => openGeneric('class_type', 'Class')}>
                                {character.class_type || 'Class'} <span className="edit-icon">✎</span>
                            </span>
                        </div>
                        <div className="hud-xp-bar" onClick={() => toggleModal('xp', true)}>
                            <div className="hud-xp-fill" style={{ width: `${xpPerc}%` }}/>
                            <span className="hud-xp-text">LVL {character.level} • {char.xp} / {char.maxXp}</span>
                        </div>
                    </div>
                </div>

                <div className="hud-stats">
                    <div className="hud-stat-hex" onClick={() => openGeneric('ac', 'Armor Class')}>
                        <span className="hex-val">{char.ac}</span><span className="hex-lbl">AC</span>
                    </div>
                    <div className="hud-stat-hex" onClick={() => openGeneric('speed', 'Speed')}>
                        <span className="hex-val">{char.speed}</span><span className="hex-lbl">SPD</span>
                    </div>
                    <div className="hud-stat-hex" onClick={() => openGeneric('prof', 'Proficiency')}>
                        <span className="hex-val">{char.prof}</span><span className="hex-lbl">PROF</span>
                    </div>
                    <div className="hud-stat-pill" onClick={() => toggleModal('money', true)}>
                        <span style={{ color: '#ffc107' }}>$</span> {char.wallet.gp}
                    </div>
                    <div className="hud-hp-block" onClick={() => toggleModal('hp', true)}>
                        <img src="/assets/icons/Hp.svg" className="hud-hp-icon" alt="HP"/>
                        <div className="hud-hp-vals">{char.hpCurrent} <span className="max-hp">/{char.hpMax}</span></div>
                    </div>
                </div>
            </div>

            {/* ── Dashboard ── */}
            <div className="dashboard-grid">

                {/* LEFT: Attributes */}
                <div className="col-attributes">
                    {stats.map((s) => <VerticalStat key={s.id} stat={s} onClick={() => openStat(s)}/>)}
                </div>

                {/* CENTER: Tabs */}
                <div className="col-action-deck">
                    <div className="combat-quick-row">
                        {COMBAT_STATS.map(({ key, label }) => (
                            <div key={key} className="quick-stat" onClick={() => openGeneric(key, label)}>
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
                            {/* ATTACKS (Dark Theme) */}
                            {activeTab === 'attacks' && (
                                <div className="deck-pane">
                                    <div className="attack-header-labels">
                                        <span className="lbl-name"><IconSword /> {t('atkName')}</span>
                                        <span className="lbl-bonus"><IconTarget /> {t('atkBonus')}</span>
                                        <span className="lbl-dmg"><IconSkull /> {t('atkDamage')}</span>
                                        <div className="lbl-actions">
                                            <button className="small-add-btn" onClick={addAttack}>+</button>
                                        </div>
                                    </div>
                                    <div className="attacks-list-clean">
                                        {attacks.map((att) => (
                                            <AttackRow key={att.id} attack={att} onUpdate={updateAttack} onRemove={removeAttack}/>
                                        ))}
                                    </div>
                                    <div className="sheet-section">
                                        <div className="sheet-label">{t('atkAndSpellcasting')}</div>
                                        <textarea
                                            className="sheet-textarea"
                                            value={attackNotes}
                                            onChange={(e) => setAttackNotes(e.target.value)}
                                            onBlur={() => updateField('attack_notes', attackNotes)}  // ← додай
                                        />
                                    </div>
                                    <div className="sheet-section">
                                        <div className="sheet-label">{t('featuresAndTraits')}</div>
                                        <textarea
                                            className="sheet-textarea"
                                            value={featuresNotes}
                                            onChange={(e) => setFeaturesNotes(e.target.value)}
                                            onBlur={() => updateField('features_notes', featuresNotes)}  // ← додай
                                        />
                                    </div>
                                </div>
                            )}
                            {/* INVENTORY (Dark Theme) */}
                            {activeTab === 'inventory' && (
                                <div className="deck-pane">
                                    <div className="inv-top-row">
                                        <div className="inv-field-group">
                                            <label>CARRYING CAPACITY</label>
                                            <input
                                                type="text" className="inv-input-box"
                                                value={inventoryCapacity}
                                                onChange={(e) => setInventoryCapacity(e.target.value)}
                                                onBlur={() => updateField('inventory_capacity', inventoryCapacity)}
                                                placeholder="0 / 150 lb"
                                            />
                                        </div>
                                        <div className="inv-field-group small">
                                            <label>SIZE</label>
                                            {/* <select className="inv-select-box" value={creatureSize} onChange={(e) => setCreatureSize(e.target.value)}> */}
                                            <select
                                                className="inv-select-box"
                                                value={creatureSize}
                                                onChange={(e) => setCreatureSize(e.target.value)}
                                                onBlur={() => updateField('creature_size', creatureSize)}
                                            >
                                                <option>Tiny</option>
                                                <option>Small</option>
                                                <option>Medium</option>
                                                <option>Large</option>
                                                <option>Huge</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="sheet-section">
                                        <div className="sheet-label">EQUIPMENT</div>
                                            <textarea className="sheet-textarea large" value={inventory}
                                                onChange={(e) => setInventory(e.target.value)}
                                                onBlur={() => updateField('inventory', inventory)}
                                            />
                                        </div>
                                    <div className="sheet-section">
                                        <div className="sheet-label">TREASURES</div>
                                        <textarea className="sheet-textarea large" value={treasure}
                                            onChange={(e) => setTreasure(e.target.value)}
                                            onBlur={() => updateField('treasure', treasure)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Skills */}
                <div className="col-skills-panel">
                    <div className="panel-header">Skills</div>
                    {skills.map((s, i) => (
                        <SkillPanel key={`${s.id}-${i}`} skill={s} onClick={() => toggleSkillProficiency(s.n)}/>
                    ))}
                    <div className="passives-box">
                        <div className="passive-line"><span className="pv-val">12</span> Perception</div>
                        <div className="passive-line"><span className="pv-val">14</span> Investigation</div>
                        <div className="passive-line"><span className="pv-val">10</span> Insight</div>
                    </div>
                </div>
            </div>

            {/* ── Modals ── */}
            <StatModal
                isOpen={modals.stat} onClose={() => toggleModal('stat', false)}
                stat={selectedStat}  onSave={updateStat}
            />
            <HPCalculatorModal
                isOpen={modals.hp} onClose={() => toggleModal('hp', false)}
                currentHP={char.hpCurrent} maxHP={char.hpMax}
                onSave={(hpCurrent, hpMax) => updateBulk({ hp_current: hpCurrent, hp_max: hpMax })}
            />
            <XPCalculatorModal
                isOpen={modals.xp} onClose={() => toggleModal('xp', false)}
                xp={char.xp} maxXp={char.maxXp} level={char.level}
                onSave={(xp, max_xp, level) => updateBulk({ xp, max_xp, level })}
            />
            <MoneyCalculatorModal
                isOpen={modals.money} onClose={() => toggleModal('money', false)}
                wallet={char.wallet}  onSave={(wallet) => updateField('wallet', wallet)}
            />
            <GenericEditModal
                isOpen={modals.generic} onClose={() => toggleModal('generic', false)}
                title={genericData.title} value={char[genericData.key]}
                onSave={(v) => updateField(genericData.key, v)}
            />

            <Footer />
        </div>
    );
};

export default Character_info;