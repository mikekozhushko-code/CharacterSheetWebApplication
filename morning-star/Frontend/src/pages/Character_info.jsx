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

const IconClock = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
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

// ─── Constants ────────────────────────────────────────────────────────────────

// XP required to reach the next level (key = current level)
const XP_THRESHOLDS = {
    1: 0, 2: 300, 3: 900, 4: 2700, 5: 6500,
    6: 14000, 7: 23000, 8: 34000, 9: 48000, 10: 64000,
    11: 85000, 12: 100000, 13: 120000, 14: 140000, 15: 165000,
    16: 195000, 17: 225000, 18: 265000, 19: 305000, 20: 355000,
};

// Maps English skill names (from server) to translation keys
const SKILL_NAME_TO_KEY = {
    'Athletics':       'athletics',
    'Acrobatics':      'acrobatics',
    'Sleight of Hand': 'sleight',
    'Stealth':         'stealth',
    'Arcana':          'arcana',
    'History':         'history',
    'Investigation':   'investigation',
    'Insight':         'insight',
    'Medicine':        'medicine',
    'Perception':      'perception',
    'Deception':       'deception',
    'Persuasion':      'persuasion',
};

// Creature size options with translation keys
const CREATURE_SIZES = [
    { value: 'Tiny',   key: 'sizeTiny'   },
    { value: 'Small',  key: 'sizeSmall'  },
    { value: 'Medium', key: 'sizeMedium' },
    { value: 'Large',  key: 'sizeLarge'  },
    { value: 'Huge',   key: 'sizeHuge'   },
];

// Default spell slot layout — used until the server returns saved data
const DEFAULT_SPELL_SLOTS = {
    1: { max: 4, used: 0 }, 2: { max: 2, used: 0 }, 3: { max: 0, used: 0 },
    4: { max: 0, used: 0 }, 5: { max: 0, used: 0 }, 6: { max: 0, used: 0 },
    7: { max: 0, used: 0 }, 8: { max: 0, used: 0 }, 9: { max: 0, used: 0 },
};

const SPELL_CLASSES     = ['All', 'bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard'];
const SPELL_LEVELS      = ['All', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const SPELL_TIER_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const COIN_TYPES        = ['pp', 'gp', 'sp', 'cp'];
const CALC_NUMPAD       = [7, 8, 9, 4, 5, 6, 1, 2, 3, 0];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const capitalize  = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
const getModifier = (score) => Math.floor((score - 10) / 2);

/** Extracts heal/damage dice from a spell description for the spell list badge. */
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

// ─── Small UI components ──────────────────────────────────────────────────────

/** Ability score card shown in the left column (STR, DEX, etc.). */
const VerticalStat = ({ stat, onClick, t }) => (
    <div className="v-stat-card" onClick={onClick}>
        <div className="v-stat-mod">{stat.mod}</div>
        <div className="v-stat-val">{stat.val}</div>
        {/* Use stat.id as translation key — matches 'str', 'dex', etc. */}
        <div className="v-stat-name">{t(stat.id).slice(0, 3).toUpperCase()}</div>
        <div className="v-stat-save-tiny">SV {stat.save}</div>
    </div>
);

/** Single skill row with a proficiency indicator dot. */
const SkillPanel = ({ skill, onClick, t }) => {
    // Server returns English name — map it to a translation key
    const translationKey = SKILL_NAME_TO_KEY[skill.n] ?? skill.n;
    return (
        <div className="skill-strip" onClick={onClick}>
            <div className={`skill-indicator ${skill.proof ? 'proficient' : ''}`}/>
            <span className="skill-name">
                {t(translationKey)} <span className="skill-stat-tag">({skill.id.toUpperCase()})</span>
            </span>
            <span className="skill-val">{skill.v}</span>
        </div>
    );
};

/** Inline-editable attack row (name / bonus / damage / delete). */
const AttackRow = ({ attack, onUpdate, onRemove }) => (
    <div className="attack-row-clean">
        <input type="text" className="clean-input name" value={attack.name}
            onChange={(e) => onUpdate(attack.id, 'name', e.target.value)}/>
        <div className="bonus-box">
            <input type="text" className="clean-input bonus" value={attack.bonus}
                onChange={(e) => onUpdate(attack.id, 'bonus', e.target.value)}/>
        </div>
        <div className="damage-box">
            <input type="text" className="clean-input damage" value={attack.damage}
                onChange={(e) => onUpdate(attack.id, 'damage', e.target.value)}/>
        </div>
        <button className="clean-delete-btn" onClick={() => onRemove(attack.id)}>−</button>
    </div>
);

// ─── Shared calculator primitives ─────────────────────────────────────────────

/** Input display row with a backspace button — shared by all calculator modals. */
const CalcScreen = ({ value, onBackspace }) => (
    <div className="calc-input-screen">
        <span>{value}</span>
        <button className="calc-backspace-btn" onClick={onBackspace}>⌫</button>
    </div>
);

/** Numpad grid (7-8-9 … 0) — shared by HP / XP / Money calculators. */
const CalcNumpad = ({ onDigit, extraSlots = null }) => (
    <div className="calc-grid">
        {CALC_NUMPAD.map((n) => (
            <button key={n} className="calc-key" onClick={() => onDigit(n)}>{n}</button>
        ))}
        {extraSlots ?? <><div className="calc-key"/><div className="calc-key"/></>}
    </div>
);

// ─── Modals ───────────────────────────────────────────────────────────────────

/** Edit a single ability score and its saving throw modifier. */
const StatModal = ({ isOpen, onClose, stat, onSave, t }) => {
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
                    <h3>{t(stat.id)} <span style={{ color: '#ffc400' }}>{displayMod}</span></h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <div className="modal-field">
                        <label>{t('score')}</label>
                        <input type="number" className="modal-input" value={localVal}
                            onChange={(e) => setLocalVal(e.target.value)}/>
                    </div>
                    <div className="modal-field">
                        <label>{t('saveBonus')}</label>
                        <input type="text" className="modal-input" value={localSave}
                            onChange={(e) => setLocalSave(e.target.value)}/>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="save-btn" onClick={handleSave}>{t('save')}</button>
                </div>
            </div>
        </div>
    );
};

/** Calculator for applying healing, damage, or temp HP. */
const HPCalculatorModal = ({ isOpen, onClose, currentHP, maxHP, onSave, t }) => {
    const [inputVal, setInputVal]         = useState('');
    const [localMax, setLocalMax]         = useState(maxHP);
    const [hitDie, setHitDie]             = useState('1d8');
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => { setLocalMax(maxHP); setInputVal(''); setShowSettings(false); }, [isOpen, maxHP]);

    if (!isOpen) return null;

    const applyChange = (type) => {
        const val   = parseInt(inputVal, 10) || 0;
        const raw   = type === 'heal' ? currentHP + val : currentHP - val;
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
                <CalcScreen value={inputVal} onBackspace={() => setInputVal((p) => p.slice(0, -1))}/>
                <CalcNumpad
                    onDigit={(n) => setInputVal((p) => p + n)}
                    extraSlots={
                        <>
                            <div className="calc-key calc-icon-slot" style={{ color: '#81c784' }}>🧪</div>
                            <div className="calc-key calc-icon-slot" style={{ color: '#e57373' }}>🩸</div>
                        </>
                    }
                />
                <div className="calc-actions-row">
                    <button className="calc-action-btn btn-temp"   onClick={() => applyChange('temp')}>{t('tempHp')}</button>
                    <button className="calc-action-btn btn-heal"   onClick={() => applyChange('heal')}>{t('heal')}</button>
                    <button className="calc-action-btn btn-damage" onClick={() => applyChange('dmg')}>{t('dmg')}</button>
                    <button
                        className={`calc-action-btn btn-settings-toggle ${showSettings ? 'active' : ''}`}
                        onClick={() => setShowSettings((s) => !s)}
                    >⚙️</button>
                </div>
                <div className={`calc-settings-drawer ${showSettings ? 'open' : ''}`}>
                    <div className="calc-settings-grid">
                        <div className="calc-input-group">
                            <span className="calc-label">{t('maxHp')}</span>
                            <input type="number" className="calc-settings-input" value={localMax}
                                onChange={(e) => setLocalMax(parseInt(e.target.value, 10) || 0)}/>
                        </div>
                        <div className="calc-input-group">
                            <span className="calc-label">{t('hitDie')}</span>
                            <input type="text" className="calc-settings-input" value={hitDie}
                                onChange={(e) => setHitDie(e.target.value)}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/** Calculator for adding XP and triggering level-up. */
const XPCalculatorModal = ({ isOpen, onClose, xp, maxXp, level, onSave, t }) => {
    const [inputVal, setInputVal]         = useState('');
    const [localXP, setLocalXP]           = useState(xp);
    const [localMaxXP, setLocalMaxXP]     = useState(maxXp);
    const [localLevel, setLocalLevel]     = useState(level);
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
                    <span style={{ fontSize: '24px', display: 'block', color: '#888' }}>{t('level')} {localLevel}</span>
                    <span className="calc-xp-accent">{localXP}</span> / {localMaxXP}
                </div>
                <CalcScreen value={inputVal} onBackspace={() => setInputVal((p) => p.slice(0, -1))}/>
                <CalcNumpad onDigit={(n) => setInputVal((p) => p + n)}/>
                <div className="calc-actions-row">
                    {localXP >= localMaxXP
                        ? <button className="calc-action-btn btn-level-up" onClick={handleLevelUp}>{t('levelUp')}</button>
                        : <button className="calc-action-btn btn-add-xp"   onClick={addXP}>{t('addXp')}</button>
                    }
                    <button
                        className={`calc-action-btn btn-settings-toggle ${showSettings ? 'active' : ''}`}
                        onClick={() => setShowSettings((s) => !s)}
                    >⚙️</button>
                </div>
                <div className={`calc-settings-drawer ${showSettings ? 'open' : ''}`}>
                    <div className="calc-settings-grid">
                        <div className="calc-input-group">
                            <span className="calc-label">{t('maxXp')}</span>
                            <input type="number" className="calc-settings-input" value={localMaxXP}
                                onChange={(e) => setLocalMaxXP(parseInt(e.target.value, 10) || 0)}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/** Calculator for adding or spending coins (pp / gp / sp / cp). */
const MoneyCalculatorModal = ({ isOpen, onClose, wallet, onSave, t }) => {
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
                    {COIN_TYPES.map((c) => (
                        <button key={c} className={`calc-coin-btn coin-${c} ${coin === c ? 'active' : ''}`} onClick={() => setCoin(c)}>
                            {c.toUpperCase()} <span>{localWallet[c]}</span>
                        </button>
                    ))}
                </div>
                <CalcScreen value={inputVal} onBackspace={() => setInputVal((p) => p.slice(0, -1))}/>
                <CalcNumpad onDigit={(n) => setInputVal((p) => p + n)}/>
                <div className="calc-actions-row">
                    <button className="calc-action-btn btn-add-xp" onClick={() => update('add')}>{t('add')}</button>
                    <button className="calc-action-btn btn-damage" onClick={() => update('sub')}>{t('remove')}</button>
                </div>
            </div>
        </div>
    );
};

/** Generic single-field text modal (name, race, class, AC, speed, etc.). */
const GenericEditModal = ({ isOpen, onClose, title, value, onSave, t }) => {
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
                    <button className="save-btn" onClick={() => { onSave(val); onClose(); }}>{t('save')}</button>
                </div>
            </div>
        </div>
    );
};

/**
 * Spell grimoire modal — browse the full spell list filtered by class and level,
 * toggle individual spells as prepared / unprepared.
 */
const SpellSettingsModal = ({ isOpen, onClose, learnedSpells, onToggleSpell, initialLevelFilter, t, currentSpellsData }) => {
    const [filterClass, setFilterClass]     = useState('All');
    const [filterLevel, setFilterLevel]     = useState('0');
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
                                            <span className="spi-level-tag">{t('lvl')} {spell.level}</span>
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

    // Pick the spell database that matches the active UI language
    const activeSpellsDatabase = language === 'uk' ? spellsDataUk : spellsDataEn;

    // ── Server-synced state ───────────────────────────────────────────────────
    const [character, setCharacter]                 = useState(null);
    const [char, setChar]                           = useState(null);
    const [stats, setStats]                         = useState([]);
    const [skills, setSkills]                       = useState([]);
    const [attacks, setAttacks]                     = useState([]);
    const [attackNotes, setAttackNotes]             = useState('');
    const [featuresNotes, setFeaturesNotes]         = useState('');
    const [inventoryCapacity, setInventoryCapacity] = useState('');
    const [creatureSize, setCreatureSize]           = useState('Medium');
    const [inventory, setInventory]                 = useState('');
    const [treasure, setTreasure]                   = useState('');
    const [notes, setNotes]                         = useState('');
    const [appearance, setAppearance]               = useState('');
    const [goals, setGoals]                         = useState('');

    // ── Spell state ───────────────────────────────────────────────────────────
    // mySpells stores full spell objects locally; only names are persisted to the DB
    const [mySpells, setMySpells]                 = useState([]);
    const [spellSlots, setSpellSlots]             = useState(DEFAULT_SPELL_SLOTS);
    const [modalLevelFilter, setModalLevelFilter] = useState(null);
    const [expandedSpells, setExpandedSpells]     = useState({});

    // ── UI-only state (not persisted to server) ───────────────────────────────
    const [activeTab, setActiveTab]       = useState('attacks');
    const [modals, setModals]             = useState({ stat: false, hp: false, xp: false, money: false, generic: false, spells: false });
    const [selectedStat, setSelectedStat] = useState(null);
    const [genericData, setGenericData]   = useState({ title: '', key: '' });

    // ── API layer ─────────────────────────────────────────────────────────────

    /**
     * Single source of truth for applying a server response to local state.
     * Called after every GET and PATCH so the UI always reflects what the DB holds.
     */
    const syncFromResponse = useCallback((data) => {
        setCharacter(data);
        setStats(data.stats   ?? []);
        setChar(data.char     ?? null);
        setSkills(data.skills ?? []);
        setAttacks(data.attacks ?? []);

        // Text fields — only update if the server returned the key
        if (data.attack_notes       !== undefined) setAttackNotes(data.attack_notes);
        if (data.features_notes     !== undefined) setFeaturesNotes(data.features_notes);
        if (data.inventory_capacity !== undefined) setInventoryCapacity(data.inventory_capacity);
        if (data.creature_size      !== undefined) setCreatureSize(data.creature_size);
        if (data.inventory          !== undefined) setInventory(data.inventory);
        if (data.treasure           !== undefined) setTreasure(data.treasure);
        if (data.notes              !== undefined) setNotes(data.notes);
        if (data.appearance         !== undefined) setAppearance(data.appearance);
        if (data.goals              !== undefined) setGoals(data.goals);

        // Resolve saved spell names back to full spell objects from the local JSON
        if (data.my_spells !== undefined) {
            setMySpells(activeSpellsDatabase.filter((s) => data.my_spells.includes(s.name)));
        }

        // Only replace spell slots if the server returned a non-empty object
        if (data.spell_slots !== undefined && Object.keys(data.spell_slots).length > 0) {
            setSpellSlots(data.spell_slots);
        }
    }, [activeSpellsDatabase]);

    /** Universal PATCH — accepts any payload, syncs the full response. */
    const patch = useCallback(async (payload) => {
        try {
            const res = await authApi().patch(`/character-info/${id}/`, payload);
            syncFromResponse(res.data);
        } catch (err) {
            console.error('PATCH /character-info error:', err);
        }
    }, [id, syncFromResponse]);

    const updateField = (key, value) => patch({ [key]: value });
    const updateBulk  = (data)       => patch(data);

    // ── Initial data fetch ────────────────────────────────────────────────────

    useEffect(() => {
        authApi()
            .get(`/character-info/${id}/`)
            .then((res) => syncFromResponse(res.data))
            .catch((err) => console.error('GET /character-info error:', err));
    }, [id, syncFromResponse]);

    // ── Modal helpers ─────────────────────────────────────────────────────────

    const toggleModal = (name, state) => setModals((prev) => ({ ...prev, [name]: state }));
    const openStat    = (stat)         => { setSelectedStat(stat); toggleModal('stat', true); };
    const openGeneric = (key, title)   => { setGenericData({ key, title }); toggleModal('generic', true); };

    // ── Character actions ─────────────────────────────────────────────────────

    /** Uploads a new avatar via multipart/form-data PATCH. */
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

    /** Saves updated ability score + saving throw bonus to the server. */
    const updateStat = (newStat) => {
        patch({ [newStat.id]: newStat.val, [`${newStat.id}_save`]: newStat.save });
    };

    /** Toggles a skill proficiency and persists the updated proficiencies array. */
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

    // ── Attack actions ────────────────────────────────────────────────────────

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

    // ── Spell actions ─────────────────────────────────────────────────────────

    /** Toggles a spell in the prepared list; persists only spell names to the DB. */
    const toggleSpell = (spell) => {
        const exists  = mySpells.some((s) => s.name === spell.name);
        const updated = exists
            ? mySpells.filter((s) => s.name !== spell.name)
            : [...mySpells, spell];
        setMySpells(updated);
        updateField('my_spells', updated.map((s) => s.name));
    };

    /** Marks a spell slot bubble as used/unused and saves the full slots object. */
    const toggleSlotUsage = (lvl, index) => {
        setSpellSlots((prev) => {
            const slot    = prev[lvl] ?? { max: 0, used: 0 };
            const newUsed = (index + 1) === slot.used ? index : index + 1;
            const updated = { ...prev, [lvl]: { ...slot, used: newUsed } };
            updateField('spell_slots', updated);
            return updated;
        });
    };

    const toggleSpellExpand      = (name) => setExpandedSpells((prev) => ({ ...prev, [name]: !prev[name] }));
    const openSpellModalForLevel = (lvl)  => { setModalLevelFilter(lvl); toggleModal('spells', true); };

    // ── Spell tier renderer ───────────────────────────────────────────────────

    /**
     * Renders one spell tier block (cantrips or a numbered level).
     * Non-cantrip tiers with zero slots and no spells are hidden entirely.
     */
    const renderSpellTier = (level) => {
        const tierSpells = mySpells.filter((s) => s.level === level);
        const slots      = spellSlots[level];
        const isCantrip  = level === 0;

        if (!isCantrip && (!slots || slots.max === 0) && tierSpells.length === 0) return null;

        return (
            <div className="spell-tier-block" key={level}>
                <div className="tier-header">
                    <div className="th-left">
                        <span className="th-level-badge">{isCantrip ? 'C' : level}</span>
                        <span className="th-title">{isCantrip ? t('cantrips') : `${t('level')} ${level}`}</span>
                        {!isCantrip && (
                            <div className="slot-bubbles">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`slot-bubble ${i < (slots?.used || 0) ? 'used' : ''}`}
                                        onClick={() => toggleSlotUsage(level, i)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                    <button className="tier-add-btn" onClick={() => openSpellModalForLevel(level)}>+</button>
                </div>

                <div className="tier-list-container">
                    {tierSpells.length === 0
                        ? <div className="tier-empty">{t('noSpells')}</div>
                        : tierSpells.map((spell) => {
                            const isExpanded = expandedSpells[spell.name];
                            const spellStats = getSpellStats(spell);
                            return (
                                <div
                                    key={spell.name}
                                    className={`spell-row-item ${isExpanded ? 'expanded' : ''}`}
                                    onClick={() => toggleSpellExpand(spell.name)}
                                >
                                    <div className="sr-header">
                                        <div className="sr-name">{spell.name}</div>
                                        <div className={`sr-info-box ${spellStats.className}`}>{spellStats.value}</div>
                                        <div className="sr-info">{spell.duration || 'Instant'}</div>
                                        <div className="sr-info">{spell.range || 'Touch'}</div>
                                    </div>
                                    {isExpanded && (
                                        <div className="sr-details">
                                            <div className="sr-meta-tags">
                                                <span>{capitalize(spell.school)}</span>
                                                <span>{spell.components?.join(', ').toUpperCase()}</span>
                                                <span>{spell.actionType}</span>
                                            </div>
                                            <p>{spell.description}</p>
                                            <button
                                                className="delete-spell-btn"
                                                onClick={(e) => { e.stopPropagation(); toggleSpell(spell); }}
                                            >
                                                {t('unprepare')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        );
    };

    // ── Derived values ────────────────────────────────────────────────────────

    // XP bar width as a percentage, capped at 100
    const xpPerc = Math.min(((char?.xp ?? 0) / (char?.maxXp ?? 300)) * 100, 100);

    const COMBAT_STATS = [
        { key: 'initiative',  label: t('initiative')  },
        { key: 'inspiration', label: t('inspiration') },
        { key: 'exhaustion',  label: t('exhaustion')  },
    ];

    const TABS = [
        { id: 'attacks',    label: t('tabAttacks') },
        { id: 'spells',     label: t('tabSpells')  },
        { id: 'inventory',  label: t('tabItems')   },
        { id: 'notes',      label: t('tabNotes')   },
        { id: 'appearance', label: t('tabLook')    },
        { id: 'goals',      label: t('tabGoals')   },
    ];

    const HUD_STATS = [
        { key: 'ac',    label: t('ac'),   modalTitle: t('armorClass')  },
        { key: 'speed', label: t('spd'),  modalTitle: t('speed')       },
        { key: 'prof',  label: t('prof'), modalTitle: t('proficiency') },
    ];

    // ── Loading guard ─────────────────────────────────────────────────────────

    if (!character || !char || !stats.length) return <p>Loading...</p>;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="char-info-wrapper">
            <Header />

            {/* ── HUD panel ── */}
            <div className="hud-panel">
                <div className="hud-left">
                    {/* Avatar — click to replace */}
                    <div className="hud-avatar" onClick={() => fileInputRef.current.click()}>
                        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload}/>
                        <img
                            src={character.avatar} alt="Avatar"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/150/15100d/ffc400?text=No+Image'; }}
                        />
                    </div>

                    {/* Name / race / class / XP bar */}
                    <div className="hud-info">
                        <h1 className="editable-text" onClick={() => openGeneric('name', t('characterName'))}>
                            {character.name} <span className="edit-icon">✎</span>
                        </h1>
                        <div className="hud-sub">
                            <span className="editable-text" onClick={() => openGeneric('race', t('race'))}>
                                {character.race || t('race')} <span className="edit-icon">✎</span>
                            </span>
                            <span className="hud-sub-separator">•</span>
                            <span className="editable-text" onClick={() => openGeneric('class_type', t('charClass'))}>
                                {character.class_type || t('charClass')} <span className="edit-icon">✎</span>
                            </span>
                        </div>
                        <div className="hud-xp-bar" onClick={() => toggleModal('xp', true)}>
                            <div className="hud-xp-fill" style={{ width: `${xpPerc}%` }}/>
                            <span className="hud-xp-text">{t('lvl')} {character.level} • {char.xp} / {char.maxXp}</span>
                        </div>
                    </div>
                </div>

                {/* AC / Speed / Prof / Gold / HP */}
                <div className="hud-stats">
                    {HUD_STATS.map(({ key, label, modalTitle }) => (
                        <div key={key} className="hud-stat-hex" onClick={() => openGeneric(key, modalTitle)}>
                            <span className="hex-val">{char[key]}</span>
                            <span className="hex-lbl">{label}</span>
                        </div>
                    ))}
                    <div className="hud-stat-pill" onClick={() => toggleModal('money', true)}>
                        <span style={{ color: '#ffc107' }}>$</span> {char.wallet.gp}
                    </div>
                    <div className="hud-hp-block" onClick={() => toggleModal('hp', true)}>
                        <img src="/assets/icons/Hp.svg" className="hud-hp-icon" alt="HP"/>
                        <div className="hud-hp-vals">{char.hpCurrent} <span className="max-hp">/{char.hpMax}</span></div>
                    </div>
                </div>
            </div>

            {/* ── Main three-column grid ── */}
            <div className="dashboard-grid">

                {/* LEFT: Ability scores */}
                <div className="col-attributes">
                    {stats.map((s) => <VerticalStat key={s.id} stat={s} t={t} onClick={() => openStat(s)}/>)}
                </div>

                {/* CENTER: Combat quick-stats + tabbed panes */}
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

                            {/* Attacks tab */}
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
                                    {/* Saved on blur — avoids a PATCH request on every keystroke */}
                                    <div className="sheet-section">
                                        <div className="sheet-label">{t('atkAndSpellcasting')}</div>
                                        <textarea className="sheet-textarea" value={attackNotes}
                                            onChange={(e) => setAttackNotes(e.target.value)}
                                            onBlur={() => updateField('attack_notes', attackNotes)}/>
                                    </div>
                                    <div className="sheet-section">
                                        <div className="sheet-label">{t('featuresAndTraits')}</div>
                                        <textarea className="sheet-textarea" value={featuresNotes}
                                            onChange={(e) => setFeaturesNotes(e.target.value)}
                                            onBlur={() => updateField('features_notes', featuresNotes)}/>
                                    </div>
                                </div>
                            )}

                            {/* Spells tab */}
                            {activeTab === 'spells' && (
                                <div className="deck-pane spells-container">
                                    <div className="spells-col-header">
                                        <span className="col-h-name">{t('spellName')}</span>
                                        <span className="col-h-icon"><IconSword/></span>
                                        <span className="col-h-icon"><IconClock/></span>
                                        <span className="col-h-icon"><IconTarget/></span>
                                    </div>
                                    {SPELL_TIER_LEVELS.map((lvl) => renderSpellTier(lvl))}
                                    <button className="settings-btn-long mt-20" onClick={() => openSpellModalForLevel('All')}>
                                        {t('openGrimoire')}
                                    </button>
                                </div>
                            )}

                            {/* Inventory tab */}
                            {activeTab === 'inventory' && (
                                <div className="deck-pane">
                                    <div className="inv-top-row">
                                        <div className="inv-field-group">
                                            <label>{t('carryingCapacity')}</label>
                                            <input type="text" className="inv-input-box" value={inventoryCapacity}
                                                placeholder={t('carryingCapacity')}
                                                onChange={(e) => setInventoryCapacity(e.target.value)}
                                                onBlur={() => updateField('inventory_capacity', inventoryCapacity)}/>
                                        </div>
                                        <div className="inv-field-group small">
                                            <label>{t('size')}</label>
                                            <select className="inv-select-box" value={creatureSize}
                                                onChange={(e) => setCreatureSize(e.target.value)}
                                                onBlur={() => updateField('creature_size', creatureSize)}
                                            >
                                                {CREATURE_SIZES.map(({ value, key }) => (
                                                    <option key={value} value={value}>{t(key)}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="sheet-section">
                                        <div className="sheet-label">{t('equipment')}</div>
                                        <textarea className="sheet-textarea large" value={inventory}
                                            placeholder={t('phEquipment')}
                                            onChange={(e) => setInventory(e.target.value)}
                                            onBlur={() => updateField('inventory', inventory)}/>
                                    </div>
                                    <div className="sheet-section">
                                        <div className="sheet-label">{t('treasures')}</div>
                                        <textarea className="sheet-textarea large" value={treasure}
                                            placeholder={t('phTreasures')}
                                            onChange={(e) => setTreasure(e.target.value)}
                                            onBlur={() => updateField('treasure', treasure)}/>
                                    </div>
                                </div>
                            )}

                            {/* Notes tab */}
                            {activeTab === 'notes' && (
                                <div className="deck-pane">
                                    <textarea className="epic-textarea" value={notes} placeholder={t('phNotes')}
                                        onChange={(e) => setNotes(e.target.value)}
                                        onBlur={() => updateField('notes', notes)}/>
                                </div>
                            )}

                            {/* Appearance tab */}
                            {activeTab === 'appearance' && (
                                <div className="deck-pane">
                                    <textarea className="epic-textarea" value={appearance} placeholder={t('phLook')}
                                        onChange={(e) => setAppearance(e.target.value)}
                                        onBlur={() => updateField('appearance', appearance)}/>
                                </div>
                            )}

                            {/* Goals tab */}
                            {activeTab === 'goals' && (
                                <div className="deck-pane">
                                    <textarea className="epic-textarea" value={goals} placeholder={t('phGoals')}
                                        onChange={(e) => setGoals(e.target.value)}
                                        onBlur={() => updateField('goals', goals)}/>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* RIGHT: Skills panel */}
                <div className="col-skills-panel">
                    <div className="panel-header">{t('skillsTitle')}</div>
                    {skills.map((s, i) => (
                        <SkillPanel key={`${s.id}-${i}`} skill={s} t={t} onClick={() => toggleSkillProficiency(s.n)}/>
                    ))}
                    {/* Passive scores — static for now, can be derived from stats later */}
                    <div className="passives-box">
                        <div className="passive-line"><span className="pv-val">12</span> {t('perception')}</div>
                        <div className="passive-line"><span className="pv-val">14</span> {t('investigation')}</div>
                        <div className="passive-line"><span className="pv-val">10</span> {t('insight')}</div>
                    </div>
                </div>

            </div>

            {/* ── Modals ── */}
            <StatModal
                isOpen={modals.stat} onClose={() => toggleModal('stat', false)}
                stat={selectedStat}  onSave={updateStat} t={t}
            />
            <HPCalculatorModal
                isOpen={modals.hp} onClose={() => toggleModal('hp', false)}
                currentHP={char.hpCurrent} maxHP={char.hpMax} t={t}
                onSave={(hpCurrent, hpMax) => updateBulk({ hp_current: hpCurrent, hp_max: hpMax })}
            />
            <XPCalculatorModal
                isOpen={modals.xp} onClose={() => toggleModal('xp', false)}
                xp={char.xp} maxXp={char.maxXp} level={char.level} t={t}
                onSave={(xp, max_xp, level) => updateBulk({ xp, max_xp, level })}
            />
            <MoneyCalculatorModal
                isOpen={modals.money} onClose={() => toggleModal('money', false)}
                wallet={char.wallet} t={t} onSave={(wallet) => updateField('wallet', wallet)}
            />
            <GenericEditModal
                isOpen={modals.generic} onClose={() => toggleModal('generic', false)}
                title={genericData.title} value={char[genericData.key]} t={t}
                onSave={(v) => updateField(genericData.key, v)}
            />
            <SpellSettingsModal
                isOpen={modals.spells}
                onClose={() => toggleModal('spells', false)}
                learnedSpells={mySpells}
                onToggleSpell={toggleSpell}
                initialLevelFilter={modalLevelFilter}
                t={t}
                currentSpellsData={activeSpellsDatabase}
            />

            <Footer />
        </div>
    );
};

export default Character_info;