import { useEffect, useState, useRef } from 'react';
import type { AutodartsState } from '../types/autodarts';

export const useAutodarts = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [latestState, setLatestState] = useState<AutodartsState | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const connectingRef = useRef(false);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/events`;

        const connect = () => {
            // Prevent duplicate connections
            if (connectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
                console.log('Already connected or connecting, skipping...');
                return;
            }

            connectingRef.current = true;
            console.log('Connecting to Autodarts WS:', wsUrl);

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('Autodarts WS Connected!');
                connectingRef.current = false;
                if (mountedRef.current) {
                    setIsConnected(true);
                }
            };

            ws.onclose = (event) => {
                console.log('Autodarts WS Disconnected. Code:', event.code, 'Reason:', event.reason || '(none)');
                connectingRef.current = false;
                wsRef.current = null;
                if (mountedRef.current) {
                    setIsConnected(false);
                    // Only reconnect if still mounted
                    setTimeout(() => {
                        if (mountedRef.current) {
                            connect();
                        }
                    }, 3000);
                }
            };

            ws.onerror = (err) => {
                console.error('Autodarts WS Error:', err);
                connectingRef.current = false;
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (mountedRef.current) {
                        setLatestState(data);
                    }
                } catch (e) {
                    console.error('Failed to parse Autodarts message:', e);
                }
            };
        };

        // Small delay to avoid React StrictMode double-mount race
        const timeoutId = setTimeout(connect, 100);

        return () => {
            mountedRef.current = false;
            clearTimeout(timeoutId);
            // Don't aggressively close on cleanup - let it stay open
            // This helps with React StrictMode which unmounts and remounts quickly
        };
    }, []);

    return { isConnected, latestState };
};
