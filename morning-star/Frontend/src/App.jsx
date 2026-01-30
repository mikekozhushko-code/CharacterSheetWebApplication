import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import Characters from './pages/Characters.jsx';
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
  );
}

export default App;
