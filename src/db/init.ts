import { getPool } from './connection';
import { Migrator } from './migrator';
import { Seeder } from './seeder';
import { Logger } from '../utils/logger';
import * as migration001 from './migrations/001_create_users_table';
import * as migration002 from './migrations/002_create_tickets_table';
import * as migration003 from './migrations/003_create_orders_table';
import * as migration004 from './migrations/004_create_token_blacklist_table';

const logger = new Logger('DatabaseInit');

/**
 * Initialize database schema using migrations
 */
export async function initializeSchema(): Promise<void> {
  const pool = getPool();

  try {
    const migrator = new Migrator(pool);

    // Register all migrations
    migrator.registerMigration('001_create_users_table', migration001);
    migrator.registerMigration('002_create_tickets_table', migration002);
    migrator.registerMigration('003_create_orders_table', migration003);
    migrator.registerMigration('004_create_token_blacklist_table', migration004);

    // Run all pending migrations
    await migrator.runMigrations();

    logger.info('Database schema initialization completed successfully');
  } catch (error) {
    logger.error('Failed to initialize database schema', error);
    throw error;
  }
}

/**
 * Seed database with initial data
 */
export async function seedDatabase(): Promise<void> {
  const pool = getPool();

  try {
    const seeder = new Seeder(pool);
    await seeder.run();
  } catch (error) {
    logger.error('Failed to seed database', error);
    throw error;
  }
}

/**
 * Get migrator instance for manual migration management
 */
export function getMigrator(): Migrator {
  const pool = getPool();
  return new Migrator(pool);
}
