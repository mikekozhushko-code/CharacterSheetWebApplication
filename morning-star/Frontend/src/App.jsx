import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import Wardrobe from './pages/Wardrobe';
import Wardrobe_c from './pages/Wardrobe_c';
import Character_info from './pages/Character_info';
import PrivateRoute from './components/PrivateRoute';
import HomePage from './pages/HomePage.jsx'
import Profile from './pages/Profile.jsx';
import PublicRoute from './components/PublicRoute.jsx';


function App() {
  return (
    <Routes>
      <Route path="/home" element={<HomePage />} />

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
          <Wardrobe />
        </PrivateRoute>
      } />

      <Route path="/character" element={
        <PrivateRoute>
          <Wardrobe_c />
        </PrivateRoute>
      } />

      <Route path="/character-info" element={
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
  );
}

export default App;
