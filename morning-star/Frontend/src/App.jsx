import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import Wardrobe from './pages/Wardrobe';
import Wardrobe_c from './pages/Wardrobe_c';
import Character_info from './pages/Character_info';

const HomePage = () => <h1 style={{color: 'white', textAlign: 'center'}}>Welcome inside the Tavern!</h1>;

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      
      <Route path="/home" element={<HomePage />} />
      
      <Route path="/registration" element={<RegistrationPage />} />


      <Route path="/wardrobe" element={<Wardrobe />} />

      <Route path="/character" element={<Wardrobe_c />} />

      <Route path="/character-info" element={<Character_info />} />


    </Routes>
  );
}

export default App;