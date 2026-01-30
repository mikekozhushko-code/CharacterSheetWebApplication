import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Character_style.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Profile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    alert("Logout success");
    navigate("/");
  };

  return (
    <div className="">
      <Header />
      <main>
        <h1 style={{ color: 'white', textAlign: 'center' }}>Welcome inside the Profile!</h1>;
        <button onClick={handleLogout}>Logout</button>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
