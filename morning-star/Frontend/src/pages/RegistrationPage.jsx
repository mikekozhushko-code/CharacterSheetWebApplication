import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Login_style.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from "../Api.jsx";

const RegistrationPage = () => {
    const [form, setForm] = useState({
        username: "",
        email: "",
        password1: "",
        password2: "",
    });
    const [errors, setErrors]       = useState({});
    const [submitError, setSubmitError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = async (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));

        if (name === "username" || name === "email") {
            try {
                await api.get("/check-unique/", { params: { [name]: value } });
                setErrors(prev => ({ ...prev, [name]: "" }));
            } catch (err) {
                if (err.response?.data?.[name]) {
                    const msg = Array.isArray(err.response.data[name])
                        ? err.response.data[name].join(", ")
                        : err.response.data[name];
                    setErrors(prev => ({ ...prev, [name]: msg }));
                }
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password1 !== form.password2) {
            setErrors(prev => ({ ...prev, password2: "Passwords do not match" }));
            return;
        }
        setSubmitError("");
        setIsLoading(true);
        try {
            await api.post("/register/", form);
            navigate("/");
        } catch (err) {
            const data = err.response?.data;
            if (data && typeof data === 'object') {
                setErrors(prev => ({ ...prev, ...data }));
            } else {
                setSubmitError("Registration failed. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Header isAuthPage={true} btnText="signIn" btnLink="/" />

            <main>
                <div className="login">
                    <img
                        className="emblem"
                        src="/assets/images/Pass.svg"
                        alt="Pass"
                        width="379"
                        height="569"
                        style={{ transform: 'translateY(0.1px) scale(0.95)' }}
                    />

                    <div className="login-form">
                        <form onSubmit={handleSubmit}>
                            <div className="enter">
                                <label className="login-form-text" htmlFor="email"><b>Email</b></label>
                                <input className="input-login" type="email" name="email" onChange={handleChange} required />
                                {errors.email && <p className="error" style={{ color: '#e57373', fontSize: '13px', margin: '4px 0' }}>{errors.email}</p>}
                            </div>
                            <div className="enter">
                                <label className="login-form-text" htmlFor="username"><b>Login</b></label>
                                <input className="input-login" type="text" name="username" onChange={handleChange} required />
                                {errors.username && <p className="error" style={{ color: '#e57373', fontSize: '13px', margin: '4px 0' }}>{errors.username}</p>}
                            </div>

                            <div className="enter">
                                <label className="login-form-text" htmlFor="password1"><b>Password</b></label>
                                <input className="input-login" type="password" name="password1" onChange={handleChange} required />
                            </div>
                            <div className="enter">
                                <label className="login-form-text" htmlFor="password2"><b>Repeat Password</b></label>
                                <input className="input-login" type="password" name="password2" onChange={handleChange} required />
                                {errors.password2 && <p className="error" style={{ color: '#e57373', fontSize: '13px', margin: '4px 0' }}>{errors.password2}</p>}
                            </div>

                            {submitError && <p className="error" style={{ color: '#e57373', fontSize: '13px', margin: '4px 0' }}>{submitError}</p>}

                            <button className="button-login" type="submit" disabled={isLoading}>
                                {isLoading ? "Signing up..." : "Sign up"}
                            </button>
                            <button className="button-login" type="button">
                                Sign up by Google
                                <img className="google-icon" src="/assets/icons/google.svg" alt="Google" style={{ transform: 'translateY(4px)', width: "30px", height: "30px" }} />
                            </button>

                            <div className="register-redirect">
                                <span style={{ color: 'white' }}>Already have an account?</span>
                                <Link to="/" className="register-link">Sign In</Link>
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
