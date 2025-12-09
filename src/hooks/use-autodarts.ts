import { useEffect, useState, useRef, useCallback } from 'react';
import type { AutodartsState } from '../types/autodarts';

export interface LogEntry {
    id: number;
    timestamp: string;
    type: string;
    data: unknown;
    raw: string;
}

const MAX_LOG_SIZE = 1000;

export const useAutodarts = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [latestState, setLatestState] = useState<AutodartsState | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const wsRef = useRef<WebSocket | null>(null);
    const connectingRef = useRef(false);
    const mountedRef = useRef(true);
    const logIdRef = useRef(0);

    const addLog = useCallback((type: string, data: unknown, raw: string) => {
        const entry: LogEntry = {
            id: logIdRef.current++,
            timestamp: new Date().toLocaleTimeString(),
            type,
            data,
            raw,
        };
        setLogs((prev) => {
            const newLogs = [...prev, entry];
            if (newLogs.length > MAX_LOG_SIZE) {
                return newLogs.slice(newLogs.length - MAX_LOG_SIZE);
            }
            return newLogs;
        });
    }, []);

    useEffect(() => {
        mountedRef.current = true;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/events`;

        const connect = () => {
            if (connectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
                return;
            }

            connectingRef.current = true;
            addLog('system', { action: 'connecting', url: wsUrl }, `Connecting to ${wsUrl}...`);

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                connectingRef.current = false;
                if (mountedRef.current) {
                    setIsConnected(true);
                    addLog('system', { action: 'connected' }, 'Connected!');
                }
            };

            ws.onclose = (event) => {
                connectingRef.current = false;
                wsRef.current = null;
                if (mountedRef.current) {
                    setIsConnected(false);
                    addLog('system', { action: 'disconnected', code: event.code }, `Disconnected (code: ${event.code})`);
                    setTimeout(() => {
                        if (mountedRef.current) {
                            connect();
                        }
                    }, 3000);
                }
            };

            ws.onerror = () => {
                connectingRef.current = false;
                addLog('error', { action: 'error' }, 'Connection error');
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    const messageType = message.type || 'unknown';

                    // Skip motion_state - too spammy
                    if (messageType === 'motion_state') {
                        return;
                    }

                    // Log the raw message
                    addLog(messageType, message.data || message, event.data);

                    // Extract state from the message wrapper
                    if (message.type === 'state' && message.data && mountedRef.current) {
                        setLatestState(message.data);
                    }
                } catch (e) {
                    addLog('parse-error', { error: String(e) }, event.data);
                }
            };
        };

        const timeoutId = setTimeout(connect, 100);

        return () => {
            mountedRef.current = false;
            clearTimeout(timeoutId);
        };
    }, [addLog]);

    const clearLogs = useCallback(() => {
        setLogs([]);
    }, []);

    // Function to inject simulated state (same format as Board Manager)
    const simulateState = useCallback((state: AutodartsState) => {
        // Log it just like a real message
        addLog('state', state, JSON.stringify({ type: 'state', data: state }));
        // Update the state
        setLatestState(state);
    }, [addLog]);

    return { isConnected, latestState, logs, clearLogs, simulateState };
};
