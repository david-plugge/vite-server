import { FastifyInstance } from 'fastify';
import { WebSocketServer } from 'ws';

declare module 'fastify' {
    interface FastifyInstance {
        wss: WebSocketServer;
    }
}

export default async (app: FastifyInstance) => {
    const wss = new WebSocketServer({
        server: app.server,
    });

    app.wss = wss;

    if (import.meta.hot) {
        import.meta.hot.data.wssCleanup?.();
        import.meta.hot.data.wssCleanup = () => {
            wss.close();
            wss.clients.forEach((client) => client.close());
        };
    }

    app.addHook('onClose', (_app, done) => {
        wss.close(done);
    });

    wss.on('connection', (socket) => {
        const i = setInterval(() => {
            socket.send('time: ' + new Date().toDateString());
        }, 1000);

        socket.on('close', () => {
            clearInterval(i);
        });
    });
};
