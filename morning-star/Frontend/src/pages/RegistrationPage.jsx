import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import '../styles/Login_style.css';

import Header from '../components/Header';
import Footer from '../components/Footer';

import api from "../Api.jsx";

const RegistrationPage = () => {
    const [form, setForm] = useState({
        username: "",
        email: "",
        password1: "",
        password2: "",
    });
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post("/register/", form);
            navigate("/");
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }

    return (
        <>
            <Header isAuthPage={true} btnText="Sign In" btnLink="/" />

            <main>
                <div className="login">
                    <img
                        className="emblem"
                        src="/assets/images/Pass.svg"
                        alt="Pass"
                        width="379"
                        height="569"
                        style={{ transform: ' translateY(-97.1px) scale(0.95)  ' }}
                    />

                    <div className="login-form">
                        <form onSubmit={handleSubmit}>
                            <div className="enter">
                                <label className="login-form-text" htmlFor="email"><b>Email</b></label>
                                <input className="input-login" type="email" name="email" onChange={handleChange} required />
                            </div>
                            <div className="enter">
                                <label className="login-form-text" htmlFor="username"><b>Login</b></label>
                                <input className="input-login" type="text" name="username" onChange={handleChange} required />
                            </div>

                            <div className="enter">
                                <label className="login-form-text" htmlFor="password1"><b>Password</b></label>
                                <input className="input-login" type="password" name="password1" onChange={handleChange} required />
                            </div>
                            <div className="enter">
                                <label className="login-form-text" htmlFor="password2"><b>Repeat Password</b></label>
                                <input className="input-login" type="password" name="password2" onChange={handleChange} required />
                            </div>

                            <button className="button-login" type="submit">Sign up</button>
                            <button className="button-login" type="button">
                                Sign up by Google
                                <img className="google-icon" src="/assets/icons/google.svg" alt="Google" style={{ transform: 'translateY(4px)', width: "30px", height: "30px" }} />
                            </button>

                            <div className="register-redirect">
                                <span style={{ color: 'white' }}>Already have an account?</span>
                                <Link to="/" className="register-link">
                                    Sign In
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
};

export default RegistrationPage;
