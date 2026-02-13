import mysql from 'mysql2/promise';
import { Pool, PoolConnection } from 'mysql2/promise';
import { config } from '../config/environment';
import { Logger } from '../utils/logger';

const logger = new Logger('Database');

let pool: Pool | null = null;

/**
 * Initialize MySQL connection pool
 */
export async function initializePool(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  try {
    pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      waitForConnections: config.database.waitForConnections,
      connectionLimit: config.database.connectionLimit,
      queueLimit: config.database.queueLimit,
    });

    logger.info('MySQL connection pool initialized');
    return pool;
  } catch (error) {
    logger.error('Failed to initialize connection pool', error);
    throw error;
  }
}

/**
 * Get connection from pool
 */
export async function getConnection(): Promise<PoolConnection> {
  if (!pool) {
    throw new Error('Connection pool not initialized');
  }

  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    logger.error('Failed to get connection from pool', error);
    throw error;
  }
}

/**
 * Get the pool instance
 */
export function getPool(): Pool {
  if (!pool) {
    throw new Error('Connection pool not initialized');
  }
  return pool;
}

/**
 * Close the connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    try {
      await pool.end();
      pool = null;
      logger.info('Connection pool closed');
    } catch (error) {
      logger.error('Failed to close connection pool', error);
      throw error;
    }
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await getConnection();
    await connection.ping();
    connection.release();
    logger.info('Database connection test successful');
    return true;
  } catch (error) {
    logger.error('Database connection test failed', error);
    return false;
  }
}
