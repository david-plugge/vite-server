import { Server } from 'http';
import { WebSocketServer } from 'ws';
import html from './app.html?raw';

const server = new Server();
const wss = new WebSocketServer({ server });

server.on('request', (req, res) => {
    res.setHeader('content-type', 'text/html').end(html);
});

wss.on('connection', (socket) => {
    const i = setInterval(() => {
        socket.send('time: ' + new Date().toDateString());
    }, 1000);

    socket.on('close', () => {
        clearInterval(i);
    });
});

if (import.meta.hot) {
    await import.meta.hot.data.cleanup?.();

    import.meta.hot.data.cleanup = () => {
        return new Promise<void>((res, rej) => {
            wss.clients.forEach((client) => client.close());
            server.closeAllConnections();
            server.close((err) => {
                if (err) rej(err);
                else res();
            });
        });
    };
}

server.listen(
    {
        port: 5000,
    },
    () => {
        console.log('Server started at http://localhost:5000/');
    },
);
