import { getConnection } from '../db/connection';
import { Logger } from '../utils/logger';

const logger = new Logger('UserRepository');

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * User Repository
 * Handles database operations for users
 */
export class UserRepository {
  /**
   * Find user by ID
   */
  async findById(id: string): Promise<UserRecord | null> {
    try {
      const connection = await getConnection();
      const [rows] = await connection.query(
        'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL',
        [id]
      );
      connection.release();

      const users = rows as UserRecord[];
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      logger.error('Failed to find user by ID', error);
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserRecord | null> {
    try {
      const connection = await getConnection();
      const [rows] = await connection.query(
        'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
        [email]
      );
      connection.release();

      const users = rows as UserRecord[];
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      logger.error('Failed to find user by email', error);
      throw error;
    }
  }

  /**
   * Get all users
   */
  async findAll(): Promise<UserRecord[]> {
    try {
      const connection = await getConnection();
      const [rows] = await connection.query(
        'SELECT * FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC'
      );
      connection.release();

      return rows as UserRecord[];
    } catch (error) {
      logger.error('Failed to get all users', error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  async create(user: Omit<UserRecord, 'created_at' | 'updated_at' | 'deleted_at'>): Promise<UserRecord> {
    try {
      const connection = await getConnection();
      const now = new Date().toISOString();

      await connection.query(
        'INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user.id, user.email, user.password_hash, user.name, user.role, now, now]
      );

      connection.release();

      const createdUser = await this.findById(user.id);
      if (!createdUser) {
        throw new Error('Failed to retrieve created user');
      }

      return createdUser;
    } catch (error) {
      logger.error('Failed to create user', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async update(id: string, updates: Partial<UserRecord>): Promise<UserRecord> {
    try {
      const connection = await getConnection();
      const now = new Date().toISOString();

      const updateFields = Object.keys(updates)
        .filter((key) => key !== 'id' && key !== 'created_at' && key !== 'deleted_at')
        .map((key) => `${key} = ?`)
        .join(', ');

      const updateValues = Object.keys(updates)
        .filter((key) => key !== 'id' && key !== 'created_at' && key !== 'deleted_at')
        .map((key) => updates[key as keyof UserRecord]);

      await connection.query(
        `UPDATE users SET ${updateFields}, updated_at = ? WHERE id = ?`,
        [...updateValues, now, id]
      );

      connection.release();

      const updatedUser = await this.findById(id);
      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user');
      }

      return updatedUser;
    } catch (error) {
      logger.error('Failed to update user', error);
      throw error;
    }
  }

  /**
   * Soft delete user
   */
  async delete(id: string): Promise<void> {
    try {
      const connection = await getConnection();
      const now = new Date().toISOString();

      await connection.query(
        'UPDATE users SET deleted_at = ?, updated_at = ? WHERE id = ?',
        [now, now, id]
      );

      connection.release();
      logger.info(`User ${id} soft deleted`);
    } catch (error) {
      logger.error('Failed to delete user', error);
      throw error;
    }
  }
}
