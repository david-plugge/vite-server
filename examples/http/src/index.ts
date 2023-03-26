import { WebSocketServer } from 'ws';
import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import html from './app.html?raw';
import { Duplex } from 'stream';

const wss = new WebSocketServer({ noServer: true });

function requestHandler(req: IncomingMessage, res: ServerResponse) {
    res.setHeader('content-type', 'text/html');
    res.end(html);
}

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
    const server = createServer(requestHandler);

    server.on('upgrade', handleUpgrade);
    server.listen(5000);
}

// dev server
if (import.meta.hot) {
    const viteServer = import.meta.hot.data.viteHttpServer as Server;
    import.meta.hot.data.cleanup?.();

    viteServer.on('request', requestHandler);
    viteServer.on('upgrade', handleUpgrade);

    import.meta.hot.data.cleanup = () => {
        viteServer.off('request', requestHandler);
        viteServer.off('upgrade', handleUpgrade);
        wss.clients.forEach((client) => client.close());
    };
}
