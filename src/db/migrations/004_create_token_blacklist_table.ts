import { Pool } from 'mysql2/promise';
import { Logger } from '../../utils/logger';

const logger = new Logger('Migration');

/**
 * Migration: Create token_blacklist table
 * Version: 004
 */
export async function up(pool: Pool): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS token_blacklist (
        id VARCHAR(36) PRIMARY KEY,
        token_hash VARCHAR(255) UNIQUE NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_expires_at (expires_at)
      )
    `);
    logger.info('Migration 004: Token blacklist table created');
  } catch (error) {
    logger.error('Migration 004 failed', error);
    throw error;
  }
}

/**
 * Rollback: Drop token_blacklist table
 */
export async function down(pool: Pool): Promise<void> {
  try {
    await pool.query('DROP TABLE IF EXISTS token_blacklist');
    logger.info('Migration 004 rolled back: Token blacklist table dropped');
  } catch (error) {
    logger.error('Migration 004 rollback failed', error);
    throw error;
  }
}
