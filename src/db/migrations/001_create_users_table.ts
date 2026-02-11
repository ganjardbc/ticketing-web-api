import { Pool } from 'mysql2/promise';
import { Logger } from '../../utils/logger';

const logger = new Logger('Migration');

/**
 * Migration: Create users table
 * Version: 001
 */
export async function up(pool: Pool): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        INDEX idx_email (email),
        INDEX idx_role (role)
      )
    `);
    logger.info('Migration 001: Users table created');
  } catch (error) {
    logger.error('Migration 001 failed', error);
    throw error;
  }
}

/**
 * Rollback: Drop users table
 */
export async function down(pool: Pool): Promise<void> {
  try {
    await pool.query('DROP TABLE IF EXISTS users');
    logger.info('Migration 001 rolled back: Users table dropped');
  } catch (error) {
    logger.error('Migration 001 rollback failed', error);
    throw error;
  }
}
