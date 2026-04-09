import { FastifyInstance } from 'fastify';
import { getHealth, ping } from '../controllers/health.controller';

export default async function healthRoutes(fastify: FastifyInstance) {
    // GET /api/health
    fastify.get('/', getHealth);

    // GET /api/health/ping
    fastify.get('/ping', ping);
}

