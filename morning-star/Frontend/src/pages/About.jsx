import React from 'react';
import '../styles/About_style.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

const About = () => {
    return (
        <div className="about-wrapper">
            <Header />
            
            <div className="about-container">
                
                <section className="about-hero">
                    <h1 className="about-title">The Tavern's Tale</h1>
                    <div className="title-underline"></div>
                    <p className="about-subtitle">
                        Where numbers meet narrative, and paper sheets turn into legends.
                    </p>
                </section>

                <section className="story-block">
                    <div className="story-content">
                        <h2>Our Mission</h2>
                        <p>
                            "Tavern Near The River" was forged in the fires of late-night campaigns and lost character sheets. 
                            We believe that Dungeons & Dragons should be about the story, not the math.
                        </p>
                        <p>
                            Our goal is to provide a digital grimoire that feels as authentic as a parchment scroll but acts with the speed of a lightning spell. 
                            Whether you are a battle-hardened Paladin or a cunning Rogue, your legacy is safe with us.
                        </p>
                    </div>
                    <div className="story-image">
                        <div className="img-frame">
                            <img src="/assets/images/tavern_interior.jpg" alt="Tavern Interior" className="about-img"/>
                        </div>
                    </div>
                </section>

                <section className="team-section">
                    <h2 className="section-title">The Guild Masters</h2>
                    <div className="team-grid">
                        
                        <div className="team-card">
                            <div className="team-avatar">
                                <img src="/assets/images/dev_avatar1.jpg" alt="Dev" />
                            </div>
                            <h3>Archmage Coder</h3>
                            <span className="role">Frontend Wizard</span>
                            <p>Weaver of React spells and CSS enchantments.</p>
                        </div>

                        <div className="team-card">
                            <div className="team-avatar">
                                <img src="/assets/images/dev_avatar2.jpg" alt="Dev" />
                            </div>
                            <h3>Dungeon Architect</h3>
                            <span className="role">Backend Smith</span>
                            <p>Keeper of databases and server logic.</p>
                        </div>

                        <div className="team-card">
                            <div className="team-avatar">
                                <img src="/assets/images/dev_avatar3.jpg" alt="Dev" />
                            </div>
                            <h3>Bard of Design</h3>
                            <span className="role">UI/UX Artist</span>
                            <p>Creator of visual styles and user journeys.</p>
                        </div>

                    </div>
                </section>

                <section className="tech-section">
                    <h2>Arcane Technologies</h2>
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