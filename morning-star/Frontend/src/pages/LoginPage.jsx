import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Login_style.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from "../Api.jsx";

const LoginPage = () => {
    const [form, setForm] = useState({ username: "", password: "" });
    const navigate = useNavigate();

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/token/", form);
            localStorage.setItem("token", res.data.access);
            localStorage.setItem("refresh", res.data.refresh);
            alert("Login correct");
            navigate("/profile")
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };


    return (
        <>
            <Header isAuthPage={true} />

            <main>
                <div className="login">
                    <img
                        className="emblem"
                        src="/assets/images/Pass.svg"
                        alt="Pass"
                        width="379"
                        height="569"
                        style={{ transform: 'scale(0.95)' }}
                    />

                    <div className="login-form">
                        <form onSubmit={handleSubmit}>
                            <div className="enter">
                                <label className="login-form-text" htmlFor="username"><b>Login</b></label>
                                <input className="input-login" type="text" name="username" onChange={handleChange} required />
                            </div>

                            <div className="enter">
                                <label className="login-form-text" htmlFor="password"><b>Password</b></label>
                                <input className="input-login" type="password" name="password" onChange={handleChange} required />
                            </div>

                            <button className="button-login" type="submit">Sign in</button>
                        </form>
                        <button className="button-login" type="button">
                            Sign in by Google
                            <img className="google-icon" src="/assets/icons/google.svg" style={{ transform: 'translateY(4px)', width: "30px", height: "30px" }} alt="Google" />
                        </button>

                        <div className="register-redirect">
                            <span style={{ color: 'white', marginRight: '5px' }}>Don't have an account?</span>
                            <Link to="/registration" className="register-link">
                                Sign Up
                            </Link>
                        </div>

                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
};

export default LoginPage;
