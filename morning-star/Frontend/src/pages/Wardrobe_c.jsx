import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Wardrob_style.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Wardrobe = () => {
    return (
        <div className="wardrobe-wrapper"> 
            <Header/>
            <main>
                <div className="characters">
                    <a className='cc-btn' href='#'>Create Character</a>
                    <div className='wardrobe-characters'>
                        
                        <div className="character">
                            
                            <div className="projection-container">
                                <img className="projection-image" src="/assets/images/Wizard.jpg" alt="Projection"/>
                                
                                <div className="projection-stats">
                                    <div className="stat-block">
                                        <span className="stat-label">STR</span>
                                        <span className="stat-value">16</span>
                                        <span className="stat-modifier">(+3)</span>
                                    </div>
                                    <div className="stat-block">
                                        <span className="stat-label">DEX</span>
                                        <span className="stat-value">14</span>
                                        <span className="stat-modifier">(+2)</span>
                                    </div>
                                    <div className="stat-block">
                                        <span className="stat-label">CON</span>
                                        <span className="stat-value">15</span>
                                        <span className="stat-modifier">(+2)</span>
                                    </div>
                                    <div className="stat-block highlight">
                                        <span className="stat-label">INT</span>
                                        <span className="stat-value">18</span>
                                        <span className="stat-modifier">(+4)</span>
                                    </div>
                                    <div className="stat-block">
                                        <span className="stat-label">WIS</span>
                                        <span className="stat-value">12</span>
                                        <span className="stat-modifier">(+1)</span>
                                    </div>
                                    <div className="stat-block">
                                        <span className="stat-label">CHA</span>
                                        <span className="stat-value">10</span>
                                        <span className="stat-modifier">(+0)</span>
                                    </div>
                                </div>
                            </div>

                            <img className="character-img" src="/assets/icons/profile.svg" alt="icon"/>
                            <div className='character-text'>
                                <p className='character-name'>Dreadnote</p>
                                <div className='class'>
                                    <p className='character-class'>Wizard</p>
                                    <p className='character-lvl'>1 lvl</p>
                                </div>
                            </div>
                        </div>
                        <div className="character">
                            
                            <div className="projection-container">
                                <img className="projection-image" src="/assets/images/Ranger.jpg" alt="Projection"/>
                                
                                <div className="projection-stats">
                                    <div className="stat-block">
                                        <span className="stat-label">STR</span>
                                        <span className="stat-value">16</span>
                                        <span className="stat-modifier">(+3)</span>
                                    </div>
                                    <div className="stat-block highlight">
                                        <span className="stat-label">DEX</span>
                                        <span className="stat-value">18</span>
                                        <span className="stat-modifier">(+4)</span>
                                    </div>
                                    <div className="stat-block">
                                        <span className="stat-label">CON</span>
                                        <span className="stat-value">15</span>
                                        <span className="stat-modifier">(+2)</span>
                                    </div>
                                    <div className="stat-block ">
                                        <span className="stat-label">INT</span>
                                        <span className="stat-value">10</span>
                                        <span className="stat-modifier">(+0)</span>
                                    </div>
                                    <div className="stat-block">
                                        <span className="stat-label">WIS</span>
                                        <span className="stat-value">9</span>
                                        <span className="stat-modifier">(+0)</span>
                                    </div>
                                    <div className="stat-block">
                                        <span className="stat-label">CHA</span>
                                        <span className="stat-value">10</span>
                                        <span className="stat-modifier">(+0)</span>
                                    </div>
                                </div>
                            </div>

                            <img className="character-img" src="/assets/icons/profile.svg" alt="icon"/>
                            <div className='character-text'>
                                <p className='character-name'>Dreadnote</p>
                                <div className='class'>
                                    <p className='character-class'>Wizard</p>
                                    <p className='character-lvl'>1 lvl</p>
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