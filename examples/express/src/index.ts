import express from 'express';
import { WebSocketServer } from 'ws';
import { IncomingMessage, Server } from 'http';
import html from './app.html?raw';
import { Duplex } from 'stream';

const app = express();
const wss = new WebSocketServer({ noServer: true });

app.get('/', (req, res) => {
    res.type('text/html').send(html);
});

wss.on('connection', (socket) => {
    const i = setInterval(() => {
        socket.send('time: ' + new Date().toDateString());
    }, 1000);

    socket.on('close', () => {
        clearInterval(i);
    });
});

function handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer) {
    wss.handleUpgrade(req, socket, head, (client, request) => {
        wss.emit('connection', client, request);
    });
}

// prod server
if (import.meta.env.PROD) {
    app.listen(5000).on('upgrade', handleUpgrade);
}

// dev server
if (import.meta.hot) {
    const viteServer = import.meta.hot.data.viteHttpServer as Server;
    import.meta.hot.data.cleanup?.();

    viteServer.on('request', app);
    viteServer.on('upgrade', handleUpgrade);

    import.meta.hot.data.cleanup = () => {
        viteServer.off('request', app);
        viteServer.off('upgrade', handleUpgrade);
        wss.clients.forEach((client) => client.close());
    };
}
