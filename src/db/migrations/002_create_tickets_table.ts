import { Pool } from 'mysql2/promise';
import { Logger } from '../../utils/logger';

const logger = new Logger('Migration');

/**
 * Migration: Create tickets table
 * Version: 002
 */
export async function up(pool: Pool): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id VARCHAR(36) PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        price DECIMAL(12, 2) NOT NULL,
        status ENUM('visible', 'hidden') DEFAULT 'visible',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        INDEX idx_code (code),
        INDEX idx_status (status)
      )
    `);
    logger.info('Migration 002: Tickets table created');
  } catch (error) {
    logger.error('Migration 002 failed', error);
    throw error;
  }
}

/**
 * Rollback: Drop tickets table
 */
export async function down(pool: Pool): Promise<void> {
  try {
    await pool.query('DROP TABLE IF EXISTS tickets');
    logger.info('Migration 002 rolled back: Tickets table dropped');
  } catch (error) {
    logger.error('Migration 002 rollback failed', error);
    throw error;
  }
}
