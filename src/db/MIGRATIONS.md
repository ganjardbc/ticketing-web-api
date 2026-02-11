# Database Migrations

This document describes the database migration system for the Ticketing API.

## Overview

The migration system provides a structured way to manage database schema changes. Each migration is a TypeScript module that implements `up()` and `down()` functions for applying and rolling back changes.

## Migration Files

### 001_create_users_table.ts
Creates the `users` table with the following columns:
- `id` (VARCHAR 36, PRIMARY KEY)
- `email` (VARCHAR 255, UNIQUE)
- `password_hash` (VARCHAR 255)
- `name` (VARCHAR 255)
- `role` (ENUM: 'admin', 'user')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `deleted_at` (TIMESTAMP, nullable)

Indexes:
- `idx_email` on email column
- `idx_role` on role column

### 002_create_tickets_table.ts
Creates the `tickets` table with the following columns:
- `id` (VARCHAR 36, PRIMARY KEY)
- `code` (VARCHAR 50, UNIQUE)
- `price` (DECIMAL 12,2)
- `status` (ENUM: 'visible', 'hidden')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `deleted_at` (TIMESTAMP, nullable)

Indexes:
- `idx_code` on code column
- `idx_status` on status column

### 003_create_orders_table.ts
Creates the `orders` table with the following columns:
- `id` (VARCHAR 36, PRIMARY KEY)
- `order_code` (VARCHAR 50, UNIQUE)
- `user_id` (VARCHAR 36, FOREIGN KEY → users.id)
- `ticket_id` (VARCHAR 36, FOREIGN KEY → tickets.id)
- `visitor_name` (VARCHAR 255)
- `visit_date` (DATETIME)
- `qty` (INT)
- `type` (ENUM: 'regular', 'vip', 'group')
- `payment_type` (ENUM: 'cash', 'non-cash')
- `total_amount` (DECIMAL 12,2)
- `status` (ENUM: 'pending', 'completed', 'cancelled')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `completed_at` (TIMESTAMP, nullable)
- `deleted_at` (TIMESTAMP, nullable)

Indexes:
- `idx_user_id` on user_id column
- `idx_ticket_id` on ticket_id column
- `idx_status` on status column
- `idx_order_code` on order_code column

Foreign Keys:
- `user_id` → `users.id` (ON DELETE CASCADE)
- `ticket_id` → `tickets.id`

### 004_create_token_blacklist_table.ts
Creates the `token_blacklist` table with the following columns:
- `id` (VARCHAR 36, PRIMARY KEY)
- `token_hash` (VARCHAR 255, UNIQUE)
- `user_id` (VARCHAR 36, FOREIGN KEY → users.id)
- `expires_at` (TIMESTAMP)
- `created_at` (TIMESTAMP)

Indexes:
- `idx_expires_at` on expires_at column

Foreign Keys:
- `user_id` → `users.id` (ON DELETE CASCADE)

## Migrator Class

The `Migrator` class manages the execution and tracking of migrations.

### Methods

#### `registerMigration(name: string, migration: Migration): void`
Registers a migration with the migrator.

```typescript
migrator.registerMigration('001_create_users_table', migration001);
```

#### `runMigrations(): Promise<void>`
Runs all pending migrations in order.

```typescript
await migrator.runMigrations();
```

#### `rollbackLast(): Promise<void>`
Rolls back the last executed migration.

```typescript
await migrator.rollbackLast();
```

#### `rollbackAll(): Promise<void>`
Rolls back all executed migrations in reverse order.

```typescript
await migrator.rollbackAll();
```

#### `getStatus(): Promise<{ name: string; executed: boolean }[]>`
Returns the status of all registered migrations.

```typescript
const status = await migrator.getStatus();
// [
//   { name: '001_create_users_table', executed: true },
//   { name: '002_create_tickets_table', executed: true },
//   ...
// ]
```

## Usage

### Initialization

The database schema is automatically initialized when the application starts:

```typescript
import { initializeSchema } from './src/db/init';

await initializeSchema();
```

### Manual Migration Management

```typescript
import { getMigrator } from './src/db/init';

const migrator = getMigrator();

// Get migration status
const status = await migrator.getStatus();
console.log(status);

// Rollback last migration
await migrator.rollbackLast();

// Rollback all migrations
await migrator.rollbackAll();
```

## Migration Tracking

Migrations are tracked in the `migrations` table:

```sql
CREATE TABLE migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Each time a migration is executed, a record is inserted into this table. This prevents migrations from being run multiple times.

## Best Practices

1. **Naming Convention**: Use the format `NNN_description.ts` where NNN is a zero-padded number.
2. **Idempotency**: Use `CREATE TABLE IF NOT EXISTS` to make migrations idempotent.
3. **Rollback Support**: Always implement both `up()` and `down()` functions.
4. **Testing**: Test migrations in isolation before deploying.
5. **Documentation**: Document the purpose and changes of each migration.

## Performance Optimization

All tables include strategic indexes for common query patterns:

- **Users**: Indexed on email (for login) and role (for authorization)
- **Tickets**: Indexed on code (for lookups) and status (for filtering)
- **Orders**: Indexed on user_id, ticket_id, status, and order_code for efficient queries
- **Token Blacklist**: Indexed on expires_at for efficient cleanup of expired tokens

## Constraints

### Unique Constraints
- `users.email` - Ensures no duplicate email addresses
- `tickets.code` - Ensures no duplicate ticket codes
- `orders.order_code` - Ensures no duplicate order codes
- `token_blacklist.token_hash` - Ensures no duplicate token hashes

### Foreign Key Constraints
- `orders.user_id` → `users.id` (CASCADE DELETE)
- `orders.ticket_id` → `tickets.id`
- `token_blacklist.user_id` → `users.id` (CASCADE DELETE)

CASCADE DELETE on user_id ensures that when a user is deleted, all associated orders and blacklisted tokens are automatically deleted.
