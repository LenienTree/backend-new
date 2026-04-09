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
        if (!origin || allowedOrigins.includes(origin)) {
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

// Response Compression disabled temporarily
// app.register(compress, { global: true });

// Rate Limiting
app.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.windowMs,
});

// ── Routes ────────────────────────────────────────────────────────────────────
// We prefix all routes with /api as per existing structure
app.register(routes, { prefix: '/api' });

// ── Error Handling ────────────────────────────────────────────────────────────
app.setNotFoundHandler(notFound);
app.setErrorHandler(errorHandler);

export default app;
