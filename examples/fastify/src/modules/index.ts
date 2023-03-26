import { FastifyInstance } from 'fastify';
import html from '../app.html?raw';

export default async (app: FastifyInstance) => {
    app.get('/', (req, reply) => {
        reply.type('text/html').send(html);
    });
};
