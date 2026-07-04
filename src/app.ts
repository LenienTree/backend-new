import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
// @fastify/compress removed — gzip handled by Nginx (avoids premature close stream conflict)
// import rateLimit from '@fastify/rate-limit';
import formbody from '@fastify/formbody';
import multipart from '@fastify/multipart';
import { config } from './config/config';
import routes from './routes';
import { errorHandler, notFound } from './middleware/error.middleware';
import { prisma } from './config/database';
import { referralService } from './services/referral.service';

const app: FastifyInstance = fastify({
    // Behind nginx, the socket IP is always 127.0.0.1. Trusting the proxy makes
    // request.ip resolve to the real client (from X-Forwarded-For) so per-IP
    // rate limiting counts each user separately instead of as one shared client.
    trustProxy: true,
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
].filter(Boolean);

app.register(cors, {
    origin: (origin, callback) => {
        if (!origin) {
            callback(null, true);
            return;
        }

        const isAllowed = allowedOrigins.includes(origin) || 
            /^https:\/\/[a-zA-Z0-9-._]+\.vercel\.app$/.test(origin) ||
            /^http:\/\/localhost(:\d+)?$/.test(origin) ||
            /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);

        if (isAllowed) {
            callback(null, true);
        } else {
            callback(null, false);
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

// Compression is handled by Nginx (gzip_proxied, gzip_types) — not at the Node.js layer

// Rate Limiting
// WARNING: default in-memory store is per-process — in PM2 cluster mode each worker
// tracks limits independently, making the effective limit (max × workers).
// To enforce a true global limit, add Redis: npm i @fastify/redis ioredis
// and pass `redis: redisClient` here. Acceptable trade-off on free-tier infra.
/*
app.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.windowMs,
});
*/

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

app.get('/sitemap.xml', async (request, reply) => {
    try {
        const events = await prisma.event.findMany({
            where: { status: 'APPROVED', deletedAt: null },
            select: { id: true, updatedAt: true },
        });

        const baseUrl = config.clientUrl || 'https://lenienttree.com';
        
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        // Static routes
        xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
        xml += `  <url>\n    <loc>${baseUrl}/explore</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;

        // Dynamic event routes
        events.forEach(event => {
            const lastmod = event.updatedAt.toISOString().split('T')[0];
            xml += `  <url>\n    <loc>${baseUrl}/events/${event.id}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
        });

        xml += `</urlset>`;

        reply.type('application/xml').send(xml);
    } catch (err: any) {
        app.log.error(err);
        reply.status(500).send('Internal Server Error');
    }
});

// ── Short referral links ───────────────────────────────────────────────────────
// GET /r/:code → 302 redirect to the full event URL (with UTM tags rebuilt).
// Lets us share compact links like https://lenienttree.in/r/PDC85F. The ?r=code
// is preserved on the destination so the landing page still tracks the click.
app.get<{ Params: { code: string } }>('/r/:code', async (request, reply) => {
    const { code } = request.params;
    const target = await referralService.resolveTargetUrl(code);
    // Unknown/expired code → send them to the homepage rather than a dead end.
    reply.code(302).header('location', target ?? config.clientUrl).send();
});

// ── Routes ────────────────────────────────────────────────────────────────────
// We prefix all routes with /api as per existing structure
app.register(routes, { prefix: '/api' });

// ── Error Handling ────────────────────────────────────────────────────────────
app.setNotFoundHandler(notFound);
app.setErrorHandler(errorHandler);

export default app;
