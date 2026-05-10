import React, { useState, useEffect } from 'react';
import { authApi } from '../Api.jsx';

const DURATION_OPTIONS = [
    { value: '1h',  label: '1 Hour'   },
    { value: '24h', label: '24 Hours' },
    { value: '7d',  label: '7 Days'   },
    { value: '30d', label: '30 Days'  },
];

const ShareModal = ({ isOpen, onClose, characterId }) => {
    const [permission, setPermission]     = useState('view');
    const [duration, setDuration]         = useState('24h');
    const [generatedUrl, setGeneratedUrl] = useState(null);
    const [isLoading, setIsLoading]       = useState(false);
    const [copied, setCopied]             = useState(false);
    const [error, setError]               = useState('');

    useEffect(() => {
        if (isOpen) { setGeneratedUrl(null); setCopied(false); setError(''); }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await authApi.post(`/characters/${characterId}/share/`, { permission, duration });
            setGeneratedUrl(`${window.location.origin}/shared/${res.data.token}`);
        } catch (err) {
            setError('Failed to generate link. Try again.');
            console.error('Share token error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="epic-modal-overlay" onClick={onClose}>
            <div className="epic-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="epic-modal-header">
                    <h3>🔗 Share Character</h3>
                    <button className="epic-close-btn" onClick={onClose}>×</button>
                </div>

                <div className="epic-modal-body">
                    <div className="epic-field-group">
                        <label>Link expires in</label>
                        <select className="epic-input" value={duration} onChange={(e) => setDuration(e.target.value)}>
                            {DURATION_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {generatedUrl && (
                        <div className="share-url-box">
                            <input type="text" readOnly className="epic-input" value={generatedUrl} />
                            <button className="epic-btn-save" onClick={handleCopy}>
                                {copied ? '✓ Copied!' : 'Copy'}
                            </button>
                        </div>
                    )}

                    {error && <p className="epic-error">{error}</p>}
                </div>

                <div className="epic-modal-footer">
                    {!generatedUrl
                        ? <button className="epic-btn-save" onClick={handleGenerate} disabled={isLoading}>
                            {isLoading ? '...' : 'Generate Link'}
                          </button>
                        : <button className="epic-btn-outline" onClick={() => setGeneratedUrl(null)}>
                            Generate New
                          </button>
                    }
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
