import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

import { LanguageProvider } from './context/LanguageContext';
import { WorldBuilderProvider } from './context/WorldBuilderContext';
import ErrorBoundary from './components/ErrorBoundary';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute.jsx';

const LoginPage       = lazy(() => import('./pages/LoginPage'));
const RegistrationPage= lazy(() => import('./pages/RegistrationPage'));
const Characters      = lazy(() => import('./pages/Characters.jsx'));
const Wardrobe_c      = lazy(() => import('./pages/Wardrobe_c'));
const Character_info  = lazy(() => import('./pages/Character_info'));
const News            = lazy(() => import('./pages/News'));
const Main            = lazy(() => import('./pages/Main'));
const About           = lazy(() => import('./pages/About'));
const Profile         = lazy(() => import('./pages/Profile'));
const SharedCharacter = lazy(() => import('./pages/SharedCharacter.jsx'));
const GameLobby       = lazy(() => import('./pages/Gamelobby.jsx'));
const GameTable       = lazy(() => import('./pages/GameTable.jsx'));
const WorldBuilder    = lazy(() => import('./pages/WorldBuilder'));
const WorldEditor     = lazy(() => import('./pages/WorldEditor'));
const WikiView        = lazy(() => import('./components/worldbuilder/WikiView'));

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0d0d0d', color: '#ffc400' }}>
    Loading...
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <WorldBuilderProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/registration" element={<PublicRoute><RegistrationPage /></PublicRoute>} />

              <Route path="/profile"     element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/character"   element={<PrivateRoute><Characters /></PrivateRoute>} />
              <Route path="/character-info/:id/edit/" element={<PrivateRoute><Character_info /></PrivateRoute>} />
              <Route path="/wardrobe"    element={<PrivateRoute><Wardrobe_c /></PrivateRoute>} />
              <Route path="/news"        element={<PrivateRoute><News /></PrivateRoute>} />
              <Route path="/about"       element={<PrivateRoute><About /></PrivateRoute>} />
              <Route path="/main"        element={<PrivateRoute><Main /></PrivateRoute>} />

              <Route path="/table"       element={<PrivateRoute><GameLobby /></PrivateRoute>} />
              <Route path="/table/:code" element={<PrivateRoute><GameTable /></PrivateRoute>} />

              <Route path="/worldbuilder"     element={<PrivateRoute><WorldBuilder /></PrivateRoute>} />
              <Route path="/worldbuilder/:id" element={<PrivateRoute><WorldEditor /></PrivateRoute>} />
              <Route path="/wiki/:session_id" element={<PrivateRoute><WikiView /></PrivateRoute>} />

              <Route path="/shared/:token" element={<SharedCharacter />} />
            </Routes>
          </Suspense>
        </WorldBuilderProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
