import WebSocket from 'ws';

const url = 'wss://192.168.1.45:3181/api/events';

console.log(`Connecting to ${url}...`);

const ws = new WebSocket(url, {
    rejectUnauthorized: false,
    origin: 'https://192.168.1.45:3181'
});

ws.on('open', () => {
    console.log('CONNECTED! (Standalone script worked)');
    ws.close();
    process.exit(0);
});

ws.on('error', (err) => {
    console.error('CONNECTION FAILED:', err.message);
    process.exit(1);
});

ws.on('close', (code, reason) => {
    console.log(`Connection closed: ${code} ${reason}`);
});
