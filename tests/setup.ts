import { config } from '../src/config/environment';

/**
 * Test setup and utilities
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'password';
process.env.DB_NAME = 'ticketing_api_test';
process.env.JWT_SECRET = 'test-secret-key';

export { config };
