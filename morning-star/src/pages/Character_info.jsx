import React, { useState, useEffect } from 'react';
import '../styles/Character_style.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

const StatModal = ({ isOpen, onClose, stat, onSave }) => {
    const [localVal, setLocalVal] = useState(stat?.val || 10);
    const [localSave, setLocalSave] = useState(stat?.save || 0);
    useEffect(() => { if(stat) { setLocalVal(stat.val); setLocalSave(stat.save); } }, [stat]);
    if (!isOpen || !stat) return null;
    const modifier = Math.floor((localVal - 10) / 2);
    const displayMod = modifier >= 0 ? `+${modifier}` : modifier;
    const handleSave = () => { onSave({ ...stat, val: parseInt(localVal), mod: displayMod, save: localSave }); onClose(); };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h3>{stat.name} <span className="modal-mod-badge">{displayMod}</span></h3><button className="close-btn" onClick={onClose}>×</button></div>
                <div className="modal-body">
                    <div className="modal-field"><label>Value Score</label><input type="number" className="input-dark modal-input" value={localVal} onChange={(e) => setLocalVal(e.target.value)} /></div>
                    <div className="modal-field"><label>Saving Throw Bonus</label><input type="text" className="input-dark modal-input" value={localSave} onChange={(e) => setLocalSave(e.target.value)} /></div>
                </div>
                <div className="modal-footer"><button className="save-btn" onClick={handleSave}>Save</button></div>
            </div>
        </div>
    );
};

const HPCalculatorModal = ({ isOpen, onClose, currentHP, maxHP, onSave }) => {
    const [inputVal, setInputVal] = useState('');
    const [localMax, setLocalMax] = useState(maxHP);
    const [hitDie, setHitDie] = useState('1d8');
    const [showSettings, setShowSettings] = useState(false);
    useEffect(() => { setLocalMax(maxHP); setInputVal(''); setShowSettings(false); }, [isOpen, maxHP]);
    if (!isOpen) return null;
    const handleNum = (num) => setInputVal(prev => prev + num);
    const handleBackspace = () => setInputVal(prev => prev.slice(0, -1));
    const applyChange = (type) => {
        const val = parseInt(inputVal) || 0;
        let newHP = currentHP;
        if (type === 'heal') newHP = Math.min(currentHP + val, localMax);
        if (type === 'dmg') newHP = Math.max(currentHP - val, 0);
        if (type === 'temp') newHP = currentHP + val;
        onSave(newHP, localMax);
        onClose();
    };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content calculator-theme" onClick={e => e.stopPropagation()}>
                <div className="calc-header"><button className="close-btn" onClick={onClose}>×</button></div>
                <div className="calc-main-display"><span className="calc-val-accent">{currentHP}</span> / {localMax}</div>
                <div className="calc-input-screen"><span>{inputVal}</span><button className="calc-backspace-btn" onClick={handleBackspace}>⌫</button></div>
                <div className="calc-grid">
                    <button className="calc-key" onClick={() => handleNum('7')}>7</button><button className="calc-key" onClick={() => handleNum('8')}>8</button><button className="calc-key" onClick={() => handleNum('9')}>9</button><div className="calc-key calc-icon-slot" style={{color:'#81c784'}}>🧪</div>
                    <button className="calc-key" onClick={() => handleNum('4')}>4</button><button className="calc-key" onClick={() => handleNum('5')}>5</button><button className="calc-key" onClick={() => handleNum('6')}>6</button><div className="calc-key calc-icon-slot" style={{color:'#81c784'}}>🧪</div>
                    <button className="calc-key" onClick={() => handleNum('1')}>1</button><button className="calc-key" onClick={() => handleNum('2')}>2</button><button className="calc-key" onClick={() => handleNum('3')}>3</button><div className="calc-key calc-icon-slot" style={{color:'#81c784'}}>🧪</div>
                    <button className="calc-key" onClick={() => handleNum('0')}>0</button><button className="calc-key" onClick={() => handleNum('+')}>+</button><button className="calc-key" onClick={() => handleNum('-')}>-</button><div className="calc-key calc-icon-slot" style={{color:'#e57373'}}>🩸</div>
                </div>
                <div className="calc-actions-row">
                    <button className="calc-action-btn btn-temp" onClick={() => applyChange('temp')}>Temp HP</button>
                    <button className="calc-action-btn btn-heal" onClick={() => applyChange('heal')}>Heal</button>
                    <button className="calc-action-btn btn-damage" onClick={() => applyChange('dmg')}>Damage</button>
                    <button className={`calc-action-btn btn-settings-toggle ${showSettings ? 'active' : ''}`} onClick={() => setShowSettings(!showSettings)}>⚙️</button>
                </div>
                <div className={`calc-settings-drawer ${showSettings ? 'open' : ''}`}>
                    <div className="calc-settings-grid">
                        <div className="calc-input-group"><span className="calc-label">Max HP</span><input type="number" className="calc-settings-input" value={localMax} onChange={(e) => setLocalMax(parseInt(e.target.value) || 0)} /></div>
                        <div className="calc-input-group"><span className="calc-label">Hit Die</span><input type="text" className="calc-settings-input" value={hitDie} onChange={(e) => setHitDie(e.target.value)} /></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const XPCalculatorModal = ({ isOpen, onClose, xp, maxXp, level, onSave }) => {
    const [inputVal, setInputVal] = useState('');
    const [localXP, setLocalXP] = useState(xp);
    const [localMaxXP, setLocalMaxXP] = useState(maxXp);
    const [localLevel, setLocalLevel] = useState(level);
    const [showSettings, setShowSettings] = useState(false);
    useEffect(() => { setLocalXP(xp); setLocalMaxXP(maxXp); setLocalLevel(level); setInputVal(''); setShowSettings(false); }, [isOpen, xp, maxXp, level]);
    if (!isOpen) return null;
    const handleNum = (num) => setInputVal(prev => prev + num);
    const handleBackspace = () => setInputVal(prev => prev.slice(0, -1));
    const applyXP = (type) => {
        const val = parseInt(inputVal) || 0;
        let newTotal = localXP;
        if (type === 'add') newTotal += val;
        if (type === 'sub') newTotal = Math.max(0, newTotal - val);
        setLocalXP(newTotal); setInputVal(''); onSave(newTotal, localMaxXP, localLevel);
    };
    const handleLevelUp = () => { const newLvl = localLevel + 1; const newMax = localMaxXP + 1000; setLocalLevel(newLvl); setLocalMaxXP(newMax); onSave(localXP, newMax, newLvl); };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content calculator-theme" onClick={e => e.stopPropagation()}>
                <div className="calc-header"><button className="close-btn" onClick={onClose}>×</button></div>
                <div className="calc-main-display"><span style={{fontSize:'20px', color:'#888', display:'block'}}>Level {localLevel}</span><span className="calc-xp-accent">{localXP}</span> <span style={{fontSize:'24px', color:'#888'}}>/ {localMaxXP}</span></div>
                <div className="xp-slider-area"><input type="range" min="0" max={localMaxXP} value={localXP} className="xp-slider" readOnly /></div>
                <div className="calc-input-screen"><span>{inputVal}</span><button className="calc-backspace-btn" onClick={handleBackspace}>⌫</button></div>
                <div className="calc-grid">
                    <button className="calc-key" onClick={() => handleNum('7')}>7</button><button className="calc-key" onClick={() => handleNum('8')}>8</button><button className="calc-key" onClick={() => handleNum('9')}>9</button><div className="calc-key"></div>
                    <button className="calc-key" onClick={() => handleNum('4')}>4</button><button className="calc-key" onClick={() => handleNum('5')}>5</button><button className="calc-key" onClick={() => handleNum('6')}>6</button><div className="calc-key"></div>
                    <button className="calc-key" onClick={() => handleNum('1')}>1</button><button className="calc-key" onClick={() => handleNum('2')}>2</button><button className="calc-key" onClick={() => handleNum('3')}>3</button><div className="calc-key"></div>
                    <button className="calc-key" onClick={() => handleNum('0')}>0</button><button className="calc-key" onClick={() => handleNum('+')}>+</button><button className="calc-key" onClick={() => handleNum('-')}>-</button><div className="calc-key"></div>
                </div>
                <div className="calc-actions-row">
                    {localXP >= localMaxXP ? (<button className="calc-action-btn btn-level-up" onClick={handleLevelUp}>Level Up ⬆</button>) : (<button className="calc-action-btn btn-add-xp" onClick={() => applyXP('add')}>Add XP</button>)}
                    <button className="calc-action-btn btn-damage" onClick={() => applyXP('sub')}>Remove</button>
                    <button className={`calc-action-btn btn-settings-toggle ${showSettings ? 'active' : ''}`} onClick={() => setShowSettings(!showSettings)}>⚙️</button>
                </div>
                <div className={`calc-settings-drawer ${showSettings ? 'open' : ''}`}>
                    <div className="calc-settings-grid">
                        <div className="calc-input-group"><span className="calc-label">Level</span><input type="number" className="calc-settings-input" value={localLevel} onChange={(e) => setLocalLevel(parseInt(e.target.value)||1)} /></div>
                        <div className="calc-input-group"><span className="calc-label">Max XP</span><input type="number" className="calc-settings-input" value={localMaxXP} onChange={(e) => setLocalMaxXP(parseInt(e.target.value)||0)} /></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MONEY CALCULATOR ---
const MoneyCalculatorModal = ({ isOpen, onClose, wallet, onSave }) => {
    const [inputVal, setInputVal] = useState('');
    const [selectedCoin, setSelectedCoin] = useState('gp'); // pp, gp, sp, cp
    const [localWallet, setLocalWallet] = useState(wallet);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => { setLocalWallet(wallet); setInputVal(''); setShowSettings(false); }, [isOpen, wallet]);
    if (!isOpen) return null;

    const handleNum = (num) => setInputVal(prev => prev + num);
    const handleBackspace = () => setInputVal(prev => prev.slice(0, -1));

    const totalGoldValue = (
        (localWallet.pp * 10) + 
        (localWallet.gp) + 
        (localWallet.sp / 10) + 
        (localWallet.cp / 100)
    ).toFixed(2);

    const updateWallet = (type) => {
        const val = parseInt(inputVal) || 0;
        const currentAmount = localWallet[selectedCoin];
        let newAmount = currentAmount;

        if (type === 'add') newAmount += val;
        if (type === 'sub') newAmount = Math.max(0, currentAmount - val);

        const newWallet = { ...localWallet, [selectedCoin]: newAmount };
        setLocalWallet(newWallet);
        setInputVal('');
        onSave(newWallet);
    };

    const manualUpdate = (key, val) => {
        const newWallet = { ...localWallet, [key]: parseInt(val) || 0 };
        setLocalWallet(newWallet);
        onSave(newWallet);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content calculator-theme" onClick={e => e.stopPropagation()}>
                <div className="calc-header"><button className="close-btn" onClick={onClose}>×</button></div>
                
                <div className="calc-main-display">
                    <span style={{fontSize:'16px', color:'#aaa', display:'block'}}>Total Value in Gold</span>
                    <span style={{color:'#ffc107'}}>{totalGoldValue} G</span>
                </div>

                {/* Coin Selector */}
                <div className="calc-coin-row">
                    <button className={`calc-coin-btn coin-pp ${selectedCoin==='pp'?'active':''}`} onClick={() => setSelectedCoin('pp')}>
                        PP <span className="coin-val">{localWallet.pp}</span>
                    </button>
                    <button className={`calc-coin-btn coin-gp ${selectedCoin==='gp'?'active':''}`} onClick={() => setSelectedCoin('gp')}>
                        GP <span className="coin-val">{localWallet.gp}</span>
                    </button>
                    <button className={`calc-coin-btn coin-sp ${selectedCoin==='sp'?'active':''}`} onClick={() => setSelectedCoin('sp')}>
                        SP <span className="coin-val">{localWallet.sp}</span>
                    </button>
                    <button className={`calc-coin-btn coin-cp ${selectedCoin==='cp'?'active':''}`} onClick={() => setSelectedCoin('cp')}>
                        CP <span className="coin-val">{localWallet.cp}</span>
                    </button>
                </div>

                <div className="calc-input-screen"><span>{inputVal}</span><button className="calc-backspace-btn" onClick={handleBackspace}>⌫</button></div>

                <div className="calc-grid">
                    <button className="calc-key" onClick={() => handleNum('7')}>7</button><button className="calc-key" onClick={() => handleNum('8')}>8</button><button className="calc-key" onClick={() => handleNum('9')}>9</button><div className="calc-key"></div>
                    <button className="calc-key" onClick={() => handleNum('4')}>4</button><button className="calc-key" onClick={() => handleNum('5')}>5</button><button className="calc-key" onClick={() => handleNum('6')}>6</button><div className="calc-key"></div>
                    <button className="calc-key" onClick={() => handleNum('1')}>1</button><button className="calc-key" onClick={() => handleNum('2')}>2</button><button className="calc-key" onClick={() => handleNum('3')}>3</button><div className="calc-key"></div>
                    <button className="calc-key" onClick={() => handleNum('0')}>0</button><button className="calc-key" onClick={() => handleNum('00')}>00</button><div className="calc-key"></div><div className="calc-key"></div>
                </div>

                <div className="calc-actions-row">
                    <button className="calc-action-btn btn-add-xp" onClick={() => updateWallet('add')}>Add</button>
                    <button className="calc-action-btn btn-damage" onClick={() => updateWallet('sub')}>Remove</button>
                    <button className={`calc-action-btn btn-settings-toggle ${showSettings ? 'active' : ''}`} onClick={() => setShowSettings(!showSettings)}>⚙️</button>
                </div>

                <div className={`calc-settings-drawer ${showSettings ? 'open' : ''}`}>
                    <div className="calc-settings-grid">
                        <div className="calc-input-group"><span className="calc-label">PP</span><input type="number" className="calc-settings-input" value={localWallet.pp} onChange={(e) => manualUpdate('pp', e.target.value)} /></div>
                        <div className="calc-input-group"><span className="calc-label">GP</span><input type="number" className="calc-settings-input" value={localWallet.gp} onChange={(e) => manualUpdate('gp', e.target.value)} /></div>
                        <div className="calc-input-group"><span className="calc-label">SP</span><input type="number" className="calc-settings-input" value={localWallet.sp} onChange={(e) => manualUpdate('sp', e.target.value)} /></div>
                        <div className="calc-input-group"><span className="calc-label">CP</span><input type="number" className="calc-settings-input" value={localWallet.cp} onChange={(e) => manualUpdate('cp', e.target.value)} /></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const GenericEditModal = ({ isOpen, onClose, title, value, onSave }) => {
    const [localVal, setLocalVal] = useState(value);
    useEffect(() => { setLocalVal(value); }, [isOpen, value]);
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{width: '300px'}} onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h3>Edit {title}</h3><button className="close-btn" onClick={onClose}>×</button></div>
                <div className="modal-body"><div className="modal-field"><label>New Value</label><input type="text" className="input-dark modal-input" value={localVal} onChange={(e) => setLocalVal(e.target.value)} /></div></div>
                <div className="modal-footer"><button className="save-btn" onClick={() => { onSave(localVal); onClose(); }}>Save</button></div>
            </div>
        </div>
    );
};

const Character_info = () => {
    const [isStatModalOpen, setIsStatModalOpen] = useState(false);
    const [selectedStat, setSelectedStat] = useState(null);
    const [genericModal, setGenericModal] = useState({ isOpen: false, title: '', key: '' });
    const [isHPModalOpen, setIsHPModalOpen] = useState(false);
    const [isXPModalOpen, setIsXPModalOpen] = useState(false);
    const [isMoneyModalOpen, setIsMoneyModalOpen] = useState(false);

    const [charValues, setCharValues] = useState({
        ac: 13, speed: 30, prof: '+2', 
        wallet: { pp: 0, gp: 0, sp: 0, cp: 0 },
        hpCurrent: 10, hpMax: 10,
        initiative: '+1', inspiration: 0, exhaustion: 0, xp: 0, maxXp: 300, level: 1
    });

    const [stats, setStats] = useState([
        { id: 'str', name: 'Strength', val: 11, mod: '-1', save: '-1', skills: [{n:'Athletics', v:'-1', prof: false}] },
        { id: 'dex', name: 'Dexterity', val: 11, mod: '-1', save: '-1', skills: [{n:'Acrobatics', v:'-1', prof: false}, {n:'Sleight of Hand', v:'-1', prof: false}, {n:'Stealth', v:'-1', prof: false}] },
        { id: 'con', name: 'Constitution', val: 11, mod: '-1', save: '-1', skills: [] },
        { id: 'int', name: 'Intelligence', val: 11, mod: '-1', save: '-1', skills: [{n:'Arcana', v:'-1', prof: false}, {n:'History', v:'-1', prof: false}, {n:'Investigation', v:'-1', prof: false}, {n:'Nature', v:'-1', prof: false}, {n:'Religion', v:'-1', prof: false}] },
        { id: 'wis', name: 'Wisdom', val: 11, mod: '-1', save: '-1', skills: [{n:'Animal Handling', v:'-1', prof: false}, {n:'Insight', v:'-1', prof: false}, {n:'Medicine', v:'-1', prof: false}, {n:'Perception', v:'-1', prof: false}, {n:'Survival', v:'-1', prof: false}] },
        { id: 'cha', name: 'Charisma', val: 11, mod: '-1', save: '-1', skills: [{n:'Deception', v:'-1', prof: false}, {n:'Intimidation', v:'-1', prof: false}, {n:'Performance', v:'-1', prof: false}, {n:'Persuasion', v:'-1', prof: false}] },
    ]);

    const openGeneric = (key, title) => { setGenericModal({ isOpen: true, key, title }); };
    const saveGeneric = (val) => { setCharValues(prev => ({ ...prev, [genericModal.key]: val })); };
    const saveHP = (current, max) => { setCharValues(prev => ({ ...prev, hpCurrent: current, hpMax: max })); };
    const saveXP = (xp, maxXp, level) => { setCharValues(prev => ({ ...prev, xp, maxXp, level })); };
    const saveWallet = (newWallet) => { setCharValues(prev => ({ ...prev, wallet: newWallet })); };
    const handleStatClick = (stat) => { setSelectedStat(stat); setIsStatModalOpen(true); };
    const handleUpdateStat = (updatedStat) => { setStats(stats.map(s => s.id === updatedStat.id ? updatedStat : s)); };
    const toggleSkill = (e, statId, skillIndex) => {
        e.stopPropagation();
        setStats(prev => prev.map(stat => {
            if (stat.id !== statId) return stat;
            const newSkills = [...stat.skills];
            newSkills[skillIndex] = { ...newSkills[skillIndex], prof: !newSkills[skillIndex].prof };
            return { ...stat, skills: newSkills };
        }));
    };

    const leftStats = stats.filter(s => ['str', 'con', 'int', 'cha'].includes(s.id));
    const midStats = stats.filter(s => ['dex', 'wis'].includes(s.id));
    const xpPercent = Math.min((charValues.xp / charValues.maxXp) * 100, 100);

    const StatBlock = ({ stat }) => (
        <div className="stat-card" onClick={() => handleStatClick(stat)} style={{cursor: 'pointer'}}>
            <div className="stat-header"><span className="stat-title">{stat.name}</span><div className="stat-circle">{stat.val}</div></div>
            <div className="stat-modifiers">
                <div className="mod-box"><span className="mod-label">Check</span><span className="mod-value">{stat.mod}</span></div>
                <div className="mod-box"><span className="mod-label">Saving Throw</span><span className="mod-value">{stat.save}</span></div>
            </div>
            <div className="skill-list">
                {stat.skills.map((s, i) => (
                    <div className="skill-row" key={i} onClick={(e) => toggleSkill(e, stat.id, i)}>
                        <div className="skill-name"><div className={`skill-dot ${s.prof ? 'active' : ''}`}></div>{s.n}</div>
                        <span className="skill-bonus">{s.v}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="char-info-wrapper">
            <Header/>
            <div className="char-header-panel">
                <div className="char-identity">
                    <div className="char-avatar-box"><img src="/assets/images/Wizard.jpg" alt="Profile" className="char-avatar-img"/></div>
                    <div className="char-name">
                        <h2>DreadNote</h2><span>Tiefling - Wizard</span>
                        <div className="char-level-xp" onClick={() => setIsXPModalOpen(true)} style={{cursor: 'pointer'}}>
                            <div className="level-badge">{charValues.level} lvl</div>
                            <div className="xp-bar-container">
                                <div className="xp-bar-fill" style={{width: `${xpPercent}%`}}></div>
                                <span className="xp-text">{charValues.xp} / {charValues.maxXp}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="char-stats-top">
                    <div className="top-stat-group">
                        <div className="stat-badge" onClick={() => openGeneric('ac', 'Armor Class')} style={{cursor:'pointer'}}><div className="shield-ac">{charValues.ac}</div><span className="stat-label">AC</span></div>
                        <div className="stat-badge" onClick={() => openGeneric('speed', 'Speed')} style={{cursor:'pointer'}}><span className="stat-simple-val">{charValues.speed} <span style={{fontSize:'12px', color:'#d32f2f'}}>ft</span></span><span className="stat-label">Speed</span></div>
                        <div className="stat-badge" onClick={() => openGeneric('prof', 'Proficiency')} style={{cursor:'pointer'}}><span className="stat-simple-val">{charValues.prof}</span><span className="stat-label">Proficiency</span></div>
                    </div>
                    
                    <div className="money-box" onClick={() => setIsMoneyModalOpen(true)} style={{cursor:'pointer'}}>
                        <span style={{color:'#ffc400', fontWeight:'bold'}}>$</span><span>{charValues.wallet.gp}</span>
                    </div>

                    <div className="hp-box" onClick={() => setIsHPModalOpen(true)} style={{cursor:'pointer'}}><img src="/assets/icons/Hp.svg" alt="HP" className="hp-icon" /><span>{charValues.hpCurrent} / {charValues.hpMax}</span></div>
                </div>
            </div>

            <div className="char-content-grid">
                <div className="col-left">{leftStats.map(s => <StatBlock key={s.id} stat={s} />)}</div>
                <div className="col-mid">
                    {midStats.map(s => <StatBlock key={s.id} stat={s} />)}
                    <div className="passive-section">
                        <div className="section-header">Passive Senses</div>
                        <div className="passive-row"><div className="passive-val-box">11</div><div className="passive-label-bar">Passive Perception</div></div>
                        <div className="passive-row"><div className="passive-val-box">11</div><div className="passive-label-bar">Passive Insight</div></div>
                        <div className="passive-row"><div className="passive-val-box">11</div><div className="passive-label-bar">Passive Investigation</div></div>
                    </div>
                    <div className="passive-section" style={{flexGrow:1, display:'flex', flexDirection:'column'}}><div className="section-header" style={{fontSize:'14px'}}>Other Proficiencies and Languages</div><div className="other-profs"></div></div>
                </div>
                <div className="col-right">
                    <input type="radio" name="tabs" id="tab-attacks" className="tab-toggle" defaultChecked />
                    <input type="radio" name="tabs" id="tab-skills" className="tab-toggle" />
                    <input type="radio" name="tabs" id="tab-equip" className="tab-toggle" />
                    <input type="radio" name="tabs" id="tab-notes" className="tab-toggle" />
                    <input type="radio" name="tabs" id="tab-spells" className="tab-toggle" />
                    <div className="combat-row">
                        <div className="combat-stat-box" onClick={() => openGeneric('initiative', 'Initiative')} style={{cursor:'pointer'}}><span className="c-val">{charValues.initiative}</span><span className="c-lbl">Initiative</span></div>
                        <div className="combat-stat-box" onClick={() => openGeneric('inspiration', 'Inspiration')} style={{cursor:'pointer'}}><span className="c-val">{charValues.inspiration}</span><span className="c-lbl">Inspiration</span></div>
                        <div className="combat-stat-box" onClick={() => openGeneric('exhaustion', 'Exhaustion')} style={{cursor:'pointer'}}><span className="c-val">{charValues.exhaustion}</span><span className="c-lbl">Exhaustion</span></div>
                        <div className="conditions-box"><span style={{fontSize:'11px', marginBottom:'2px'}}>Conditions</span><span style={{fontSize:'18px', color:'#aaa'}}>-</span></div>
                    </div>
                    <div className="tabs-nav">
                        <label htmlFor="tab-attacks" className="tab-label">Attacks</label>
                        <label htmlFor="tab-skills" className="tab-label">Skills</label>
                        <label htmlFor="tab-equip" className="tab-label">Equipment</label>
                        <label htmlFor="tab-notes" className="tab-label">Notes</label>
                        <label htmlFor="tab-spells" className="tab-label">Spells</label>
                    </div>
                    <div className="tab-content-area">
                        <div className="tab-pane pane-attacks">
                            <table className="attacks-table">
                                <thead><tr><th style={{width:'45%'}}>Name</th><th style={{width:'20%', textAlign:'center'}}>Bonus</th><th>Damage/Kind</th></tr></thead>
                                <tbody>
                                    <tr><td><input type="text" className="input-dark" defaultValue="Dagger" /></td><td><input type="text" className="input-dark" defaultValue="+5" style={{textAlign:'center'}} /></td><td><input type="text" className="input-dark" defaultValue="1d4+3 P" /></td></tr>
                                    <tr><td><input type="text" className="input-dark" defaultValue="Firebolt" /></td><td><input type="text" className="input-dark" defaultValue="+6" style={{textAlign:'center'}} /></td><td><input type="text" className="input-dark" defaultValue="1d10 F" /></td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="tab-pane pane-skills"><p>Skills...</p></div>
                        <div className="tab-pane pane-equip"><p>Inventory...</p></div>
                        <div className="tab-pane pane-notes"><textarea className="input-dark" style={{height:'100%', resize:'none', border:'none', background:'transparent'}} placeholder="Notes..."></textarea></div>
                        <div className="tab-pane pane-spells"><p>Spells...</p></div>
                    </div>
                </div>
            </div>

            <StatModal isOpen={isStatModalOpen} onClose={() => setIsStatModalOpen(false)} stat={selectedStat} onSave={handleUpdateStat} />
            <HPCalculatorModal isOpen={isHPModalOpen} onClose={() => setIsHPModalOpen(false)} currentHP={charValues.hpCurrent} maxHP={charValues.hpMax} onSave={saveHP} />
            <XPCalculatorModal isOpen={isXPModalOpen} onClose={() => setIsXPModalOpen(false)} xp={charValues.xp} maxXp={charValues.maxXp} level={charValues.level} onSave={saveXP} />
            <MoneyCalculatorModal isOpen={isMoneyModalOpen} onClose={() => setIsMoneyModalOpen(false)} wallet={charValues.wallet} onSave={saveWallet} />
            <GenericEditModal isOpen={genericModal.isOpen} onClose={() => setGenericModal({...genericModal, isOpen: false})} title={genericModal.title} value={charValues[genericModal.key]} onSave={saveGeneric} />
            <Footer/>
        </div> 
    );
};

export default Character_info;