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
                <div className = "characters">
                    <a className='cc-btn' href='#'>Create Character</a>
                    <div className='wardrobe-characters'>

                    </div>
                </div>
            </main>
            <Footer/>
        </div> 
    );
};

export default Wardrobe;