import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Wardrob_style.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext'; // ✅ Імпорт хука

const Wardrobe = () => {
    const { t, language } = useLanguage(); // ✅ Дістаємо t та мову

    return (
        // ✅ Додаємо клас lang-uk для правильних шрифтів
        <div className={`wardrobe-wrapper ${language === 'uk' ? 'lang-uk' : ''}`}> 
            <Header/>
            <main>
                <div className="characters">
                    {/* ✅ Переклад кнопки */}
                    <a className='cc-btn' href='#'>{t('createChar')}</a>
                    
                    <div className='wardrobe-characters'>
                        
                        {/* ПЕРСОНАЖ 1: Wizard */}
                        <div className="character">
                            <div className="projection-container">
                                <img className="projection-image" src="/assets/images/Wizard.jpg" alt="Projection"/>
                                <div className="projection-stats">
                                    <div className="stat-block">
                                        <span className="stat-label">{t('str_short')}</span>
                                        <span className="stat-value">16</span>
                                        <span className="stat-modifier">(+3)</span>
                                    </div>
                                    <div className="stat-block">
                                        <span className="stat-label">{t('dex_short')}</span>
                                        <span className="stat-value">14</span>
                                        <span className="stat-modifier">(+2)</span>
                                    </div>
                                    <div className="stat-block">
                                        <span className="stat-label">{t('con_short')}</span>
                                        <span className="stat-value">15</span>
                                        <span className="stat-modifier">(+2)</span>
                                    </div>
                                    <div className="stat-block highlight">
                                        <span className="stat-label">{t('int_short')}</span>
                                        <span className="stat-value">18</span>
                                        <span className="stat-modifier">(+4)</span>
                                    </div>
                                    <div className="stat-block">
                                        <span className="stat-label">{t('wis_short')}</span>
                                        <span className="stat-value">12</span>
                                        <span className="stat-modifier">(+1)</span>
                                    </div>
                                    <div className="stat-block">
                                        <span className="stat-label">{t('cha_short')}</span>
                                        <span className="stat-value">10</span>
                                        <span className="stat-modifier">(+0)</span>
                                    </div>
                                </div>
                            </div>

                            <img className="character-img" src="/assets/icons/profile.svg" alt="icon"/>
                            <div className='character-text'>
                                <p className='character-name'>Dreadnote</p>
                                <div className='class'>
                                    {/* ✅ Переклад класу та рівня */}
                                    <p className='character-class'>{t('wizard')}</p>
                                    <p className='character-lvl'>1 {t('lvlShort')}</p>
                                </div>
                            </div>
                        </div>

                        {/* ПЕРСОНАЖ 2: Ranger */}
                        <div className="character">
                            <div className="projection-container">
                                <img className="projection-image" src="/assets/images/Ranger.jpg" alt="Projection"/>
                                <div className="projection-stats">
                                    <div className="stat-block">
                                        <span className="stat-label">{t('str_short')}</span>
                                        <span className="stat-value">16</span>
                                        <span className="stat-modifier">(+3)</span>
                                    </div>
                                    <div className="stat-block highlight">
                                        <span className="stat-label">{t('dex_short')}</span>
                                        <span className="stat-value">18</span>
                                        <span className="stat-modifier">(+4)</span>
                                    </div>
                                    <div className="stat-block">
                                        <span className="stat-label">{t('con_short')}</span>
                                        <span className="stat-value">15</span>
                                        <span className="stat-modifier">(+2)</span>
                                    </div>
                                    <div className="stat-block ">
                                        <span className="stat-label">{t('int_short')}</span>
                                        <span className="stat-value">10</span>
                                        <span className="stat-modifier">(+0)</span>
                                    </div>
                                    <div className="stat-block">
                                        <span className="stat-label">{t('wis_short')}</span>
                                        <span className="stat-value">9</span>
                                        <span className="stat-modifier">(+0)</span>
                                    </div>
                                    <div className="stat-block">
                                        <span className="stat-label">{t('cha_short')}</span>
                                        <span className="stat-value">10</span>
                                        <span className="stat-modifier">(+0)</span>
                                    </div>
                                </div>
                            </div>

                            <img className="character-img" src="/assets/icons/profile.svg" alt="icon"/>
                            <div className='character-text'>
                                <p className='character-name'>Dreadnote</p>
                                <div className='class'>
                                    <p className='character-class'>{t('ranger')}</p>
                                    <p className='character-lvl'>1 {t('lvlShort')}</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
            <Footer/>
        </div> 
    );
};

export default Wardrobe;