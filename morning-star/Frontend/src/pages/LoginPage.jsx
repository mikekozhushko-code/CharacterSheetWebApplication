import React from 'react';
import { Link } from 'react-router-dom'; 
import '../styles/login_style.css'; 
import Header from '../components/Header';
import Footer from '../components/Footer';

const LoginPage = () => {
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
                            style={{transform:'scale(0.95)'}}       
                        />
                                            
                    <div className="login-form">
                        <div className="enter">
                            <label className="login-form-text" htmlFor="uname"><b>Login</b></label>
                            <input className="input-login" type="text" name="uname" required />
                        </div>

                        <div className="enter">
                            <label className="login-form-text" htmlFor="pass"><b>Password</b></label>
                            <input className="input-login" type="password" name="pass" required />
                        </div>
                        
                        <button className="button-login" type="button">Sign in</button>
                        <button className="button-login" type="button">
                            Sign in by Google 
                            <img className="google-icon" src="/assets/icons/google.svg" style={{transform:'translateY(4px)',width:"30px",height:"30px"}} alt="Google" />
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
            <Footer/>
        </>
    );
};

export default LoginPage;