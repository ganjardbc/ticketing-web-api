import { getConnection } from '../db/connection';
import { Logger } from '../utils/logger';

const logger = new Logger('TokenBlacklistRepository');

export interface TokenBlacklistRecord {
  id: string;
  token_hash: string;
  user_id: string;
  expires_at: Date;
  created_at?: string;
}

/**
 * Token Blacklist Repository
 * Handles database operations for token blacklist
 */
export class TokenBlacklistRepository {
  /**
   * Create blacklist entry
   */
  async create(entry: TokenBlacklistRecord): Promise<TokenBlacklistRecord> {
    let connection;
    try {
      connection = await getConnection();
      const now = new Date();
      
      // Format dates for MySQL DATETIME column (YYYY-MM-DD HH:MM:SS)
      const createdAtFormatted = now.toISOString().slice(0, 19).replace('T', ' ');
      const expiresAtFormatted = entry.expires_at instanceof Date 
        ? entry.expires_at.toISOString().slice(0, 19).replace('T', ' ')
        : entry.expires_at;

      await connection.query(
        'INSERT INTO token_blacklist (id, token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
        [entry.id, entry.token_hash, entry.user_id, expiresAtFormatted, createdAtFormatted]
      );

      logger.info(`Token blacklisted for user: ${entry.user_id}`);

      return entry;
    } catch (error) {
      logger.error('Failed to create blacklist entry', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * Find blacklist entry by token hash
   */
  async findByTokenHash(tokenHash: string): Promise<TokenBlacklistRecord | null> {
    let connection;
    try {
      connection = await getConnection();
      const [rows] = await connection.query(
        'SELECT * FROM token_blacklist WHERE token_hash = ?',
        [tokenHash]
      );

      const entries = rows as TokenBlacklistRecord[];
      return entries.length > 0 ? entries[0] : null;
    } catch (error) {
      logger.error('Failed to find blacklist entry', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * Find all blacklist entries for a user
   */
  async findByUserId(userId: string): Promise<TokenBlacklistRecord[]> {
    let connection;
    try {
      connection = await getConnection();
      const [rows] = await connection.query(
        'SELECT * FROM token_blacklist WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );

      return rows as TokenBlacklistRecord[];
    } catch (error) {
      logger.error('Failed to find blacklist entries for user', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * Delete expired blacklist entries
   */
  async deleteExpired(): Promise<number> {
    let connection;
    try {
      connection = await getConnection();
      const now = new Date();

      const [result] = await connection.query(
        'DELETE FROM token_blacklist WHERE expires_at < ?',
        [now]
      );

      const deleteResult = result as any;
      const deletedCount = deleteResult.affectedRows || 0;
      logger.info(`Deleted ${deletedCount} expired blacklist entries`);

      return deletedCount;
    } catch (error) {
      logger.error('Failed to delete expired blacklist entries', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isBlacklisted(tokenHash: string): Promise<boolean> {
    try {
      const entry = await this.findByTokenHash(tokenHash);
      return entry !== null;
    } catch (error) {
      logger.error('Failed to check if token is blacklisted', error);
      throw error;
    }
  }
}
