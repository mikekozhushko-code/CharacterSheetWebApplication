import React from 'react';
import '../styles/About_style.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext'; // ✅ Імпорт хука

const About = () => {
    const { t, language } = useLanguage(); // ✅ Дістаємо t та поточну мову

    return (
        // ✅ Додаємо динамічний клас для зміни шрифту, як ми робили на інших сторінках
        <div className={`about-wrapper ${language === 'uk' ? 'lang-uk' : ''}`}>
            <Header />
            
            <div className="about-container">
                
                <section className="about-hero">
                    <h1 className="about-title">{t('aboutTitle')}</h1>
                    <div className="title-underline"></div>
                    <p className="about-subtitle">{t('aboutSubtitle')}</p>
                </section>

                <section className="story-block">
                    <div className="story-content">
                        <h2>{t('ourMission')}</h2>
                        <p>{t('missionP1')}</p>
                        <p>{t('missionP2')}</p>
                    </div>
                    <div className="story-image">
                        <div className="img-frame">
                            <img src="/assets/images/tavern_interior.jpg" alt="Tavern Interior" className="about-img"/>
                        </div>
                    </div>
                </section>

                <section className="team-section">
                    <h2 className="section-title">{t('guildMasters')}</h2>
                    <div className="team-grid">
                        
                        <div className="team-card">
                            <div className="team-avatar">
                                <img src="/assets/images/dev_avatar1.jpg" alt="Dev" />
                            </div>
                            <h3>{t('coderName')}</h3>
                            <span className="role">{t('coderRole')}</span>
                            <p>{t('coderDesc')}</p>
                        </div>

                        <div className="team-card">
                            <div className="team-avatar">
                                <img src="/assets/images/dev_avatar2.jpg" alt="Dev" />
                            </div>
                            <h3>{t('architectName')}</h3>
                            <span className="role">{t('architectRole')}</span>
                            <p>{t('architectDesc')}</p>
                        </div>

                        <div className="team-card">
                            <div className="team-avatar">
                                <img src="/assets/images/dev_avatar3.jpg" alt="Dev" />
                            </div>
                            <h3>{t('bardName')}</h3>
                            <span className="role">{t('bardRole')}</span>
                            <p>{t('bardDesc')}</p>
                        </div>

                    </div>
                </section>

                <section className="tech-section">
                    <h2>{t('arcaneTech')}</h2>
                    <div className="tech-icons">
                        <div className="tech-rune">React</div>
                        <div className="tech-rune">Vite</div>
                        <div className="tech-rune">Node.js</div>
                        <div className="tech-rune">D&D 5e</div>
                    </div>
                </section>

            </div>

            <Footer />
        </div>
    );
};

export default About;