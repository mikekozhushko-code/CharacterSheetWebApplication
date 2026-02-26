import React, { useEffect } from 'react';
import '../styles/Home_style.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext'; // ✅ Імпорт хука

const Home = () => {
    const { t, language } = useLanguage(); // ✅ Дістаємо t та мову

    useEffect(() => {
        const handleMouseMove = (e) => {
            const moveX = (e.clientX * -0.02);
            const moveY = (e.clientY * -0.02);
            const hero = document.querySelector('.hero-bg-layer');
            if (hero) {
                hero.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.1)`;
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        // ✅ Додаємо клас lang-uk для зміни шрифтів
        <div className={`home-wrapper ${language === 'uk' ? 'lang-uk' : ''}`}>
            <Header />

            <section className="hero-section">
                <div className="hero-bg-layer"></div>
                <div className="hero-overlay"></div>
                
                <div className="particles-container">
                    <div className="particle p1"></div>
                    <div className="particle p2"></div>
                    <div className="particle p3"></div>
                    <div className="particle p4"></div>
                </div>

                <div className="hero-content">
                    <h2 className="hero-subtitle">{t('heroSubtitle')}</h2>
                    <h1 className="hero-title">
                        <span>{t('heroTitle1')}</span> <br />
                        <span className="text-highlight">{t('heroTitle2')}</span>
                    </h1>
                    <p className="hero-description">{t('heroDesc')}</p>
                    
                    <button className="cta-button-main">
                        <span className="btn-text">{t('btnCreate')}</span>
                        <div className="btn-glow"></div>
                    </button>
                </div>
            </section>

            <section className="features-section">
                <div className="section-header">
                    <h3>{t('featuresTitle')}</h3>
                    <div className="header-decoration"></div>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">⚔️</div>
                        <h4>{t('feat1_title')}</h4>
                        <p>{t('feat1_desc')}</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📜</div>
                        <h4>{t('feat2_title')}</h4>
                        <p>{t('feat2_desc')}</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🎒</div>
                        <h4>{t('feat3_title')}</h4>
                        <p>{t('feat3_desc')}</p>
                    </div>
                </div>
            </section>

            <section className="quote-section">
                <blockquote>
                    "{t('quote')}"
                </blockquote>
                <cite>— {t('dm')}</cite>
            </section>

            <Footer />
        </div>
    );
};

export default Home;