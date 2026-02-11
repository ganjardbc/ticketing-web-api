import express, { Express, Request, Response } from 'express';
import { config, validateConfig } from './config/environment';
import { initializePool, testConnection, closePool } from './db/connection';
import { initializeSchema, seedDatabase } from './db/init';
import { Logger } from './utils/logger';
import { createAuthRoutes } from './routes/auth';
import { UserRepository } from './repositories/UserRepository';
import { TokenBlacklistRepository } from './repositories/TokenBlacklistRepository';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { corsMiddleware } from './middleware/cors';
import { securityHeaders } from './middleware/securityHeaders';
import { rateLimiter } from './middleware/rateLimiter';
import ticketRoutes from './routes/tickets';
import orderRoutes from './routes/orders';
import analyticsRoutes from './routes/analytics';
import reportsRoutes from './routes/reports';
import healthRoutes from './routes/health';

const logger = new Logger('Server');

/**
 * Create and configure Express application
 */
function createApp(): Express {
  const app = express();

  // Initialize repositories
  const userRepository = new UserRepository();
  const tokenBlacklistRepository = new TokenBlacklistRepository();

  // Middleware Stack (in correct order)
  // 1. Security Headers - Add security headers to all responses
  app.use(securityHeaders);

  // 2. CORS - Handle cross-origin requests
  app.use(corsMiddleware(config.cors.origins));

  // 3. Body Parser - Parse JSON request bodies
  app.use(express.json());

  // 4. Rate Limiter - Limit requests per IP
  app.use(rateLimiter(config.rateLimit.windowMs, config.rateLimit.maxRequests));

  // 5. Request Logger - Log all requests
  app.use(requestLogger);

  // Routes
  app.use('/auth', createAuthRoutes(userRepository, tokenBlacklistRepository));
  app.use('/tickets', ticketRoutes);
  app.use('/orders', orderRoutes);
  app.use('/analytics', analyticsRoutes);
  app.use('/reports', reportsRoutes);
  app.use('/health', healthRoutes);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      data: null,
      message: 'Endpoint not found',
    });
  });

  // Error handler middleware (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();
    logger.info('Configuration validated');

    // Initialize database connection pool
    await initializePool();
    logger.info('Database connection pool initialized');

    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }
    logger.info('Database connection test passed');

    // Initialize database schema
    await initializeSchema();
    logger.info('Database schema initialized');

    // Seed database with initial data
    await seedDatabase();
    logger.info('Database seeding completed');

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`Server running on http://localhost:${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(async () => {
        await closePool();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(async () => {
        await closePool();
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Start the server
startServer();
