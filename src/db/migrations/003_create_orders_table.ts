import { Pool } from 'mysql2/promise';
import { Logger } from '../../utils/logger';

const logger = new Logger('Migration');

/**
 * Migration: Create orders table
 * Version: 003
 */
export async function up(pool: Pool): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(36) PRIMARY KEY,
        order_code VARCHAR(50) UNIQUE NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        ticket_id VARCHAR(36) NOT NULL,
        visitor_name VARCHAR(255) NOT NULL,
        visit_date DATETIME NOT NULL,
        qty INT NOT NULL,
        type ENUM('regular', 'vip', 'group') DEFAULT 'regular',
        payment_type ENUM('cash', 'non-cash') DEFAULT 'cash',
        total_amount DECIMAL(12, 2) NOT NULL,
        status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id),
        INDEX idx_user_id (user_id),
        INDEX idx_ticket_id (ticket_id),
        INDEX idx_status (status),
        INDEX idx_order_code (order_code)
      )
    `);
    logger.info('Migration 003: Orders table created');
  } catch (error) {
    logger.error('Migration 003 failed', error);
    throw error;
  }
}

/**
 * Rollback: Drop orders table
 */
export async function down(pool: Pool): Promise<void> {
  try {
    await pool.query('DROP TABLE IF EXISTS orders');
    logger.info('Migration 003 rolled back: Orders table dropped');
  } catch (error) {
    logger.error('Migration 003 rollback failed', error);
    throw error;
  }
}
