import React, { useEffect } from 'react';
import '../styles/Home_style.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Home = () => {
    
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
        <div className="home-wrapper">
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
                    <h2 className="hero-subtitle">The Tale Begins Here</h2>
                    <h1 className="hero-title">
                        <span>Forge Your</span> <br />
                        <span className="text-highlight">Legend</span>
                    </h1>
                    <p className="hero-description">
                        Manage your stats, spells, and inventory in one arcane tome. 
                        No more lost papers. Just pure adventure.
                    </p>
                    
                    <button className="cta-button-main">
                        <span className="btn-text">Create Character</span>
                        <div className="btn-glow"></div>
                    </button>
                </div>
            </section>

            <section className="features-section">
                <div className="section-header">
                    <h3>Why Choose This Tool?</h3>
                    <div className="header-decoration"></div>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">⚔️</div>
                        <h4>Combat Ready</h4>
                        <p>Track initiative, HP, and spell slots in real-time. Never slow down the battle.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📜</div>
                        <h4>Spellbook</h4>
                        <p>Instant access to all your spells with damage calculators and descriptions.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🎒</div>
                        <h4>Inventory</h4>
                        <p>Manage your loot, gold, and equipment weight with a simple drag-and-drop feel.</p>
                    </div>
                </div>
            </section>

            <section className="quote-section">
                <blockquote>
                    "A blank character sheet is a promise of adventure, chaos, and glory."
                </blockquote>
                <cite>— The Dungeon Master</cite>
            </section>

            <Footer />
        </div>
    );
};

export default Home;