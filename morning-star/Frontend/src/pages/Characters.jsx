import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import '../styles/Wardrob_style.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { authApi } from "../Api.jsx";
import { useState, useEffect } from 'react';

const Characters = () => {
    const [characters, setCharacters] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        authApi().get("/characters/")
            .then(res => setCharacters(res.data))
            .catch(err => console.error(err));
    }, []);

    const handleCreateCharacter = async () => {
        try {
            const res = await authApi().post("/characters/create/", {
                name: "New Character",
            });
            const newCharacterId = res.data.id;
            alert("Character create success");
            navigate(`/character-info/${newCharacterId}/edit`);
        } catch (error) {
            alert(error);
        }
    };

    const handleClick = (id) => {
        navigate(`/character-info/${id}/edit`);
    }

    return (
        <div className="wardrobe-wrapper">
            <Header />
            <main>
                <div className="characters">
                    <a className='cc-btn' href='#' onClick={handleCreateCharacter}>Create Character</a>
                    <div className='wardrobe-characters'>
                        {characters.map(char => (
                            <div className="character" key={char.id} onClick={() => handleClick(char.id)}>
                                <div className="projection-container">
                                    <img className="projection-image" src="/assets/images/Ranger.jpg" alt="Projection" />

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
                                <img className="character-img" src="/assets/icons/profile.svg" alt="icon" />
                                <div className='character-text'>
                                    <p className='character-name'>{char.name}</p>
                                    <div className='class'>
                                        <p className='character-class'>{char.class_type}</p>
                                        <p className='character-lvl'>{char.level} lvl</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Characters;
