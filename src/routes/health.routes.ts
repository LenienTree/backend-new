import { Router } from 'express';
import { getHealth, ping } from '../controllers/health.controller';

const router = Router();

// GET /api/health       — full deep health check (DB, S3, memory, config)
router.get('/', getHealth);

// GET /api/health/ping  — lightweight liveness probe (no external calls)
router.get('/ping', ping);

export default router;
