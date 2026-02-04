import React, { useState, useEffect } from 'react';
import '../styles/Character_style.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import spellsData from '../data/spells.json'; 

// --- ICONS ---
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

// --- MODALS (RESTORED) ---

const StatModal = ({ isOpen, onClose, stat, onSave }) => {
    const [localVal, setLocalVal] = useState(stat?.val || 10);
    const [localSave, setLocalSave] = useState(stat?.save || 0);
    useEffect(() => { if(stat) { setLocalVal(stat.val); setLocalSave(stat.save); } }, [stat]);
    if (!isOpen || !stat) return null;
    const modifier = getModifier(localVal);
    const displayMod = modifier >= 0 ? `+${modifier}` : modifier;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h3>{stat.name} <span style={{color:'#ffc400'}}>{displayMod}</span></h3><button className="close-btn" onClick={onClose}>×</button></div>
                <div className="modal-body">
                    <div className="modal-field"><label>Score</label><input type="number" className="modal-input" value={localVal} onChange={(e) => setLocalVal(e.target.value)} /></div>
                    <div className="modal-field"><label>Save Bonus</label><input type="text" className="modal-input" value={localSave} onChange={(e) => setLocalSave(e.target.value)} /></div>
                </div>
                <div className="modal-footer"><button className="save-btn" onClick={() => { onSave({ ...stat, val: parseInt(localVal), mod: displayMod, save: localSave }); onClose(); }}>Save</button></div>
            </div>
        </div>
    );
};

// 🔥 Restored HP Calculator
const HPCalculatorModal = ({ isOpen, onClose, currentHP, maxHP, onSave }) => {
    const [inputVal, setInputVal] = useState('');
    const [localMax, setLocalMax] = useState(maxHP);
    const [hitDie, setHitDie] = useState('1d8');
    const [showSettings, setShowSettings] = useState(false);
    useEffect(() => { setLocalMax(maxHP); setInputVal(''); setShowSettings(false); }, [isOpen, maxHP]);
    if (!isOpen) return null;
    const applyChange = (type) => {
        const val = parseInt(inputVal) || 0;
        let newHP = currentHP;
        if (type === 'heal') newHP = Math.min(currentHP + val, localMax);
        if (type === 'dmg') newHP = Math.max(currentHP - val, 0);
        if (type === 'temp') newHP = currentHP + val;
        onSave(newHP, localMax); onClose();
    };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content calculator-theme" onClick={e => e.stopPropagation()}>
                <div className="calc-header"><button className="close-btn" onClick={onClose}>×</button></div>
                <div className="calc-main-display"><span style={{color:'#e57373'}}>♥</span> <span className="calc-val-accent">{currentHP}</span> / {localMax}</div>
                <div className="calc-input-screen"><span>{inputVal}</span><button className="calc-backspace-btn" onClick={() => setInputVal(prev => prev.slice(0, -1))}>⌫</button></div>
                <div className="calc-grid">{[7,8,9,4,5,6,1,2,3,0].map(n => <button key={n} className="calc-key" onClick={() => setInputVal(p=>p+n)}>{n}</button>)}<div className="calc-key calc-icon-slot" style={{color:'#81c784'}}>🧪</div><div className="calc-key calc-icon-slot" style={{color:'#e57373'}}>🩸</div></div>
                <div className="calc-actions-row"><button className="calc-action-btn btn-temp" onClick={() => applyChange('temp')}>Temp</button><button className="calc-action-btn btn-heal" onClick={() => applyChange('heal')}>Heal</button><button className="calc-action-btn btn-damage" onClick={() => applyChange('dmg')}>Dmg</button><button className={`calc-action-btn btn-settings-toggle ${showSettings?'active':''}`} onClick={() => setShowSettings(!showSettings)}>⚙️</button></div>
                <div className={`calc-settings-drawer ${showSettings ? 'open' : ''}`}><div className="calc-settings-grid"><div className="calc-input-group"><span className="calc-label">Max HP</span><input type="number" className="calc-settings-input" value={localMax} onChange={(e)=>setLocalMax(parseInt(e.target.value)||0)}/></div><div className="calc-input-group"><span className="calc-label">Hit Die</span><input type="text" className="calc-settings-input" value={hitDie} onChange={(e)=>setHitDie(e.target.value)}/></div></div></div>
            </div>
        </div>
    );
};

// 🔥 Restored XP Calculator
const XPCalculatorModal = ({ isOpen, onClose, xp, maxXp, level, onSave }) => { 
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
    const handleLevelUp = () => { onSave(localXP, localMaxXP + 1000, localLevel + 1); onClose(); };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content calculator-theme" onClick={e => e.stopPropagation()}>
                <div className="calc-header"><button className="close-btn" onClick={onClose}>×</button></div>
                <div className="calc-main-display"><span style={{fontSize:'24px', display:'block', color:'#888'}}>Level {localLevel}</span><span className="calc-xp-accent">{localXP}</span> / {localMaxXP}</div>
                <div className="calc-input-screen"><span>{inputVal}</span><button className="calc-backspace-btn" onClick={() => setInputVal(p => p.slice(0, -1))}>⌫</button></div>
                <div className="calc-grid">{[7,8,9,4,5,6,1,2,3,0].map(n => <button key={n} className="calc-key" onClick={() => setInputVal(p=>p+n)}>{n}</button>)}<div className="calc-key"></div><div className="calc-key"></div></div>
                <div className="calc-actions-row">{localXP >= localMaxXP ? <button className="calc-action-btn btn-level-up" onClick={handleLevelUp}>Level Up</button> : <button className="calc-action-btn btn-add-xp" onClick={() => applyXP('add')}>Add XP</button>}<button className={`calc-action-btn btn-settings-toggle ${showSettings?'active':''}`} onClick={() => setShowSettings(!showSettings)}>⚙️</button></div>
                <div className={`calc-settings-drawer ${showSettings ? 'open' : ''}`}><div className="calc-settings-grid"><div className="calc-input-group"><span className="calc-label">Max XP</span><input type="number" className="calc-settings-input" value={localMaxXP} onChange={(e)=>setLocalMaxXP(parseInt(e.target.value)||0)}/></div></div></div>
            </div>
        </div>
    );
};

// 🔥 Restored Money Calculator
const MoneyCalculatorModal = ({ isOpen, onClose, wallet, onSave }) => { 
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
                <div className="calc-main-display" style={{color:'#ffc107'}}>{localWallet.gp} G</div>
                <div className="calc-coin-row">{['pp','gp','sp','cp'].map(c => <button key={c} className={`calc-coin-btn coin-${c} ${coin===c?'active':''}`} onClick={()=>setCoin(c)}>{c.toUpperCase()} <span>{localWallet[c]}</span></button>)}</div>
                <div className="calc-input-screen"><span>{inputVal}</span><button className="calc-backspace-btn" onClick={()=>setInputVal(p=>p.slice(0,-1))}>⌫</button></div>
                <div className="calc-grid">{[7,8,9,4,5,6,1,2,3,0].map(n => <button key={n} className="calc-key" onClick={() => setInputVal(p=>p+n)}>{n}</button>)}<div className="calc-key"></div><div className="calc-key"></div></div>
                <div className="calc-actions-row"><button className="calc-action-btn btn-add-xp" onClick={()=>update('add')}>Add</button><button className="calc-action-btn btn-damage" onClick={()=>update('sub')}>Rem</button></div>
            </div>
        </div>
    );
}; 

const GenericEditModal = ({ isOpen, onClose, title, value, onSave }) => { 
    const [val, setVal] = useState(value);
    useEffect(() => setVal(value), [isOpen, value]);
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{width:'300px'}} onClick={e=>e.stopPropagation()}>
                <div className="modal-header"><h3>{title}</h3><button className="close-btn" onClick={onClose}>×</button></div>
                <div className="modal-body"><input className="modal-input" value={val} onChange={e=>setVal(e.target.value)}/></div>
                <div className="modal-footer"><button className="save-btn" onClick={()=>{onSave(val); onClose()}}>Save</button></div>
            </div>
        </div>
    );
};

// --- SPELL SETTINGS MODAL ---
const SpellSettingsModal = ({ isOpen, onClose, learnedSpells, onToggleSpell, initialLevelFilter }) => {
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

    const filteredSpells = spellsData.filter(spell => {
        const classMatch = filterClass === 'All' || (spell.classes && spell.classes.includes(filterClass));
        const levelMatch = filterLevel === 'All' || spell.level.toString() === filterLevel;
        return classMatch && levelMatch;
    });

    const isLearned = (name) => learnedSpells.some(s => s.name === name);
    const toggleDesc = (name) => setExpandedInModal(prev => prev === name ? null : name);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content spell-settings-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h3>Arcane Grimoire</h3><button className="close-btn" onClick={onClose}>×</button></div>
                <div className="spell-config-body">
                    <div className="filters-row">
                        <select className="filter-select" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>{classesList.map(c => <option key={c} value={c}>{c === 'All' ? 'All Classes' : capitalize(c)}</option>)}</select>
                        <select className="filter-select" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>{levelsList.map(l => <option key={l} value={l}>{l === 'All' ? 'All Levels' : (l === '0' ? 'Cantrips' : `Level ${l}`)}</option>)}</select>
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
                                        <div className="spi-right"><button className={`spi-btn ${learned ? 'prepared' : 'add'}`} onClick={(e) => { e.stopPropagation(); onToggleSpell(spell); }}>{learned ? 'Prepared' : 'Add'}</button><div className="spi-chevron"><IconChevronDown rotated={isExpanded} /></div></div>
                                    </div>
                                    {isExpanded && (<div className="spell-picker-details"><div className="spd-meta"><span><strong>School:</strong> {capitalize(spell.school)}</span><span><strong>Time:</strong> {spell.actionType}</span><span><strong>Range:</strong> {spell.range}</span><span><strong>Dur:</strong> {spell.duration}</span></div><p className="spd-desc">{spell.description}</p></div>)}
                                </div>
                             );
                        })}
                    </div>
                </div>
                <div className="modal-footer"><button className="save-btn close-grimoire" onClick={onClose}>Close Grimoire</button></div>
            </div>
        </div>
    );
};

/* --- MAIN COMPONENT --- */
const Character_info = () => {
    // UI States
    const [modals, setModals] = useState({ stat: false, hp: false, xp: false, money: false, generic: false, spells: false });
    const [selectedStat, setSelectedStat] = useState(null);
    const [genericData, setGenericData] = useState({ title: '', key: '' });
    const [activeTab, setActiveTab] = useState('attacks'); 
    const [modalLevelFilter, setModalLevelFilter] = useState(null);
    const [expandedSpells, setExpandedSpells] = useState({});

    // DATA
    const [char, setChar] = useState({ ac: 13, speed: 30, prof: '+2', wallet: { pp:0, gp:150, sp:0, cp:0 }, hpCurrent: 28, hpMax: 35, initiativeBonus: 0, inspiration: 0, exhaustion: 0, xp: 1250, maxXp: 3000, level: 3 });
    const [stats, setStats] = useState([{ id: 'str', name: 'Strength', val: 14, mod: '+2', save: '+2', skills: [{n:'Athletics', v:'+4', prof:true}] }, { id: 'dex', name: 'Dexterity', val: 12, mod: '+1', save: '+1', skills: [{n:'Acrobatics', v:'+1', prof:false}, {n:'Sleight', v:'+1', prof:false}, {n:'Stealth', v:'+1', prof:false}] }, { id: 'con', name: 'Constitution', val: 15, mod: '+2', save: '+4', skills: [] }, { id: 'int', name: 'Intelligence', val: 18, mod: '+4', save: '+6', skills: [{n:'Arcana', v:'+6', prof:true}, {n:'History', v:'+6', prof:true}, {n:'Invest', v:'+4', prof:false}] }, { id: 'wis', name: 'Wisdom', val: 10, mod: '0', save: '0', skills: [{n:'Insight', v:'+2', prof:true}, {n:'Medicine', v:'0', prof:false}, {n:'Percep', v:'0', prof:false}] }, { id: 'cha', name: 'Charisma', val: 8, mod: '-1', save: '-1', skills: [{n:'Deception', v:'-1', prof:false}, {n:'Persuade', v:'-1', prof:false}] }]);
    const [attacks, setAttacks] = useState([{ id: 1, name: "Dagger", bonus: "+5", damage: "1d4 + 3 Piercing" }]);
    const [mySpells, setMySpells] = useState([]);
    const [spellSlots, setSpellSlots] = useState({ 1: {max: 4, used: 0}, 2: {max: 2, used: 0}, 3: {max: 0, used: 0}, 4: {max: 0, used: 0}, 5: {max: 0, used: 0}, 6: {max: 0, used: 0}, 7: {max: 0, used: 0}, 8: {max: 0, used: 0}, 9: {max: 0, used: 0} });
    
    // Inventory & Text
    const [inventoryCapacity, setInventoryCapacity] = useState("");
    const [creatureSize, setCreatureSize] = useState("Medium");
    const [inventory, setInventory] = useState(""); 
    const [treasure, setTreasure] = useState("");   
    const [attackNotes, setAttackNotes] = useState(""); 
    const [featuresNotes, setFeaturesNotes] = useState("");
    const [notes, setNotes] = useState("");
    const [appearance, setAppearance] = useState("");
    const [goals, setGoals] = useState("");

    // Calculations
    const dexStat = stats.find(s => s.id === 'dex');
    const dexMod = dexStat ? getModifier(dexStat.val) : 0;
    const totalInitiative = dexMod + (parseInt(char.initiativeBonus) || 0);
    const displayInitiative = totalInitiative >= 0 ? `+${totalInitiative}` : totalInitiative;
    const xpPerc = Math.min((char.xp / char.maxXp)*100, 100);

    // Helpers
    const toggleModal = (name, state) => setModals(prev => ({...prev, [name]: state}));
    const openStat = (s) => { setSelectedStat(s); toggleModal('stat', true); };
    const openGeneric = (key, title) => { setGenericData({key, title}); toggleModal('generic', true); };
    const updateStat = (newStat) => setStats(prev => prev.map(s => s.id === newStat.id ? newStat : s));
    const updateChar = (key, val) => setChar(prev => ({...prev, [key]: val}));
    const toggleSkill = (e, statId, idx) => { e.stopPropagation(); setStats(prev => prev.map(s => { if(s.id!==statId) return s; const skills = [...s.skills]; skills[idx].prof = !skills[idx].prof; return {...s, skills}; })); };
    
    const addAttack = () => setAttacks([...attacks, { id: Date.now(), name: "New Attack", bonus: "+0", damage: "1d6 Type" }]);
    const updateAttack = (id, field, value) => setAttacks(attacks.map(att => att.id === id ? { ...att, [field]: value } : att));
    const removeAttack = (id) => setAttacks(attacks.filter(att => att.id !== id));
    
    const toggleSpell = (spell) => { const exists = mySpells.some(s => s.name === spell.name); if (exists) setMySpells(prev => prev.filter(s => s.name !== spell.name)); else setMySpells(prev => [...prev, spell]); };
    const toggleSlotUsage = (lvl, index) => { setSpellSlots(prev => { const currentUsed = prev[lvl].used; const newUsed = (index + 1) === currentUsed ? index : index + 1; return {...prev, [lvl]: {...prev[lvl], used: newUsed}}; }); };
    const toggleSpellExpand = (name) => setExpandedSpells(prev => ({ ...prev, [name]: !prev[name] }));
    const openSpellModalForLevel = (lvl) => { setModalLevelFilter(lvl); toggleModal('spells', true); };

    const VerticalStat = ({ stat }) => (<div className="v-stat-card" onClick={() => openStat(stat)}><div className="v-stat-mod">{stat.mod}</div><div className="v-stat-val">{stat.val}</div><div className="v-stat-name">{stat.name.slice(0,3)}</div></div>);

    const renderSpellTier = (level) => {
        const tierSpells = mySpells.filter(s => s.level === level);
        const slots = spellSlots[level];
        const isCantrip = level === 0;
        if (!isCantrip && (!slots || slots.max === 0) && tierSpells.length === 0) return null;
        return (
            <div className="spell-tier-block" key={level}>
                <div className="tier-header"><div className="th-left"><span className="th-level-badge">{isCantrip ? 'C' : level}</span><span className="th-title">{isCantrip ? 'Cantrips' : `Level ${level}`}</span>{!isCantrip && (<div className="slot-bubbles">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className={`slot-bubble ${i < (slots?.used || 0) ? 'used' : ''}`} onClick={() => toggleSlotUsage(level, i)}></div>))}</div>)}</div><button className="tier-add-btn" onClick={() => openSpellModalForLevel(level)}>+</button></div>
                <div className="tier-list-container">{tierSpells.length === 0 ? <div className="tier-empty">No spells prepared</div> : tierSpells.map(spell => { const isExpanded = expandedSpells[spell.name]; const stats = getSpellStats(spell); return ( <div key={spell.name} className={`spell-row-item ${isExpanded ? 'expanded' : ''}`} onClick={() => toggleSpellExpand(spell.name)}><div className="sr-header"><div className="sr-name">{spell.name}</div><div className={`sr-info-box ${stats.className}`}>{stats.value}</div><div className="sr-info">{spell.duration || "Instant"}</div><div className="sr-info">{spell.range || "Touch"}</div></div>{isExpanded && (<div className="sr-details"><div className="sr-meta-tags"><span>{capitalize(spell.school)}</span><span>{spell.components?.join(', ').toUpperCase()}</span><span>{spell.actionType}</span></div><p>{spell.description}</p><button className="delete-spell-btn" onClick={(e) => { e.stopPropagation(); toggleSpell(spell); }}>Unprepare</button></div>)}</div> ); })}</div>
            </div>
        );
    };

    return (
        <div className="char-info-wrapper">
            <Header/>
            {/* HUD */}
            <div className="hud-panel">
                <div className="hud-left"><div className="hud-avatar"><img src="/assets/images/Wizard.jpg" alt="Avatar"/></div><div className="hud-info"><h1>DreadNote</h1><div className="hud-sub">Tiefling • Wizard</div><div className="hud-xp-bar" onClick={()=>toggleModal('xp', true)}><div className="hud-xp-fill" style={{width: `${xpPerc}%`}}></div><span className="hud-xp-text">LVL {char.level} • {char.xp} / {char.maxXp}</span></div></div></div>
                <div className="hud-stats"><div className="hud-stat-hex" onClick={()=>openGeneric('ac','Armor Class')}><span className="hex-val">{char.ac}</span><span className="hex-lbl">AC</span></div><div className="hud-stat-hex" onClick={()=>openGeneric('speed','Speed')}><span className="hex-val">{char.speed}</span><span className="hex-lbl">SPD</span></div><div className="hud-stat-hex" onClick={()=>openGeneric('prof','Proficiency')}><span className="hex-val">{char.prof}</span><span className="hex-lbl">PROF</span></div><div className="hud-stat-pill" onClick={()=>toggleModal('money', true)}><span style={{color:'#ffc107'}}>$</span> {char.wallet.gp}</div><div className="hud-hp-block" onClick={()=>toggleModal('hp', true)}><img src="/assets/icons/Hp.svg" className="hud-hp-icon" alt="HP"/><div className="hud-hp-vals">{char.hpCurrent} <span className="max-hp">/{char.hpMax}</span></div></div></div>
            </div>

            <div className="dashboard-grid">
                <div className="col-attributes">{stats.map(s => <VerticalStat key={s.id} stat={s} />)}</div>
                
                <div className="col-action-deck">
                    <div className="combat-quick-row">
                        <div className="quick-stat" onClick={()=>openGeneric('initiativeBonus','Initiative Bonus')}><span className="qs-label">INITIATIVE</span><span className="qs-val" style={{color:'#ffc400'}}>{displayInitiative}</span></div>
                        <div className="quick-stat" onClick={()=>openGeneric('inspiration','Inspiration')}><span className="qs-label">INSPIRATION</span><span className="qs-val">{char.inspiration}</span></div>
                        <div className="quick-stat" onClick={()=>openGeneric('exhaustion','Exhaustion')}><span className="qs-label">EXHAUSTION</span><span className="qs-val" style={{color: char.exhaustion > 0 ? '#ef5350' : '#fff'}}>{char.exhaustion}</span></div>
                    </div>

                    <div className="deck-tabs-wrapper">
                        <div className="deck-nav"><label className={activeTab === 'attacks' ? 'active' : ''} onClick={() => setActiveTab('attacks')}>Attacks</label><label className={activeTab === 'spells' ? 'active' : ''} onClick={() => setActiveTab('spells')}>Spells</label><label className={activeTab === 'inventory' ? 'active' : ''} onClick={() => setActiveTab('inventory')}>Items</label><label className={activeTab === 'notes' ? 'active' : ''} onClick={() => setActiveTab('notes')}>Notes</label><label className={activeTab === 'appearance' ? 'active' : ''} onClick={() => setActiveTab('appearance')}>Look</label><label className={activeTab === 'goals' ? 'active' : ''} onClick={() => setActiveTab('goals')}>Goals</label></div>
                        
                        <div className="deck-content">
                            {/* ATTACKS (Dark Theme) */}
                            {activeTab === 'attacks' && ( <div className="deck-pane"><div className="attack-header-labels"><span className="lbl-name"><IconSword/> ATTACK</span><span className="lbl-bonus"><IconTarget/> BONUS</span><span className="lbl-dmg"><IconSkull/> DAMAGE</span><div className="lbl-actions"><button className="small-add-btn" onClick={addAttack}>+</button></div></div><div className="attacks-list-clean">{attacks.map(att => (<div key={att.id} className="attack-row-clean"><input type="text" className="clean-input name" value={att.name} onChange={(e) => updateAttack(att.id, 'name', e.target.value)} /><div className="bonus-box"><input type="text" className="clean-input bonus" value={att.bonus} onChange={(e) => updateAttack(att.id, 'bonus', e.target.value)} /></div><div className="damage-box"><input type="text" className="clean-input damage" value={att.damage} onChange={(e) => updateAttack(att.id, 'damage', e.target.value)} /></div><button className="clean-delete-btn" onClick={() => removeAttack(att.id)}>−</button></div>))}</div><div className="sheet-section"><div className="sheet-label">ATTACKS & SPELLCASTING</div><textarea className="sheet-textarea" value={attackNotes} onChange={(e) => setAttackNotes(e.target.value)} /></div><div className="sheet-section"><div className="sheet-label">FEATURES & TRAITS</div><textarea className="sheet-textarea" value={featuresNotes} onChange={(e) => setFeaturesNotes(e.target.value)} /></div></div>)}
                            
                            {/* SPELLS (Gold Theme) */}
                            {activeTab === 'spells' && (<div className="deck-pane spells-container"><div className="spells-col-header"><span className="col-h-name">SPELL</span><span className="col-h-icon"><IconSword/></span><span className="col-h-icon"><IconClock/></span><span className="col-h-icon"><IconTarget/></span></div>{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(lvl => renderSpellTier(lvl))}<button className="settings-btn-long mt-20" onClick={() => openSpellModalForLevel('All')}>Open Grimoire (All Spells)</button></div>)}
                            
                            {/* INVENTORY (Dark Theme) */}
                            {activeTab === 'inventory' && (
                                <div className="deck-pane">
                                    <div className="inv-top-row">
                                        <div className="inv-field-group"><label>CARRYING CAPACITY</label><input type="text" className="inv-input-box" value={inventoryCapacity} onChange={(e) => setInventoryCapacity(e.target.value)} placeholder="0 / 150 lb"/></div>
                                        <div className="inv-field-group small"><label>SIZE</label><select className="inv-select-box" value={creatureSize} onChange={(e) => setCreatureSize(e.target.value)}><option>Tiny</option><option>Small</option><option>Medium</option><option>Large</option><option>Huge</option></select></div>
                                    </div>
                                    <div className="sheet-section"><div className="sheet-label">EQUIPMENT</div><textarea className="sheet-textarea large" value={inventory} onChange={(e) => setInventory(e.target.value)} /></div>
                                    <div className="sheet-section"><div className="sheet-label">TREASURES</div><textarea className="sheet-textarea large" value={treasure} onChange={(e) => setTreasure(e.target.value)} /></div>
                                </div>
                            )}

                            {activeTab === 'notes' && <div className="deck-pane"><textarea className="epic-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." /></div>}
                            {activeTab === 'appearance' && <div className="deck-pane"><textarea className="epic-textarea" value={appearance} onChange={(e) => setAppearance(e.target.value)} placeholder="Look..." /></div>}
                            {activeTab === 'goals' && <div className="deck-pane"><textarea className="epic-textarea" value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="Goals..." /></div>}
                        </div>
                    </div>
                </div>
                <div className="col-skills-panel"><div className="panel-header">Skills</div><div className="skills-scroll-container">{stats.map(stat => stat.skills.map((skill, i) => (<div className="skill-strip" key={`${stat.id}-${i}`} onClick={(e)=>toggleSkill(e, stat.id, i)}><div className={`skill-indicator ${skill.prof ? 'proficient' : ''}`}></div><span className="skill-name">{skill.n}</span><span className="skill-val">{skill.v}</span></div>)))}</div></div>
            </div>
            
            <StatModal isOpen={modals.stat} onClose={()=>toggleModal('stat', false)} stat={selectedStat} onSave={updateStat} />
            <HPCalculatorModal isOpen={modals.hp} onClose={()=>toggleModal('hp', false)} currentHP={char.hpCurrent} maxHP={char.hpMax} onSave={(c,m)=>updateChar('hpCurrent',c)||updateChar('hpMax',m)} />
            <XPCalculatorModal isOpen={modals.xp} onClose={()=>toggleModal('xp', false)} xp={char.xp} maxXp={char.maxXp} level={char.level} onSave={(x,mx,l)=>updateChar('xp',x)||updateChar('maxXp',mx)||updateChar('level',l)} />
            <MoneyCalculatorModal isOpen={modals.money} onClose={()=>toggleModal('money', false)} wallet={char.wallet} onSave={(w)=>updateChar('wallet',w)} />
            <GenericEditModal isOpen={modals.generic} onClose={()=>toggleModal('generic', false)} title={genericData.title} value={char[genericData.key]} onSave={(v)=>updateChar(genericData.key, v)} />
            <SpellSettingsModal isOpen={modals.spells} onClose={() => toggleModal('spells', false)} learnedSpells={mySpells} onToggleSpell={toggleSpell} initialLevelFilter={modalLevelFilter} />
            <Footer/>
        </div> 
    );
};
export default Character_info;