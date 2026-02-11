import { Pool, RowDataPacket } from 'mysql2/promise';
import { Logger } from '../utils/logger';

const logger = new Logger('Migrator');

/**
 * Migration interface
 */
export interface Migration {
  up(pool: Pool): Promise<void>;
  down(pool: Pool): Promise<void>;
}

/**
 * Migration record in database
 */
interface MigrationRecord extends RowDataPacket {
  id: number;
  name: string;
  executed_at: Date;
}

/**
 * Migrator class for managing database migrations
 */
export class Migrator {
  private pool: Pool;
  private migrations: Map<string, Migration> = new Map();

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Register a migration
   */
  registerMigration(name: string, migration: Migration): void {
    this.migrations.set(name, migration);
  }

  /**
   * Initialize migrations table
   */
  private async initializeMigrationsTable(): Promise<void> {
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      logger.info('Migrations table initialized');
    } catch (error) {
      logger.error('Failed to initialize migrations table', error);
      throw error;
    }
  }

  /**
   * Get executed migrations
   */
  private async getExecutedMigrations(): Promise<Set<string>> {
    try {
      const [rows] = await this.pool.query<MigrationRecord[]>(
        'SELECT name FROM migrations ORDER BY id'
      );
      return new Set(rows.map(row => row.name));
    } catch (error) {
      logger.error('Failed to get executed migrations', error);
      throw error;
    }
  }

  /**
   * Record migration execution
   */
  private async recordMigration(name: string): Promise<void> {
    try {
      await this.pool.query(
        'INSERT INTO migrations (name) VALUES (?)',
        [name]
      );
    } catch (error) {
      logger.error(`Failed to record migration ${name}`, error);
      throw error;
    }
  }

  /**
   * Remove migration record
   */
  private async removeMigrationRecord(name: string): Promise<void> {
    try {
      await this.pool.query(
        'DELETE FROM migrations WHERE name = ?',
        [name]
      );
    } catch (error) {
      logger.error(`Failed to remove migration record ${name}`, error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    try {
      await this.initializeMigrationsTable();
      const executed = await this.getExecutedMigrations();

      const sortedMigrations = Array.from(this.migrations.entries()).sort(
        ([nameA], [nameB]) => nameA.localeCompare(nameB)
      );

      for (const [name, migration] of sortedMigrations) {
        if (!executed.has(name)) {
          logger.info(`Running migration: ${name}`);
          await migration.up(this.pool);
          await this.recordMigration(name);
          logger.info(`Migration completed: ${name}`);
        }
      }

      logger.info('All migrations completed successfully');
    } catch (error) {
      logger.error('Migration failed', error);
      throw error;
    }
  }

  /**
   * Rollback last migration
   */
  async rollbackLast(): Promise<void> {
    try {
      const executed = await this.getExecutedMigrations();

      if (executed.size === 0) {
        logger.info('No migrations to rollback');
        return;
      }

      const sortedMigrations = Array.from(this.migrations.entries()).sort(
        ([nameA], [nameB]) => nameB.localeCompare(nameA)
      );

      for (const [name, migration] of sortedMigrations) {
        if (executed.has(name)) {
          logger.info(`Rolling back migration: ${name}`);
          await migration.down(this.pool);
          await this.removeMigrationRecord(name);
          logger.info(`Migration rolled back: ${name}`);
          return;
        }
      }
    } catch (error) {
      logger.error('Rollback failed', error);
      throw error;
    }
  }

  /**
   * Rollback all migrations
   */
  async rollbackAll(): Promise<void> {
    try {
      const executed = await this.getExecutedMigrations();

      if (executed.size === 0) {
        logger.info('No migrations to rollback');
        return;
      }

      const sortedMigrations = Array.from(this.migrations.entries()).sort(
        ([nameA], [nameB]) => nameB.localeCompare(nameA)
      );

      for (const [name, migration] of sortedMigrations) {
        if (executed.has(name)) {
          logger.info(`Rolling back migration: ${name}`);
          await migration.down(this.pool);
          await this.removeMigrationRecord(name);
          logger.info(`Migration rolled back: ${name}`);
        }
      }

      logger.info('All migrations rolled back successfully');
    } catch (error) {
      logger.error('Rollback all failed', error);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<{ name: string; executed: boolean }[]> {
    try {
      const executed = await this.getExecutedMigrations();
      const sortedMigrations = Array.from(this.migrations.keys()).sort();

      return sortedMigrations.map(name => ({
        name,
        executed: executed.has(name),
      }));
    } catch (error) {
      logger.error('Failed to get migration status', error);
      throw error;
    }
  }
}
