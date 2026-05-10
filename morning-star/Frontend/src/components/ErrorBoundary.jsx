import React from 'react';

export default class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary:', error, info.componentStack);
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div style={wrapStyle}>
                <div style={boxStyle}>
                    <p style={iconStyle}>⚠️</p>
                    <h2 style={titleStyle}>Something went wrong</h2>
                    <p style={msgStyle}>{this.state.error?.message}</p>
                    <button style={btnStyle} onClick={() => { window.location.href = '/'; }}>
                        Back to Home
                    </button>
                    <button style={retryStyle} onClick={() => this.setState({ hasError: false, error: null })}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }
}

const wrapStyle  = { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0d0d0d' };
const boxStyle   = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '40px', backgroundColor: '#1a1510', border: '1px solid #3a2e1e', borderRadius: '12px', maxWidth: '420px', textAlign: 'center' };
const iconStyle  = { fontSize: '48px', margin: 0 };
const titleStyle = { color: '#e57373', margin: 0, fontSize: '20px' };
const msgStyle   = { color: '#888', fontSize: '13px', margin: 0, wordBreak: 'break-word' };
const btnStyle   = { backgroundColor: '#ffc400', color: '#0d0d0d', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', width: '100%' };
const retryStyle = { backgroundColor: 'transparent', color: '#888', border: '1px solid #3a2e1e', borderRadius: '8px', padding: '8px 24px', cursor: 'pointer', fontSize: '13px', width: '100%' };
