import { Request, Response } from 'express';
import { HeadBucketCommand } from '@aws-sdk/client-s3';
import { prisma } from '../config/database';
import s3Client from '../config/s3';
import { config } from '../config/config';

const startTime = Date.now();

interface ServiceStatus {
    status: 'ok' | 'degraded' | 'down';
    latencyMs?: number;
    detail?: string;
}

interface HealthPayload {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptimeSeconds: number;
    version: string;
    environment: string;
    services: {
        database: ServiceStatus;
        s3: ServiceStatus;
    };
    system: {
        memoryUsedMB: number;
        memoryTotalMB: number;
        memoryUsagePercent: number;
        nodeVersion: string;
    };
    config: {
        jwtConfigured: boolean;
        smtpConfigured: boolean;
        s3Configured: boolean;
        databaseConfigured: boolean;
    };
}

// ── Database check ─────────────────────────────────────────────────────────────
async function checkDatabase(): Promise<ServiceStatus> {
    const start = Date.now();
    try {
        await prisma.$queryRaw`SELECT 1`;
        return { status: 'ok', latencyMs: Date.now() - start };
    } catch (err) {
        return {
            status: 'down',
            latencyMs: Date.now() - start,
            detail: err instanceof Error ? err.message : 'Unknown database error',
        };
    }
}

// ── S3 check ───────────────────────────────────────────────────────────────────
async function checkS3(): Promise<ServiceStatus> {
    const start = Date.now();

    if (!config.s3.bucketName || !config.s3.accessKeyId || !config.s3.secretAccessKey) {
        return { status: 'degraded', detail: 'S3 credentials not fully configured' };
    }

    try {
        await s3Client.send(new HeadBucketCommand({ Bucket: config.s3.bucketName }));
        return { status: 'ok', latencyMs: Date.now() - start };
    } catch (err) {
        return {
            status: 'down',
            latencyMs: Date.now() - start,
            detail: err instanceof Error ? err.message : 'Unknown S3 error',
        };
    }
}

// ── Config sanity check ────────────────────────────────────────────────────────
function checkConfig() {
    return {
        jwtConfigured:
            !!process.env.JWT_SECRET &&
            process.env.JWT_SECRET !== 'fallback_secret_dev_only' &&
            !!process.env.JWT_REFRESH_SECRET &&
            process.env.JWT_REFRESH_SECRET !== 'fallback_refresh_secret_dev_only',
        smtpConfigured:
            !!process.env.SMTP_USER &&
            process.env.SMTP_USER !== 'your_email@gmail.com' &&
            !!process.env.SMTP_PASS &&
            process.env.SMTP_PASS !== 'your_app_password',
        s3Configured:
            !!config.s3.bucketName && !!config.s3.accessKeyId && !!config.s3.secretAccessKey,
        databaseConfigured: !!process.env.DATABASE_URL,
    };
}

// ── System metrics ─────────────────────────────────────────────────────────────
function getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    return {
        memoryUsedMB: memUsedMB,
        memoryTotalMB: memTotalMB,
        memoryUsagePercent: Math.round((memUsedMB / memTotalMB) * 100),
        nodeVersion: process.version,
    };
}

// ── GET /api/health ────────────────────────────────────────────────────────────
export const getHealth = async (_req: Request, res: Response): Promise<void> => {
    const [database, s3] = await Promise.all([checkDatabase(), checkS3()]);

    const configStatus = checkConfig();
    const system = getSystemMetrics();

    // Derive overall status
    let overallStatus: HealthPayload['status'] = 'healthy';
    if (database.status === 'down') {
        overallStatus = 'unhealthy';
    } else if (database.status === 'degraded' || s3.status === 'down' || s3.status === 'degraded') {
        overallStatus = 'degraded';
    }

    const payload: HealthPayload = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
        version: '1.0.0',
        environment: config.env,
        services: { database, s3 },
        system,
        config: configStatus,
    };

    // 200 for healthy/degraded, 503 for unhealthy
    const httpStatus = overallStatus === 'unhealthy' ? 503 : 200;
    res.status(httpStatus).json({ success: overallStatus !== 'unhealthy', ...payload });
};

// ── GET /api/health/ping ───────────────────────────────────────────────────────
// Lightweight liveness probe — no external calls, safe for load-balancer checks
export const ping = (_req: Request, res: Response): void => {
    res.status(200).json({
        success: true,
        message: 'pong',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    });
};
