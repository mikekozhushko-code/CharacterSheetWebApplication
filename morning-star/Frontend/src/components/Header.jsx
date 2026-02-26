import React, { useState } from 'react'; 
import { Link } from 'react-router-dom';
import '../styles/Header.css';
import { useLanguage } from '../context/LanguageContext'; 

const Header = ({ isAuthPage = false, btnText = "signUp", btnLink = "/registration" }) => {
    const [isLangOpen, setIsLangOpen] = useState(false);
    
    const { t, setLanguage, language } = useLanguage();

    const handleLangChange = (lang) => {
        setLanguage(lang);
        setIsLangOpen(false); 
    };

    return (
        <header className={isAuthPage ? 'header-auth' : ''}>
            <div className="upper-header"></div>
            <img className="chains" src="/assets/images/chains.svg" alt="" />
            <div className="candles">
                <img className="candle" src="/assets/images/candle1.svg" alt="" />
                <img className="candle" src="/assets/images/candle2.svg" alt="" />
                <img className="candle" src="/assets/images/candle3.svg" alt="" />
                <img className="candle" src="/assets/images/candle4.svg" alt="" />
                <img className="candle" src="/assets/images/candle1.svg" alt="" />
            </div>

            <div className="main-header">
                
                <Link to="/" className="logo-link">
                    <img
                        className={isAuthPage ? "logo logo-auth" : "logo"}
                        src="/assets/icons/logo.svg"
                        alt="Logo"
                    />
                </Link>

                {!isAuthPage && (
                    <nav className={language === 'uk' ? 'nav-uk' : ''}>
                        <Link className="nav-item" to="/main">{t('home')}</Link>
                        <Link className="nav-item" to="/character">{t('character')}</Link>
                        <Link className="nav-item" to="/news">{t('news')}</Link>
                        <Link className="nav-item" to="/about">{t('about')}</Link>
                        
                        <div 
                            className="nav-item language-dropdown-container"
                            onClick={() => setIsLangOpen(!isLangOpen)}
                        >
                            {t('language')}
                            
                            {isLangOpen && (
                                <div className="language-dropdown-menu">
                                    <div className="language-option" onClick={() => handleLangChange('en')}>ENG</div>
                                    <div className="language-option" onClick={() => handleLangChange('uk')}>UKR</div>
                                </div>
                            )}
                        </div>

                    </nav>
                )}

                <div className="right-section">
                    {!isAuthPage ? (
                        <Link className="profile" to="/profile">
                            <img className="profile-pic" src="/assets/icons/profile.svg" alt="Profile" />
                        </Link>
                    ) : (
                        <Link className="nav-item" to={btnLink} style={{ textDecoration: 'none' }}>
                            {t(btnText)}
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;