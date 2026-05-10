import { useState, useRef, useEffect, useCallback } from 'react';

export const ZOOM_MIN = 0.2;
export const ZOOM_MAX = 3;
export const clamp    = (val, min, max) => Math.min(max, Math.max(min, val));

export const useCamera = (viewportRef, enabled = true) => {
    const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
    const cameraRef           = useRef(camera);
    const isPanning           = useRef(false);
    const lastPanPos          = useRef({ x: 0, y: 0 });
    useEffect(() => { cameraRef.current = camera; }, [camera]);

    const toCanvasCoords = useCallback((clientX, clientY) => {
        const rect = viewportRef.current.getBoundingClientRect();
        const cam  = cameraRef.current;
        return {
            x: (clientX - rect.left - cam.x) / cam.zoom,
            y: (clientY - rect.top  - cam.y) / cam.zoom,
        };
    }, [viewportRef]);

    const onWheelRef = useRef(null);
    onWheelRef.current = (e) => {
        e.preventDefault();
        const rect    = viewportRef.current.getBoundingClientRect();
        const cam     = cameraRef.current;
        const factor  = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = clamp(cam.zoom * factor, ZOOM_MIN, ZOOM_MAX);
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        setCamera({
            x:    mx - (mx - cam.x) * (newZoom / cam.zoom),
            y:    my - (my - cam.y) * (newZoom / cam.zoom),
            zoom: newZoom,
        });
    };

    useEffect(() => {
        if (!enabled) return;
        const el = viewportRef.current;
        if (!el) return;
        const handler = (e) => onWheelRef.current(e);
        el.addEventListener('wheel', handler, { passive: false });
        return () => el.removeEventListener('wheel', handler);
    }, [viewportRef, enabled]);

    const onPanStart = useCallback((e) => {
        if (e.button !== 1) return;
        e.preventDefault();
        isPanning.current  = true;
        lastPanPos.current = { x: e.clientX, y: e.clientY };
    }, []);

    const onPanMove = useCallback((e) => {
        if (!isPanning.current) return;
        const dx = e.clientX - lastPanPos.current.x;
        const dy = e.clientY - lastPanPos.current.y;
        lastPanPos.current = { x: e.clientX, y: e.clientY };
        setCamera((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    }, []);

    const onPanEnd = useCallback((e) => {
        if (e.button === 1) isPanning.current = false;
    }, []);

    const resetCamera = useCallback(() => setCamera({ x: 0, y: 0, zoom: 1 }), []);

    return {
        camera, setCamera, cameraRef, isPanning,
        toCanvasCoords,
        onPanStart, onPanMove, onPanEnd,
        resetCamera,
    };
};
