import React, { useState, useEffect } from 'react';
import '../styles/Character_style.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

const HomePage = () => {
  return (
    <div className="">
      <Header />
      <main>
        <h1 style={{ color: 'white', textAlign: 'center' }}>Welcome inside the Tavern!</h1>;
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
