import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import type { DartsCallerEvent } from '../types/darts-caller';

const URL = ''; // Use proxy

export const useDartsCaller = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<DartsCallerEvent | null>(null);

    useEffect(() => {
        const socket = io(URL, {
            rejectUnauthorized: false,
            transports: ['polling']
        });

        socket.on('connect', () => {
            console.log('Connected to darts-caller');
            setIsConnected(true);
            socket.emit('message', 'hello');
        });

        socket.on('disconnect', () => {
            console.log('Disconnected');
            setIsConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.error('Connection Error:', err);
            setLastMessage({ event: 'error', error: err.message });
        });

        socket.on('message', (data: DartsCallerEvent) => {
            console.log('Received message:', data);
            setLastMessage(data);
        });

        // Listen to all events for debugging (if needed, but 'message' seems to be the protocol carrier based on snippet)

        return () => {
            socket.disconnect();
        };
    }, []);

    return { isConnected, lastMessage };
};
