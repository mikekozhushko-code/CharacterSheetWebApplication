import React from 'react';
import { Link } from 'react-router-dom'; 
import '../styles/Login_style.css'; 

import Header from '../components/Header';
import Footer from '../components/Footer';

const RegistrationPage = () => {
    return (
        <>
            <Header isAuthPage={true} btnText="Sign In" btnLink="/" />
            
            <main>
                <div className="login">
                    <img src="/assets/images/Pass.svg" alt="Pass" />
                    
                    <div className="login-form">
                         <div className="enter">
                            <label className="login-form-text" htmlFor="email"><b>Email</b></label>
                            <input className="input-login" type="email" name="email" required />
                        </div>
                        <div className="enter">
                            <label className="login-form-text" htmlFor="uname"><b>Login</b></label>
                            <input className="input-login" type="text" name="uname" required />
                        </div>

                        <div className="enter">
                            <label className="login-form-text" htmlFor="pass"><b>Password</b></label>
                            <input className="input-login" type="password" name="pass" required />
                        </div>
                         <div className="enter">
                            <label className="login-form-text" htmlFor="pass-repeat"><b>Repeat Password</b></label>
                            <input className="input-login" type="password" name="pass-repeat" required />
                        </div>
                        
                        <button className="button-login" type="button">Sign up</button>
                        <button className="button-login" type="button">
                            Sign up by Google 
                            <img className="google-icon" src="/assets/icons/google.svg" alt="Google" style={{transform:'translateY(4px)',width:"30px",height:"30px"}}/>
                        </button>

                        <div className="register-redirect">
                            <span style={{ color: 'white'}}>Already have an account?</span>
                            <Link to="/" className="register-link">
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
            <Footer/>
        </>
    );
};

export default RegistrationPage;