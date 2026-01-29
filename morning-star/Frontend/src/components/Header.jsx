import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Header.css';


const Header = ({ isAuthPage = false, btnText = "Sign Up", btnLink = "/registration" }) => {
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
                    <nav>
                        <Link className="nav-item" to="/home">Home</Link>
                        <Link className="nav-item" to="/character">Character</Link>
                        <Link className="nav-item" to="/news">News</Link>
                        <Link className="nav-item" to="/about">About</Link>
                        <Link className="nav-item" to="/language">Language</Link>
                    </nav>
                )}

                <div className="right-section">
                    {!isAuthPage ? (
                        <Link className="profile" to="/profile">
                            <img src="/assets/icons/profile.svg" alt="Profile" />
                        </Link>
                    ) : (
                        <Link className="nav-item" to={btnLink} style={{ textDecoration: 'none' }}>
                            {btnText}
                        </Link>
                    )}
                </div>

            </div>
        </header>
    );
};

export default Header;
