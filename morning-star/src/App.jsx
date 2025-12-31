import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';

const HomePage = () => <h1 style={{color: 'white', textAlign: 'center'}}>Welcome inside the Tavern!</h1>;

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      
      <Route path="/home" element={<HomePage />} />
      
      <Route path="/registration" element={<RegistrationPage />} />
    </Routes>
  );
}

export default App;