import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import compress from '@fastify/compress';
import rateLimit from '@fastify/rate-limit';
import formbody from '@fastify/formbody';
import multipart from '@fastify/multipart';
import { config } from './config/config';
import routes from './routes';
import { errorHandler, notFound } from './middleware/error.middleware';

const app: FastifyInstance = fastify({
    logger: config.env !== 'test' ? {
        level: config.env === 'production' ? 'info' : 'debug',
        transport: config.env !== 'production' ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        } : undefined,
    } : false,
    // Schema-based serialization is enabled by default in Fastify
    // but we ensure it's prioritized
    ajv: {
        customOptions: {
            removeAdditional: 'all',
            coerceTypes: true,
            useDefaults: true,
        },
    },
});

// ── Plugins & Middleware ──────────────────────────────────────────────────────
const allowedOrigins = [
    config.clientUrl,
    'https://lenienttree.com',
    'https://www.lenienttree.com',
    'https://lenienttree.in',
    'https://www.lenienttree.in',
    'http://localhost:3000',
    'http://localhost:5173',
];

app.register(cors, {
    origin: (origin, callback) => {
        if (!origin) {
            callback(null, true);
            return;
        }

        const isAllowed = allowedOrigins.includes(origin) || 
            /^https:\/\/[a-zA-Z0-9-._]+\.vercel\.app$/.test(origin);

        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origin '${origin}' is not allowed`), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

app.register(helmet, {
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
});

app.register(cookie);
app.register(formbody);
app.register(multipart, {
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
});

app.register(compress, { global: true });

// Rate Limiting
// WARNING: default in-memory store is per-process — in PM2 cluster mode each worker
// tracks limits independently, making the effective limit (max × workers).
// To enforce a true global limit, add Redis: npm i @fastify/redis ioredis
// and pass `redis: redisClient` here. Acceptable trade-off on free-tier infra.
app.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.windowMs,
});

// ── Root Health Check ─────────────────────────────────────────────────────────
const serverStartTime = Date.now();
app.get('/', async (request, reply) => {
    reply.status(200).send({
        status: 'healthy',
        message: 'LenientTree Backend API is operational',
        uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
        deployment: {
            version: '1.1.0',
            updatedAt: '2026-05-26T00:58:51+05:30',
            features: [
                'Centralized automated email notification system',
                'SMTP connection pooling & fallback degraded mode',
                'Vercel dynamic preview CORS allowed origins'
            ]
        }
    });
});

app.get('/health', async (request, reply) => {
    reply.status(200).send({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
        deployment: {
            version: '1.1.0',
            updatedAt: '2026-05-26T00:58:51+05:30'
        }
    });
});

// ── Routes ────────────────────────────────────────────────────────────────────
// We prefix all routes with /api as per existing structure
app.register(routes, { prefix: '/api' });

// ── Error Handling ────────────────────────────────────────────────────────────
app.setNotFoundHandler(notFound);
app.setErrorHandler(errorHandler);

export default app;
