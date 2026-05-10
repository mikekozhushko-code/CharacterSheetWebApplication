import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const getMaskedEmail = (email) => {
    if (!email || !email.includes('@')) return email;
    const [name, domain] = email.split('@');
    return `${name.substring(0, 3)}***@${domain}`;
};

const ChangePasswordModal = ({ isOpen, onClose, email }) => {
    const { t } = useLanguage();
    const [step, setStep]               = useState(1);
    const [code, setCode]               = useState('');
    const [newPass, setNewPass]         = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [error, setError]             = useState('');

    const handleClose = () => {
        setStep(1); setCode(''); setNewPass(''); setConfirmPass(''); setError('');
        onClose();
    };

    const handleVerify = () => {
        if (!code.trim()) { setError('Enter the verification code'); return; }
        setError(''); setStep(2);
    };

    const handleUpdatePassword = () => {
        if (newPass !== confirmPass) { setError('Passwords do not match'); return; }
        if (newPass.length < 6)     { setError('Password must be at least 6 characters'); return; }
        setError(''); handleClose();
    };

    if (!isOpen) return null;

    return (
        <div className="epic-modal-overlay" onClick={handleClose}>
            <div className="epic-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="epic-modal-header">
                    <h3>{t('arcaneSecurity')}</h3>
                    <button className="epic-close-btn" onClick={handleClose}>×</button>
                </div>
                <div className="epic-modal-body">
                    {step === 1 ? (
                        <div className="security-step">
                            <p className="security-msg">
                                {t('securityMsg')} <br/>
                                <span className="highlight-email">{getMaskedEmail(email)}</span>
                            </p>
                            <div className="epic-field-group">
                                <label>{t('verificationCode')}</label>
                                <input type="text" placeholder="XB-99-21" className="epic-input text-center"
                                    value={code} onChange={(e) => setCode(e.target.value)}/>
                            </div>
                        </div>
                    ) : (
                        <div className="security-step">
                            <div className="epic-field-group">
                                <label>{t('newPassword')}</label>
                                <input type="password" placeholder="••••••" className="epic-input"
                                    value={newPass} onChange={(e) => setNewPass(e.target.value)}/>
                            </div>
                            <div className="epic-field-group">
                                <label>{t('confirmPassword')}</label>
                                <input type="password" placeholder="••••••" className="epic-input"
                                    value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}/>
                            </div>
                        </div>
                    )}
                    {error && <p className="epic-error">{error}</p>}
                </div>
                <div className="epic-modal-footer">
                    {step === 1
                        ? <button className="epic-btn-save" onClick={handleVerify}>{t('verifyRune')}</button>
                        : <button className="epic-btn-save" onClick={handleUpdatePassword}>{t('updatePassBtn')}</button>
                    }
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
