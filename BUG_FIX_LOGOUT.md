# Bug Fix: Logout Endpoint 500 Error - Complete Solution

## Issue
The `/auth/logout` endpoint was returning a 500 Internal Server Error.

## Root Cause
The issue had **two parts**:

### Part 1: Connection Pool Management (Initial Fix)
Database connections were being released **before** queries completed in all repository files, causing queries to fail.

### Part 2: DateTime Format Mismatch (Final Fix - The Real Issue)
The `TokenBlacklistRepository.create()` method was passing ISO 8601 formatted datetime strings (e.g., `'2026-02-11T17:39:07.993Z'`) to MySQL's `DATETIME` column, which expects the format `'YYYY-MM-DD HH:MM:SS'`.

**Error Message:**
```
Incorrect datetime value: '2026-02-11T17:39:07.993Z' for column 'created_at' at row 1
```

## Solution

### Step 1: Fixed Connection Pool Management
Updated all repository methods to use `finally` blocks to ensure connections are released **after** queries complete:

```typescript
// CORRECT - Connection released after query completes
async create(entry: TokenBlacklistRecord): Promise<TokenBlacklistRecord> {
  let connection;
  try {
    connection = await getConnection();
    // ... query code ...
  } catch (error) {
    throw error;
  } finally {
    if (connection) {
      connection.release();  // Released after query completes
    }
  }
}
```

### Step 2: Fixed DateTime Format
Converted ISO 8601 datetime strings to MySQL `DATETIME` format before inserting:

```typescript
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
    // ...
  }
}
```

## Files Modified
1. `src/repositories/TokenBlacklistRepository.ts` - Fixed datetime format and connection management
2. `src/repositories/OrderRepository.ts` - Fixed connection management
3. `src/repositories/TicketRepository.ts` - Fixed connection management

## Testing the Fix

### Test the logout endpoint
```bash
# 1. Start the API server
npm run dev

# 2. In another terminal, login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ticketing.com","password":"admin123"}'

# 3. Copy the accessToken from response

# 4. Logout with the token
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer <YOUR_TOKEN_HERE>"

# Expected response:
# {
#   "success": true,
#   "data": null,
#   "message": "Logout successful"
# }
```

### Verify token is blacklisted
```bash
# Try to use the token after logout - should fail
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer <YOUR_TOKEN_HERE>"

# Expected response:
# {
#   "success": false,
#   "data": null,
#   "message": "Token has been revoked"
# }
```

## Key Learnings

1. **DateTime Format Matters**: MySQL `DATETIME` columns require `'YYYY-MM-DD HH:MM:SS'` format, not ISO 8601 strings
2. **Connection Pool Management**: Always use `finally` blocks to ensure connections are released after queries complete
3. **Server Restart Required**: Changes to TypeScript files require server restart for ts-node to recompile

## Verification
All tests should now pass:
```bash
npm test
```

Expected output:
```
✓ POST /auth/logout - should logout successfully
✓ GET /auth/me - should fail with revoked token
[... all other tests passing ...]
```

## Related Code
- `src/repositories/TokenBlacklistRepository.ts` - Fixed file
- `src/repositories/OrderRepository.ts` - Fixed file
- `src/repositories/TicketRepository.ts` - Fixed file
- `src/services/AuthService.ts` - Uses TokenBlacklistRepository
- `src/routes/auth.ts` - Logout endpoint
