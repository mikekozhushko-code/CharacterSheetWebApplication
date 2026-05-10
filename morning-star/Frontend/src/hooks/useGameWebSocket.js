import { useRef, useState, useEffect, useCallback } from 'react';

const WS_BASE             = import.meta.env.VITE_WS_URL || `ws://${window.location.host}`;
const MAX_RECONNECT       = 5;
const RECONNECT_BASE_MS   = 1000;
const RECONNECT_MAX_MS    = 30000;

export const useGameWebSocket = (code, onMessage) => {
    const [isConnected, setIsConnected]   = useState(false);
    const wsRef                           = useRef(null);
    const isMountedRef                    = useRef(true);
    const reconnectTimerRef               = useRef(null);
    const reconnectCountRef               = useRef(0);
    const onMessageRef                    = useRef(onMessage);
    useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

    const connectWS = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token || !isMountedRef.current) return;

        const ws = new WebSocket(`${WS_BASE}/ws/table/${code}/?token=${token}`);
        wsRef.current = ws;

        ws.onopen = () => {
            if (!isMountedRef.current) return;
            setIsConnected(true);
            reconnectCountRef.current = 0;
        };

        ws.onmessage = (e) => {
            if (isMountedRef.current) onMessageRef.current(JSON.parse(e.data));
        };

        ws.onclose = () => {
            if (!isMountedRef.current) return;
            setIsConnected(false);
            if (reconnectCountRef.current < MAX_RECONNECT) {
                reconnectCountRef.current++;
                const delay = Math.min(
                    RECONNECT_BASE_MS * 2 ** reconnectCountRef.current,
                    RECONNECT_MAX_MS
                );
                reconnectTimerRef.current = setTimeout(connectWS, delay);
            }
        };

        ws.onerror = (err) => console.error('WS error:', err);
    }, [code]);

    useEffect(() => {
        isMountedRef.current = true;
        connectWS();
        return () => {
            isMountedRef.current = false;
            clearTimeout(reconnectTimerRef.current);
            if (wsRef.current) {
                wsRef.current.onclose = null;
                wsRef.current.close();
            }
        };
    }, [connectWS]);

    const wsSend = useCallback((type, payload) => {
        if (wsRef.current?.readyState === WebSocket.OPEN)
            wsRef.current.send(JSON.stringify({ type, payload }));
    }, []);

    return { isConnected, wsSend };
};
