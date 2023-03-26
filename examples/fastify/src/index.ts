import fastify, { FastifyServerFactory } from 'fastify';
import { Server } from 'http';

function viteFastifyServerFactory(): FastifyServerFactory | undefined {
    if (import.meta.hot) {
        const data = import.meta.hot.data as {
            viteHttpServer: Server;
            cleanup?: () => void;
        };

        return (handler) => {
            data.cleanup?.();
            data.cleanup = () => data.viteHttpServer.off('request', handler);
            data.viteHttpServer.on('request', handler);
            return data.viteHttpServer;
        };
    }
}

const app = fastify({
    logger: true,
    serverFactory: viteFastifyServerFactory(),
});

const plugins = import.meta.glob('./plugins/**/*.ts', {
    eager: true,
}) as Record<string, { default: () => void }>;
const modules = import.meta.glob('./modules/**/*.ts', {
    eager: true,
}) as Record<string, { default: () => void }>;

for (const mod of Object.values(plugins)) {
    app.register(mod.default);
}

for (const mod of Object.values(modules)) {
    app.register(mod.default);
}

await app.ready();

if (import.meta.env.PROD) {
    await app.listen({
        port: 5000,
    });
}
