import { config } from '../src/config/environment';
import { clearRateLimiterStore } from '../src/middleware/rateLimiter';

/**
 * Test setup and utilities
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = '';
process.env.DB_NAME = 'db_ticketing';
process.env.JWT_SECRET = 'test-secret-key';

// Clear rate limiter store before each test suite
beforeEach(() => {
  clearRateLimiterStore();
});

export { config };
