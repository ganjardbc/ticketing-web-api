import { Router, Request, Response } from 'express';
import { getConnection } from '../db/connection';
import { Logger } from '../utils/logger';
import { clearRateLimiterStore } from '../middleware/rateLimiter';

const router = Router();
const logger = new Logger('HealthRoutes');

/**
 * GET /health
 * Check API health and database connectivity
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const connection = await getConnection();
    
    // Test database connectivity
    await connection.query('SELECT 1');
    connection.release();

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    logger.info('Health check passed');
    res.json({
      success: true,
      data: healthStatus,
      message: 'API is healthy',
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'disconnected',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      message: 'API is unhealthy - database connection failed',
    });
  }
});

/**
 * POST /health/reset-rate-limiter
 * Reset rate limiter store (for testing)
 */
router.post('/reset-rate-limiter', (_req: Request, res: Response) => {
  clearRateLimiterStore();
  logger.info('Rate limiter store cleared');
  res.json({
    success: true,
    message: 'Rate limiter store cleared',
  });
});

export default router;
