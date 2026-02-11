import { Router, Request, Response } from 'express';
import { getConnection } from '../db/connection';
import { Logger } from '../utils/logger';

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

export default router;
