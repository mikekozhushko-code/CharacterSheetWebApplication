import React, { useState, useEffect, useRef } from 'react';
import spellsDataEn from '../data/spells.json';
import spellsDataUk from '../data/spells-ukr.json';
import '../styles/Character_style.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import spellsData from '../data/spells.json';
import { useLanguage } from '../context/LanguageContext'; 
import { authApi } from '../Api.jsx';
import { useParams } from 'react-router-dom';

const IconSword = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/></svg>;
const IconClock = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconTarget = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
const IconSkull = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6 0" /><path d="M10 22l4 0" /><path d="M12 2v4" /><circle cx="12" cy="12" r="8" /><path d="M9.5 12a.5 .5 0 1 0 0 -1a.5 .5 0 0 0 0 1" /><path d="M14.5 12a.5 .5 0 1 0 0 -1a.5 .5 0 0 0 0 1" /></svg>;
const IconChevronDown = ({ rotated }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: rotated ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>;

// --- HELPERS ---
const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
const getModifier = (score) => Math.floor((score - 10) / 2);

const getSpellStats = (spell) => {
    const desc = spell.description || "";
    let statText = "-";
    let typeClass = "";
    const healRegex = /(?:regains|restores|regain|restore).*?(\d+d\d+(?:\s?\+\s?\d+)?)/i;
    const healMatch = desc.match(healRegex);
    if (healMatch) {
        statText = `${healMatch[1]} Heal`;
        typeClass = "stat-heal";
    } else {
        const damageRegex = /(\d+d\d+(?:\s?\+\s?\d+)?)\s(\w+)\sdamage/i;
        const damageMatch = desc.match(damageRegex);
        if (damageMatch) {
            statText = `${damageMatch[1]} ${capitalize(damageMatch[2])}`;
            typeClass = "stat-dmg";
        } else {
            const genericDice = /(\d+d\d+)/;
            const genericMatch = desc.match(genericDice);
            if (genericMatch) statText = genericMatch[1];
        }
    }
    return { value: statText, className: typeClass };
};

// --- MODALS (Передаємо t як пропс) ---
const StatModal = ({ isOpen, onClose, stat, onSave, t }) => {
    const [localVal, setLocalVal] = useState(stat?.val || 10);
    const [localSave, setLocalSave] = useState(stat?.save || 0);
    useEffect(() => { if (stat) { setLocalVal(stat.val); setLocalSave(stat.save); } }, [stat]);
    if (!isOpen || !stat) return null;
    const modifier = getModifier(localVal);
    const displayMod = modifier >= 0 ? `+${modifier}` : modifier;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h3>{stat.name} <span style={{color:'#ffc400'}}>{displayMod}</span></h3><button className="close-btn" onClick={onClose}>×</button></div>
                <div className="modal-body">
                    <div className="modal-field"><label>{'score'}</label><input type="number" className="modal-input" value={localVal} onChange={(e) => setLocalVal(e.target.value)} /></div>
                    <div className="modal-field"><label>{'saveBonus'}</label><input type="text" className="modal-input" value={localSave} onChange={(e) => setLocalSave(e.target.value)} /></div>
                </div>
                <div className="modal-footer"><button className="save-btn" onClick={() => { onSave({ ...stat, val: parseInt(localVal), mod: displayMod, save: localSave }); onClose(); }}>{'save'}</button></div>
            </div>
        </div>
    );
};

const HPCalculatorModal = ({ isOpen, onClose, currentHP, maxHP, onSave, t }) => {
    const [inputVal, setInputVal] = useState('');
    const [localMax, setLocalMax] = useState(maxHP);
    const [hitDie, setHitDie] = useState('1d8');
    const [showSettings, setShowSettings] = useState(false);
    useEffect(() => { setLocalMax(maxHP); setInputVal(''); setShowSettings(false); }, [isOpen, maxHP]);
    if (!isOpen) return null;
    const applyChange = (type) => {
        const val = parseInt(inputVal) || 0;
        let newHP = currentHP;

        if (type === 'heal') {
            newHP = currentHP + val;
        }
        if (type === 'dmg') {
            newHP = currentHP - val;
        }

        // обмежуємо значення в межах [0, localMax]
        newHP = Math.max(0, Math.min(newHP, localMax));
        console.log(`LOCAL MAX: ${localMax}, NEWHP: ${newHP}`);
        onSave(newHP, localMax);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content calculator-theme" onClick={e => e.stopPropagation()}>
                <div className="calc-header"><button className="close-btn" onClick={onClose}>×</button></div>
                <div className="calc-main-display"><span style={{ color: '#e57373' }}>♥</span> <span className="calc-val-accent">{currentHP}</span> / {localMax}</div>
                <div className="calc-input-screen"><span>{inputVal}</span><button className="calc-backspace-btn" onClick={() => setInputVal(prev => prev.slice(0, -1))}>⌫</button></div>
                <div className="calc-grid">
                    {[7, 8, 9, 4, 5, 6, 1, 2, 3, 0].map(n => <button key={n} className="calc-key" onClick={() => setInputVal(p => p + n)}>{n}</button>)}
                    <div className="calc-key calc-icon-slot" style={{ color: '#81c784' }}>🧪</div><div className="calc-key calc-icon-slot" style={{ color: '#e57373' }}>🩸</div>
                </div>
                <div className="calc-actions-row">
                    <button className="calc-action-btn btn-temp" onClick={() => applyChange('temp')}>Temp</button>
                    <button className="calc-action-btn btn-heal" onClick={() => applyChange('heal')}>Heal</button>
                    <button className="calc-action-btn btn-damage" onClick={() => applyChange('dmg')}>Dmg</button>
                    <button className={`calc-action-btn btn-settings-toggle ${showSettings ? 'active' : ''}`} onClick={() => setShowSettings(!showSettings)}>⚙️</button>
                </div>
                <div className={`calc-settings-drawer ${showSettings ? 'open' : ''}`}>
                    <div className="calc-settings-grid"><div className="calc-input-group"><span className="calc-label">Max HP</span><input type="number" className="calc-settings-input" value={localMax} onChange={(e) => setLocalMax(parseInt(e.target.value) || 0)} /></div>
                        <div className="calc-input-group"><span className="calc-label">Hit Die</span><input type="text" className="calc-settings-input" value={hitDie} onChange={(e) => setHitDie(e.target.value)} /></div></div>
                </div>
            </div>
        </div>
    );
};

const XPCalculatorModal = ({ isOpen, onClose, xp, maxXp, level, onSave }) => {
    const xpThresholds = {
        1: 0,
        2: 300,
        3: 900,
        4: 2700,
        5: 6500,
        6: 14000,
        7: 23000,
        8: 34000,
        9: 48000,
        10: 64000,
        11: 85000,
        12: 100000,
        13: 120000,
        14: 140000,
        15: 165000,
        16: 195000,
        17: 225000,
        18: 265000,
        19: 305000,
        20: 355000
    };

    const [inputVal, setInputVal] = useState('');
    const [localXP, setLocalXP] = useState(xp);
    const [localMaxXP, setLocalMaxXP] = useState(maxXp);
    const [localLevel, setLocalLevel] = useState(level);
    const [showSettings, setShowSettings] = useState(false);
    useEffect(() => { setLocalXP(xp); setLocalMaxXP(maxXp); setLocalLevel(level); setInputVal(''); }, [isOpen, xp]);
    if (!isOpen) return null;
    const applyXP = (type) => {
        const val = parseInt(inputVal) || 0;
        let newTotal = localXP;
        if (type === 'add') newTotal += val;
        setLocalXP(newTotal); setInputVal(''); onSave(newTotal, localMaxXP, localLevel);
    };
    const handleLevelUp = () => {
        const newLocalXp = localXP - localMaxXP;
        const newLevel = localLevel + 1;
        const newLocalMaxXp = xpThresholds[newLevel + 1];

        setLocalXP(newLocalXp);
        setLocalLevel(newLevel);
        setLocalMaxXP(newLocalMaxXp);

        console.log(`New Local XP: ${newLocalXp}, New Max XP: ${newLocalMaxXp}, New Level: ${newLevel}`);
        onSave(newLocalXp, newLocalMaxXp, newLevel);
        onClose();
    };

    console.log(`LocalXP: ${localXP}, LocalMaxXP: ${localMaxXP}, localLevel: ${localLevel}`);
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content calculator-theme" onClick={e => e.stopPropagation()}>
                <div className="calc-header"><button className="close-btn" onClick={onClose}>×</button></div>
                <div className="calc-main-display"><span style={{ fontSize: '24px', display: 'block', color: '#888' }}>Level {localLevel}</span><span className="calc-xp-accent">{localXP}</span> / {localMaxXP}</div>
                <div className="calc-input-screen"><span>{inputVal}</span><button className="calc-backspace-btn" onClick={() => setInputVal(p => p.slice(0, -1))}>⌫</button></div>
                <div className="calc-grid">{[7, 8, 9, 4, 5, 6, 1, 2, 3, 0].map(n => <button key={n} className="calc-key" onClick={() => setInputVal(p => p + n)}>{n}</button>)}<div className="calc-key"></div><div className="calc-key"></div></div>
                <div className="calc-actions-row">
                    {localXP >= localMaxXP ? <button className="calc-action-btn btn-level-up" onClick={handleLevelUp}>Level Up</button> : <button className="calc-action-btn btn-add-xp" onClick={() => applyXP('add')}>Add XP</button>}
                    <button className={`calc-action-btn btn-settings-toggle ${showSettings ? 'active' : ''}`} onClick={() => setShowSettings(!showSettings)}>⚙️</button>
                </div>
                <div className={`calc-settings-drawer ${showSettings ? 'open' : ''}`}>
                    <div className="calc-settings-grid"><div className="calc-input-group"><span className="calc-label">Max XP</span><input type="number" className="calc-settings-input" value={localMaxXP} onChange={(e) => setLocalMaxXP(parseInt(e.target.value) || 0)} /></div></div>
                </div>
            </div>
        </div>
    );
};

const MoneyCalculatorModal = ({ isOpen, onClose, wallet, onSave, t }) => { 
    const [inputVal, setInputVal] = useState('');
    const [coin, setCoin] = useState('gp');
    const [localWallet, setLocalWallet] = useState(wallet);
    useEffect(() => { setLocalWallet(wallet); setInputVal(''); }, [isOpen, wallet]);
    if (!isOpen) return null;
    const update = (type) => {
        const val = parseInt(inputVal) || 0;
        const newAmt = type === 'add' ? localWallet[coin] + val : Math.max(0, localWallet[coin] - val);
        const newW = { ...localWallet, [coin]: newAmt };
        setLocalWallet(newW); setInputVal(''); onSave(newW);
    };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content calculator-theme" onClick={e => e.stopPropagation()}>
                <div className="calc-header"><button className="close-btn" onClick={onClose}>×</button></div>
                <div className="calc-main-display" style={{ color: '#ffc107' }}>{localWallet.gp} G</div>
                <div className="calc-coin-row">
                    {['pp', 'gp', 'sp', 'cp'].map(c => <button key={c} className={`calc-coin-btn coin-${c} ${coin === c ? 'active' : ''}`} onClick={() => setCoin(c)}>{c.toUpperCase()} <span>{localWallet[c]}</span></button>)}
                </div>
                <div className="calc-input-screen"><span>{inputVal}</span><button className="calc-backspace-btn" onClick={() => setInputVal(p => p.slice(0, -1))}>⌫</button></div>
                <div className="calc-grid">{[7, 8, 9, 4, 5, 6, 1, 2, 3, 0].map(n => <button key={n} className="calc-key" onClick={() => setInputVal(p => p + n)}>{n}</button>)}<div className="calc-key"></div><div className="calc-key"></div></div>
                <div className="calc-actions-row"><button className="calc-action-btn btn-add-xp" onClick={() => update('add')}>Add</button><button className="calc-action-btn btn-damage" onClick={() => update('sub')}>Rem</button></div>
            </div>
        </div>
    );
}; 

const GenericEditModal = ({ isOpen, onClose, title, value, onSave, t }) => { 
    const [val, setVal] = useState(value);
    useEffect(() => setVal(value), [isOpen, value]);
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ width: '300px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h3>{title}</h3><button className="close-btn" onClick={onClose}>×</button></div>
                <div className="modal-body"><input className="modal-input" value={val ?? ""} onChange={e => setVal(e.target.value)} /></div>
                <div className="modal-footer"><button className="save-btn" onClick={() => { onSave(val); onClose() }}>Save</button></div>
            </div>
        </div>
    );
};

const SpellSettingsModal = ({ isOpen, onClose, learnedSpells, onToggleSpell, initialLevelFilter, t, currentSpellsData }) => {
    const [filterClass, setFilterClass] = useState('All');
    const [filterLevel, setFilterLevel] = useState('0');
    const [expandedInModal, setExpandedInModal] = useState(null); 

    useEffect(() => {
        if (isOpen && initialLevelFilter !== null) setFilterLevel(initialLevelFilter.toString());
        setExpandedInModal(null);
    }, [isOpen, initialLevelFilter]);
    
    if (!isOpen) return null;

    const classesList = ['All', 'bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard'];
    const levelsList = ['All', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    const filteredSpells = currentSpellsData.filter(spell => {
        const classMatch = filterClass === 'All' || (spell.classes && spell.classes.includes(filterClass));
        const levelMatch = filterLevel === 'All' || spell.level.toString() === filterLevel;
        return classMatch && levelMatch;
    });

    const isLearned = (name) => learnedSpells.some(s => s.name === name);
    const toggleDesc = (name) => setExpandedInModal(prev => prev === name ? null : name);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content spell-settings-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h3>{t('arcaneGrimoire')}</h3><button className="close-btn" onClick={onClose}>×</button></div>
                <div className="spell-config-body">
                    <div className="filters-row">
                        <select className="filter-select" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>

                            {classesList.map(c => <option key={c} value={c}>{c === 'All' ? t('allClasses') : t(c)}</option>)}
                        </select>
                        <select className="filter-select" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>{levelsList.map(l => <option key={l} value={l}>{l === 'All' ? t('allLevels') : (l === '0' ? t('cantrips') : `${t('level')} ${l}`)}</option>)}</select>
                    </div>
                    <div className="spell-picker-list">
                        {filteredSpells.map(spell => {
                             const learned = isLearned(spell.name);
                             const isExpanded = expandedInModal === spell.name;
                             const stats = getSpellStats(spell);
                             return (
                                <div key={spell.name} className={`spell-picker-item-wrapper ${learned ? 'learned' : ''}`}>
                                    <div className="spell-picker-header" onClick={() => toggleDesc(spell.name)}>
                                        <div className="spi-left"><span className="spi-name">{spell.name}</span><span className="spi-level-tag">Lvl {spell.level}</span>{stats.value !== '-' && <span className="spi-dmg-mini">{stats.value}</span>}</div>
                                        <div className="spi-right"><button className={`spi-btn ${learned ? 'prepared' : 'add'}`} onClick={(e) => { e.stopPropagation(); onToggleSpell(spell); }}>{learned ? t('prepared') : t('add')}</button><div className="spi-chevron"><IconChevronDown rotated={isExpanded} /></div></div>
                                    </div>
                                    {isExpanded && (<div className="spell-picker-details"><div className="spd-meta"><span><strong>{t('school')}:</strong> {capitalize(spell.school)}</span><span><strong>{t('time')}:</strong> {spell.actionType}</span><span><strong>{t('range')}:</strong> {spell.range}</span><span><strong>{t('dur')}:</strong> {spell.duration}</span></div><p className="spd-desc">{spell.description}</p></div>)}
                                </div>
                             );
                        })}
                    </div>
                </div>
                <div className="modal-footer"><button className="save-btn close-grimoire" onClick={onClose}>{t('closeGrimoire')}</button></div>
            </div>
        </div>
    );
};

// const Character_info = () => {
//     const { t, language } = useLanguage();
//     const fileInputRef = useRef(null);

//     const activeSpellsDatabase = language === 'uk' ? spellsDataUk : spellsDataEn;

//     const [modals, setModals] = useState({ stat: false, hp: false, xp: false, money: false, generic: false, spells: false });
//     const [selectedStat, setSelectedStat] = useState(null);
//     const [genericData, setGenericData] = useState({ title: '', key: '' });
//     const [modalLevelFilter, setModalLevelFilter] = useState(null);
//     const [expandedSpells, setExpandedSpells] = useState({});

//     const [char, setChar] = useState({ 
//         name: "DreadNote", 
//         race: "Tiefling",    
//         charClass: "Wizard", 
//         avatar: "/assets/images/Wizard.jpg", 
//         ac: 13, speed: 30, prof: '+2', wallet: { pp:0, gp:150, sp:0, cp:0 }, 
//         hpCurrent: 28, hpMax: 35, initiativeBonus: 0, inspiration: 0, exhaustion: 0, 
//         xp: 1250, maxXp: 3000, level: 3 
//     });

//     // Оновлені ключі для навичок та характеристик, щоб вони збігалися зі словником
//     const [stats, setStats] = useState([
//         { id: 'str', name: 'str', val: 14, mod: '+2', save: '+2', skills: [{n:'athletics', v:'+4', prof:true}] }, 
//         { id: 'dex', name: 'dex', val: 12, mod: '+1', save: '+1', skills: [{n:'acrobatics', v:'+1', prof:false}, {n:'sleight', v:'+1', prof:false}, {n:'stealth', v:'+1', prof:false}] }, 
//         { id: 'con', name: 'con', val: 15, mod: '+2', save: '+4', skills: [] }, 
//         { id: 'int', name: 'int', val: 18, mod: '+4', save: '+6', skills: [{n:'arcana', v:'+6', prof:true}, {n:'history', v:'+6', prof:true}, {n:'investigation', v:'+4', prof:false}] }, 
//         { id: 'wis', name: 'wis', val: 10, mod: '0', save: '0', skills: [{n:'insight', v:'+2', prof:true}, {n:'medicine', v:'0', prof:false}, {n:'perception', v:'0', prof:false}] }, 
//         { id: 'cha', name: 'cha', val: 8, mod: '-1', save: '-1', skills: [{n:'deception', v:'-1', prof:false}, {n:'persuasion', v:'-1', prof:false}] }
//     ]);
//     const [attacks, setAttacks] = useState([{ id: 1, name: "Dagger", bonus: "+5", damage: "1d4 + 3 Piercing" }]);
//     const [mySpells, setMySpells] = useState([]);
//     const [spellSlots, setSpellSlots] = useState({ 1: {max: 4, used: 0}, 2: {max: 2, used: 0}, 3: {max: 0, used: 0}, 4: {max: 0, used: 0}, 5: {max: 0, used: 0}, 6: {max: 0, used: 0}, 7: {max: 0, used: 0}, 8: {max: 0, used: 0}, 9: {max: 0, used: 0} });
    
//     // Inventory & Text
//     const [inventoryCapacity, setInventoryCapacity] = useState("");
//     const [creatureSize, setCreatureSize] = useState("Medium");
//     const [inventory, setInventory] = useState(""); 
//     const [treasure, setTreasure] = useState("");   
//     const [attackNotes, setAttackNotes] = useState(""); 
//     const [featuresNotes, setFeaturesNotes] = useState("");
//     const [notes, setNotes] = useState("");
//     const [appearance, setAppearance] = useState("");
//     const [goals, setGoals] = useState("");

//     const handleImageUpload = (event) => {
//         const file = event.target.files[0];
//         if (file) {
//             const reader = new FileReader();
//             reader.onloadend = () => { updateChar('avatar', reader.result); };
//             reader.readAsDataURL(file);
//         }
//     };

//     // Calculations
//     const dexStat = stats.find(s => s.id === 'dex');
//     const dexMod = dexStat ? getModifier(dexStat.val) : 0;
//     const totalInitiative = dexMod + (parseInt(char.initiativeBonus) || 0);
//     const displayInitiative = totalInitiative >= 0 ? `+${totalInitiative}` : totalInitiative;
//     const xpPerc = Math.min((char.xp / char.maxXp)*100, 100);

/* --- ГОЛОВНИЙ КОМПОНЕНТ --- */
const Character_info = () => {
    // Єбана залупа я тебе ненавиджу сука блятський git
    const [character, setCharacter] = useState([]);
    const [stats, setStats] = useState([]);
    const [activeTab, setActiveTab] = useState('attacks'); 
    const [skills, setSkills] = useState([]);
    const [char, setChar] = useState(null);
    const { id } = useParams();

    useEffect(() => {
        authApi().get(`/character-info/${id}/`)
            .then(res => {
                setCharacter(res.data);
                setStats(res.data.stats);
                setChar(res.data.char);
                setSkills(res.data.skills);
            })
            .catch(err => console.log(err));
    }, [id]);

    // States
    const [modals, setModals] = useState({ stat: false, hp: false, xp: false, money: false, generic: false });
    const [selectedStat, setSelectedStat] = useState(null);
    const [genericData, setGenericData] = useState({ title: '', key: '' });

    // Helpers
    const toggleModal = (name, state) => setModals(prev => ({ ...prev, [name]: state }));
    const openStat = (s) => { setSelectedStat(s); toggleModal('stat', true); };
    // const openGeneric = (key, title) => { setGenericData({key, title}); toggleModal('generic', true); };
    // const updateStat = (newStat) => setStats(prev => prev.map(s => s.id === newStat.id ? newStat : s));
    // const updateChar = (key, val) => setChar(prev => ({...prev, [key]: val}));
    // const toggleSkill = (e, statId, idx) => { e.stopPropagation(); setStats(prev => prev.map(s => { if(s.id!==statId) return s; const skills = [...s.skills]; skills[idx].prof = !skills[idx].prof; return {...s, skills}; })); };
    
    // const addAttack = () => setAttacks([...attacks, { id: Date.now(), name: "New Attack", bonus: "+0", damage: "1d6 Type" }]);
    // const updateAttack = (id, field, value) => setAttacks(attacks.map(att => att.id === id ? { ...att, [field]: value } : att));
    // const removeAttack = (id) => setAttacks(attacks.filter(att => att.id !== id));
    
    // const toggleSpell = (spell) => { const exists = mySpells.some(s => s.name === spell.name); if (exists) setMySpells(prev => prev.filter(s => s.name !== spell.name)); else setMySpells(prev => [...prev, spell]); };
    // const toggleSlotUsage = (lvl, index) => { setSpellSlots(prev => { const currentUsed = prev[lvl].used; const newUsed = (index + 1) === currentUsed ? index : index + 1; return {...prev, [lvl]: {...prev[lvl], used: newUsed}}; }); };
    // const toggleSpellExpand = (name) => setExpandedSpells(prev => ({ ...prev, [name]: !prev[name] }));
    // const openSpellModalForLevel = (lvl) => { setModalLevelFilter(lvl); toggleModal('spells', true); };

    // // ✅ Переклад для карток характеристик (STR, DEX)
    // const VerticalStat = ({ stat }) => (<div className="v-stat-card" onClick={() => openStat(stat)}><div className="v-stat-mod">{stat.mod}</div><div className="v-stat-val">{stat.val}</div><div className="v-stat-name">{t(stat.name).slice(0,4)}</div></div>);

    // const renderSpellTier = (level) => {
    //     const tierSpells = mySpells.filter(s => s.level === level);
    //     const slots = spellSlots[level];
    //     const isCantrip = level === 0;
    //     if (!isCantrip && (!slots || slots.max === 0) && tierSpells.length === 0) return null;
    //     return (
    //         <div className="spell-tier-block" key={level}>
    //             <div className="tier-header"><div className="th-left"><span className="th-level-badge">{isCantrip ? 'C' : level}</span><span className="th-title">{isCantrip ? t('cantrips') : `${t('level')} ${level}`}</span>{!isCantrip && (<div className="slot-bubbles">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className={`slot-bubble ${i < (slots?.used || 0) ? 'used' : ''}`} onClick={() => toggleSlotUsage(level, i)}></div>))}</div>)}</div><button className="tier-add-btn" onClick={() => openSpellModalForLevel(level)}>+</button></div>
    //             <div className="tier-list-container">{tierSpells.length === 0 ? <div className="tier-empty">{t('noSpells')}</div> : tierSpells.map(spell => { const isExpanded = expandedSpells[spell.name]; const stats = getSpellStats(spell); return ( <div key={spell.name} className={`spell-row-item ${isExpanded ? 'expanded' : ''}`} onClick={() => toggleSpellExpand(spell.name)}><div className="sr-header"><div className="sr-name">{spell.name}</div><div className={`sr-info-box ${stats.className}`}>{stats.value}</div><div className="sr-info">{spell.duration || "Instant"}</div><div className="sr-info">{spell.range || "Touch"}</div></div>{isExpanded && (<div className="sr-details"><div className="sr-meta-tags"><span>{capitalize(spell.school)}</span><span>{spell.components?.join(', ').toUpperCase()}</span><span>{spell.actionType}</span></div><p>{spell.description}</p><button className="delete-spell-btn" onClick={(e) => { e.stopPropagation(); toggleSpell(spell); }}>{t('unprepare')}</button></div>)}</div> ); })}</div>
    //         </div>
    //     );
    // };

    // return (
    //     <div className={`char-info-wrapper ${language === 'uk' ? 'lang-uk' : ''}`}>
    //         <Header/>
    //         {/* HUD */}
    //         <div className="hud-panel">
    //             <div className="hud-left">
    //                 <div className="hud-avatar" onClick={() => fileInputRef.current.click()}>
    //                     <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload} />
    //                     <img src={char.avatar} alt="Avatar" onError={(e) => e.target.src = "https://via.placeholder.com/150/15100d/ffc400?text=No+Image"} />
    //                     <div className="avatar-edit-overlay">✎</div>
    //                 </div>
    //                 <div className="hud-info">
    //                     <h1 className="editable-text" onClick={() => openGeneric('name', t('characterName'))}>{char.name} <span className="edit-icon">✎</span></h1>
    //                     <div className="hud-sub">
    //                         <span className="editable-text" onClick={() => openGeneric('race', t('race'))}>{char.race} <span className="edit-icon">✎</span></span>
    //                         <span className="hud-sub-separator">•</span>
    //                         <span className="editable-text" onClick={() => openGeneric('charClass', t('charClass'))}>{char.charClass} <span className="edit-icon">✎</span></span>
    const t = null;
    const openGeneric = (key, title) => { setGenericData({ key, title }); toggleModal('generic', true); };
    const updateStat = (newStat) => {
        console.log(newStat);
        const fieldMap = {
           str: "str", 
           dex: "dex", 
           con: "con", 
           int: "int", 
           wis: "wis", 
           chr: "chr", 
        }

        const payload = { 
            [fieldMap[newStat.id]]: newStat.val, 
            [`${fieldMap[newStat.id]}_save`]: newStat.save, 
        };
        console.log(payload);

        authApi().patch(`/character-info/${id}/`, payload)
            .then(res => {
                setCharacter(res.data);
                setStats(res.data.stats);
                setChar(res.data.char);
                setSkills(res.data.skills);
            })
            .catch(err => console.error(`Update stats: ${err}`));
    }

    const updateCharBulk = (data) => {
        authApi().patch(`/character-info/${id}/`, data)
            .then(res => {
                setCharacter(res.data);
                setStats(res.data.stats);
                setChar(res.data.char);
            })
            .catch(err => console.error(err));
    };


    const updateChar = (key, val) => {
        const payload = { [key]: val };

        authApi().patch(`/character-info/${id}/`, payload)
            .then(res => {
            setCharacter(res.data);
            setStats(res.data.stats);
            setChar(res.data.char);
            setSkills(res.data.skills);
            })
            .catch(err => console.error(`Update char: ${err}`));
    };

    const toggleSkill = async (e, statId, idx) => {
        e.stopPropagation();

        const skill = skills[idx];
        const isProficient = character.proficiencies.includes(skill.n);

        let updatedProficiencies;
        if (isProficient) {
            // якщо вже є — видаляємо
            updatedProficiencies = character.proficiencies.filter(n => n !== skill.n);
        } else {
            // якщо немає — додаємо
            updatedProficiencies = [...character.proficiencies, skill.n];
        }

        try {
            const res = await authApi().patch(`/character-info/${id}/`, {
            proficiencies: updatedProficiencies
            });

            // оновлюємо персонажа і skills з відповіді сервера
            setCharacter(res.data);
            setSkills(res.data.skills);
            console.log(skills);
        } catch (err) {
            console.error("Помилка при PATCH:", err);
        }
    };

    const xpPerc = Math.min((char?.xp || 0) / (char?.maxXp || 300) * 100, 100);

    const VerticalStat = ({ stat }) => (
        <div className="v-stat-card" onClick={() => openStat(stat)}>
            <div className="v-stat-mod">{stat.mod}</div>
            <div className="v-stat-val">{stat.val}</div>
            <div className="v-stat-name">{stat.name.slice(0, 3)}</div>
            <div className="v-stat-save-tiny">SV {stat.save}</div>
        </div>
    );

    const SkillPanel = ({ skill, i }) => {
        return (
            <div className="skill-strip" onClick={(e) => toggleSkill(e, skill.id, i)}>
                <div className={`skill-indicator ${skill.proof ? 'proficient' : ''}`}></div>
                    <span className="skill-name">
                        {skill.n} <span className="skill-stat-tag">({skill.id.toUpperCase()})</span>
                    </span>
                <span className="skill-val">{skill.v}</span>
            </div>
        );
    };

    if (!character || !char || !stats) return <p>Loading...</p>

    return (
        <div className="char-info-wrapper">
            <Header />

            {/* 1. HUD (Floating Panel) */}
            <div className="hud-panel">
                <div className="hud-left">
                    {/* <div className="hud-avatar"><img src="/assets/images/Wizard.jpg" alt="Avatar" /></div> */}
                    <div className="hud-avatar"><img src={character.avatar ? character.avatar : "test"} alt="Avatar" /></div>
                    <div className="hud-info">
                        <h1>{character.name}</h1>
                        <div className="hud-sub">{character.race} • {character.class_type}</div>
                        <div className="hud-xp-bar" onClick={() => toggleModal('xp', true)}>
                            <div className="hud-xp-fill" style={{ width: `${xpPerc}%` }}></div>
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
                        <img src="/assets/icons/Hp.svg" className="hud-hp-icon" alt="HP" />
                        <div className="hud-hp-vals">{char.hpCurrent} <span className="max-hp">/{char.hpMax}</span></div>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">

                {/* LEFT: ATTRIBUTES */}
                <div className="col-attributes">
                    {stats.map(s => <VerticalStat key={s.id} stat={s} />)}
                </div>

                {/* CENTER: TABS & ACTION */}
                <div className="col-action-deck">
                    <div className="combat-quick-row">
                        <div className="quick-stat" onClick={() => openGeneric('initiative', 'Init')}>
                            <span className="qs-label">INITIATIVE</span>
                            <span className="qs-val">{char.initiative}</span>
                        </div>
                        <div className="quick-stat" onClick={() => openGeneric('inspiration', 'Insp')}>
                            <span className="qs-label">INSPIRATION</span>
                            <span className="qs-val">{char.inspiration}</span>
                        </div>
                        <div className="quick-stat" onClick={() => openGeneric('exhaustion', 'Exh')}>
                            <span className="qs-label">EXHAUSTION</span>
                            <span className="qs-val">{char.exhaustion}</span>
                        </div>
                    </div>

                    <div className="deck-tabs-wrapper">
                        <input type="radio" name="deck" id="deck-atk" defaultChecked hidden />
                        <input type="radio" name="deck" id="deck-spl" hidden />
                        <input type="radio" name="deck" id="deck-inv" hidden />

                        <div className="deck-nav">
                            <label className={activeTab === 'attacks' ? 'active' : ''} onClick={() => setActiveTab('attacks')}>{('tabAttacks')}</label>
                            <label className={activeTab === 'spells' ? 'active' : ''} onClick={() => setActiveTab('spells')}>{('tabSpells')}</label>
                            <label className={activeTab === 'inventory' ? 'active' : ''} onClick={() => setActiveTab('inventory')}>{('tabItems')}</label>
                            <label className={activeTab === 'notes' ? 'active' : ''} onClick={() => setActiveTab('notes')}>{('tabNotes')}</label>
                            <label className={activeTab === 'appearance' ? 'active' : ''} onClick={() => setActiveTab('appearance')}>{('tabLook')}</label>
                            <label className={activeTab === 'goals' ? 'active' : ''} onClick={() => setActiveTab('goals')}>{('tabGoals')}</label>
                        </div>
                        
                        <div className="deck-content">
                            <div className="deck-pane pane-atk">
                                <table className="fancy-table">
                                    <thead><tr><th>Attack Name</th><th align="center">Bonus</th><th>Damage</th></tr></thead>
                                    <tbody>
                                        <tr><td><input defaultValue="Dagger" className="table-input" /></td><td align="center"><input defaultValue="+5" className="table-input center" /></td><td><input defaultValue="1d4+3 P" className="table-input" /></td></tr>
                                        <tr><td><input defaultValue="Firebolt" className="table-input" /></td><td align="center"><input defaultValue="+6" className="table-input center" /></td><td><input defaultValue="1d10 Fire" className="table-input" /></td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="deck-pane pane-spl"><p style={{ color: '#888' }}>Spell slots placeholder...</p></div>
                            <div className="deck-pane pane-inv"><p style={{ color: '#888' }}>Equipment list placeholder...</p></div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: SKILLS */}
                <div className="col-skills-panel">
                    <div className="panel-header">Skills</div>
                        {skills.map((s, i) => (<SkillPanel key={`${s.id}-${i}`} skill={s} i={i} />))}

                    <div className="passives-box">
                        <div className="passive-line"><span className="pv-val">12</span> Perception</div>
                        <div className="passive-line"><span className="pv-val">14</span> Investigation</div>
                        <div className="passive-line"><span className="pv-val">10</span> Insight</div>
                    </div>
                </div>

            </div>

            {/* MODALS */}
            <StatModal isOpen={modals.stat} onClose={() => toggleModal('stat', false)} stat={selectedStat} onSave={updateStat} />
            <HPCalculatorModal isOpen={modals.hp} onClose={() => toggleModal('hp', false)} currentHP={char.hpCurrent} maxHP={char.hpMax} onSave={
                (c, m) => { // 1. Локально оновлюємо state 
                setChar(prev => ({ ...prev, hpCurrent: c, hpMax: m })); // 2. Відправляємо PATCH одним запитом 
                authApi().patch(`/character-info/${id}/`, { hp_current: c, hp_max: m, }) 
                    .then(res => { // 3. Синхронізуємо з бекендом 
                    setCharacter(res.data); 
                    setStats(res.data.stats); 
                    setChar(res.data.char); }) 
                .catch(err => console.error("Update HP error:", err)); }
            } />
            <XPCalculatorModal isOpen={modals.xp} onClose={() => toggleModal('xp', false)} xp={char.xp} maxXp={char.maxXp} level={char.level} onSave={(x, mx, l) => {updateCharBulk({"xp": x, "max_xp": mx, "level": l})}} />
            <MoneyCalculatorModal isOpen={modals.money} onClose={() => toggleModal('money', false)} wallet={char.wallet} onSave={(w) => updateChar('wallet', w)} />
            <GenericEditModal isOpen={modals.generic} onClose={() => toggleModal('generic', false)} title={genericData.title} value={char[genericData.key]} onSave={(v) => updateChar(genericData.key, v)} />

            <Footer />
        </div>
    );
};

export default Character_info;
