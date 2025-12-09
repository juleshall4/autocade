import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';

const UPSTREAM_URL = 'wss://192.168.1.45:3181/api/events';

async function createServer() {
    const app = express();

    // Create Vite server in middleware mode
    const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
    });

    // Use vite's connect instance as middleware
    app.use(vite.middlewares);

    const port = 5173;
    const server = app.listen(port, () => {
        console.log(`[Server] Running at http://localhost:${port}`);
    });

    // Create WebSocket server attached to the HTTP server
    const wss = new WebSocketServer({ noServer: true });

    // Handle WebSocket upgrade requests
    server.on('upgrade', (request, socket, head) => {
        const url = request.url || '';
        console.log('[Server] *** UPGRADE REQUEST ***');
        console.log('[Server] URL:', url);
        console.log('[Server] Headers:', JSON.stringify(request.headers, null, 2));

        // Use startsWith for more flexible matching
        if (url.startsWith('/api/events') || url.startsWith('/api')) {
            console.log('[WS] Matched API route. Connecting to upstream...');

            const upstreamWs = new WebSocket(UPSTREAM_URL, {
                rejectUnauthorized: false,
                origin: 'https://192.168.1.45:3181',
                headers: {
                    'Origin': 'https://192.168.1.45:3181'
                }
            });

            upstreamWs.on('open', () => {
                console.log('[WS] Upstream connection OPENED. Accepting client...');

                wss.handleUpgrade(request, socket, head, (clientWs) => {
                    console.log('[WS] Client WebSocket accepted and ready');

                    upstreamWs.on('message', (data) => {
                        if (clientWs.readyState === WebSocket.OPEN) {
                            clientWs.send(data.toString());
                        }
                    });

                    upstreamWs.on('close', (code, reason) => {
                        console.log('[WS] Upstream closed:', code);
                        if (clientWs.readyState === WebSocket.OPEN) {
                            clientWs.close();
                        }
                    });

                    upstreamWs.on('error', (err) => {
                        console.error('[WS] Upstream error:', err.message);
                        if (clientWs.readyState === WebSocket.OPEN) {
                            clientWs.close();
                        }
                    });

                    clientWs.on('message', (data) => {
                        if (upstreamWs.readyState === WebSocket.OPEN) {
                            upstreamWs.send(data.toString());
                        }
                    });

                    clientWs.on('close', () => {
                        console.log('[WS] Client disconnected');
                        if (upstreamWs.readyState === WebSocket.OPEN) {
                            upstreamWs.close();
                        }
                    });

                    clientWs.on('error', (err) => {
                        console.error('[WS] Client error:', err.message);
                    });
                });
            });

            upstreamWs.on('error', (err) => {
                console.error('[WS] *** UPSTREAM CONNECTION FAILED ***');
                console.error('[WS] Error:', err.message);
                console.error('[WS] Stack:', err.stack);
                socket.destroy();
            });

        } else if (url.includes('vite') || url === '/') {
            console.log('[Server] Vite HMR request, forwarding to Vite');
            vite.ws.handleUpgrade(request, socket, head);
        } else {
            console.log('[Server] Unknown WebSocket request, destroying socket');
            socket.destroy();
        }
    });
}

createServer();
