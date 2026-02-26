import React from 'react';
import { Routes, Route } from 'react-router-dom';

import { LanguageProvider } from './context/LanguageContext';

import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import Characters from './pages/Characters.jsx';
import Wardrobe_c from './pages/Wardrobe_c';
import Character_info from './pages/Character_info';
import News from './pages/News';
import Main from './pages/Main';
import About from './pages/About';
import Profile from './pages/Profile';
import PrivateRoute from './components/PrivateRoute';
import HomePage from './pages/HomePage.jsx'
import PublicRoute from './components/PublicRoute.jsx';


function App() {
  return (
    <LanguageProvider>
    <Routes>
      <Route path="/home" element={
        <HomePage />
        } />

      <Route path="/" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />

      <Route path="/registration" element={
        <PublicRoute>
          <RegistrationPage />
        </PublicRoute>
      } />

      <Route path="/wardrobe" element={
        <PrivateRoute>
          <Wardrobe_c />
        </PrivateRoute>
      } />

      <Route path="/character" element={
        <PrivateRoute>
          <Characters />
        </PrivateRoute>
      } />

      <Route path="/character-info/:id/edit/" element={
        <PrivateRoute>
          <Character_info />
        </PrivateRoute>
      } />

      <Route path="/profile" element={
        <PrivateRoute>
          <Profile />
        </PrivateRoute>
      } />

      </Routes>
    </LanguageProvider>
  );
}

export default App;
