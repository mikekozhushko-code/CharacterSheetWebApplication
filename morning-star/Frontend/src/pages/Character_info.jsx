import React, { useState, useEffect } from 'react';
import '../styles/Character_style.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { authApi } from '../Api.jsx';
import { useParams } from 'react-router-dom';

// --- MODALS (Статична логіка, оновлений вигляд через CSS) ---

const StatModal = ({ isOpen, onClose, stat, onSave }) => {
    const [localVal, setLocalVal] = useState(stat?.val || 10);
    const [localSave, setLocalSave] = useState(stat?.save || 0);
    useEffect(() => { if (stat) { setLocalVal(stat.val); setLocalSave(stat.save); } }, [stat]);
    if (!isOpen || !stat) return null;
    const modifier = Math.floor((localVal - 10) / 2);
    const displayMod = modifier >= 0 ? `+${modifier}` : modifier;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h3>{stat.name} <span style={{ color: '#ffc400' }}>{displayMod}</span></h3><button className="close-btn" onClick={onClose}>×</button></div>
                <div className="modal-body">
                    <div className="modal-field"><label>Score</label><input type="number" className="modal-input" value={localVal} onChange={(e) => setLocalVal(e.target.value)} /></div>
                    <div className="modal-field"><label>Save Bonus</label><input type="text" className="modal-input" value={localSave} onChange={(e) => setLocalSave(e.target.value)} /></div>
                </div>
                <div className="modal-footer"><button className="save-btn" onClick={() => { onSave({ ...stat, val: parseInt(localVal), mod: displayMod, save: localSave }); onClose(); }}>Save</button></div>
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

const GenericEditModal = ({ isOpen, onClose, title, value, onSave }) => {
    const [val, setVal] = useState(value);
    useEffect(() => setVal(value), [isOpen, value]);
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ width: '300px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h3>{title}</h3><button className="close-btn" onClick={onClose}>×</button></div>
                <div className="modal-body"><input className="modal-input" value={val} onChange={e => setVal(e.target.value)} /></div>
                <div className="modal-footer"><button className="save-btn" onClick={() => { onSave(val); onClose() }}>Save</button></div>
            </div>
        </div>
    );
};

/* --- ГОЛОВНИЙ КОМПОНЕНТ --- */
const Character_info = () => {
    // Єбана залупа я тебе ненавиджу сука блятський git
    const [character, setCharacter] = useState([]);
    const [stats, setStats] = useState([]);
    const [char, setChar] = useState(null);
    const { id } = useParams();

    useEffect(() => {
        authApi().get(`character-info/${id}/`)
            .then(res => {
                setCharacter(res.data);
                setStats(res.data.stats);
                setChar(res.data.char);
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
    const openGeneric = (key, title) => { setGenericData({ key, title }); toggleModal('generic', true); };
    const updateStat = (newStat) => setStats(prev => prev.map(s => s.id === newStat.id ? newStat : s));
    const updateChar = (key, val) => setChar(prev => ({ ...prev, [key]: val }));
    const toggleSkill = (e, statId, idx) => {
        e.stopPropagation();
        setStats(prev => prev.map(s => {
            if (s.id !== statId) return s;
            const skills = [...s.skills]; skills[idx].prof = !skills[idx].prof;
            return { ...s, skills };
        }));
    };

    // const xpPerc = Math.min((char.xp / char.maxXp) * 100, 100);
    const xpPerc = Math.min((100 / 100) * 100, 100);

    const VerticalStat = ({ stat }) => (
        <div className="v-stat-card" onClick={() => openStat(stat)}>
            <div className="v-stat-mod">{stat.mod}</div>
            <div className="v-stat-val">{stat.val}</div>
            <div className="v-stat-name">{stat.name.slice(0, 3)}</div>
            <div className="v-stat-save-tiny">SV {stat.save}</div>
        </div>
    );

    if (!character || !char || !stats) return <p>Loading...</p>

    return (
        <div className="char-info-wrapper">
            <Header />

            {/* 1. HUD (Floating Panel) */}
            <div className="hud-panel">
                <div className="hud-left">
                    <div className="hud-avatar"><img src="/assets/images/Wizard.jpg" alt="Avatar" /></div>
                    <div className="hud-info">
                        <h1>{character.name}</h1>
                        <div className="hud-sub">{character.race} • {character.class_type}</div>
                        <div className="hud-xp-bar" onClick={() => toggleModal('xp', true)}>
                            <div className="hud-xp-fill" style={{ width: `${xpPerc}%` }}></div>
                            {/* <span className="hud-xp-text">LVL {character.level} • {char.xp} / {char.maxXp}</span> */}
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

            {/* 2. MAIN DASHBOARD */}
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
                            <label htmlFor="deck-atk">Attacks</label>
                            <label htmlFor="deck-spl">Spells</label>
                            <label htmlFor="deck-inv">Inventory</label>
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
                    <div className="skills-scroll-container">
                        {/* {stats.map(stat => stat.skills.map((skill, i) => ( */}
                        {/*     <div className="skill-strip" key={`${stat.id}-${i}`} onClick={(e) => toggleSkill(e, stat.id, i)}> */}
                        {/*         <div className={`skill-indicator ${skill.prof ? 'proficient' : ''}`}></div> */}
                        {/*         <span className="skill-name">{skill.n} <span className="skill-stat-tag">({stat.id.toUpperCase()})</span></span> */}
                        {/*         <span className="skill-val">{skill.v}</span> */}
                        {/*     </div> */}
                        {/* )))} */}
                    </div>
                    <div className="passives-box">
                        <div className="passive-line"><span className="pv-val">12</span> Perception</div>
                        <div className="passive-line"><span className="pv-val">14</span> Investigation</div>
                        <div className="passive-line"><span className="pv-val">10</span> Insight</div>
                    </div>
                </div>

            </div>

            {/* MODALS */}
            <StatModal isOpen={modals.stat} onClose={() => toggleModal('stat', false)} stat={selectedStat} onSave={updateStat} />
            <HPCalculatorModal isOpen={modals.hp} onClose={() => toggleModal('hp', false)} currentHP={char.hpCurrent} maxHP={char.hpMax} onSave={(c, m) => updateChar('hpCurrent', c) || updateChar('hpMax', m)} />
            <XPCalculatorModal isOpen={modals.xp} onClose={() => toggleModal('xp', false)} xp={char.xp} maxXp={char.maxXp} level={char.level} onSave={(x, mx, l) => updateChar('xp', x) || updateChar('maxXp', mx) || updateChar('level', l)} />
            <MoneyCalculatorModal isOpen={modals.money} onClose={() => toggleModal('money', false)} wallet={char.wallet} onSave={(w) => updateChar('wallet', w)} />
            <GenericEditModal isOpen={modals.generic} onClose={() => toggleModal('generic', false)} title={genericData.title} value={char[genericData.key]} onSave={(v) => updateChar(genericData.key, v)} />

            <Footer />
        </div>
    );
};

export default Character_info;
