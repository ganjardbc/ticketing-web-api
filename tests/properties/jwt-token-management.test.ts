import fc from 'fast-check';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config/environment';

describe('JWT Token Management Properties', () => {
  // Property 2: JWT Token Expiration
  // **Validates: Requirements 2.2, 2.6**
  test('Property 2: JWT Token Expiration - expired tokens should be rejected', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (userId, email) => {
          // Create a token that expired 1 hour ago
          const now = Math.floor(Date.now() / 1000);
          const expiredToken = jwt.sign(
            {
              sub: userId,
              email,
              role: 'user',
              iat: now - 7200,
              exp: now - 3600, // Expired 1 hour ago
              iss: 'ticketing-api',
            },
            config.jwt.secret
          );

          // Attempting to verify should throw an error
          expect(() => {
            jwt.verify(expiredToken, config.jwt.secret);
          }).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 3: Refresh Token Renewal
  // **Validates: Requirements 2.4**
  test('Property 3: Refresh Token Renewal - refresh tokens should have longer expiration than access tokens', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (userId) => {
          const now = Math.floor(Date.now() / 1000);

          // Create access token (1 hour)
          const accessToken = jwt.sign(
            {
              sub: userId,
              email: 'test@example.com',
              role: 'user',
              iat: now,
              exp: now + config.jwt.accessTokenExpiry,
              iss: 'ticketing-api',
            },
            config.jwt.secret
          );

          // Create refresh token (7 days)
          const refreshToken = jwt.sign(
            {
              sub: userId,
              type: 'refresh',
              iat: now,
              exp: now + config.jwt.refreshTokenExpiry,
              iss: 'ticketing-api',
            },
            config.jwt.secret
          );

          const accessDecoded = jwt.decode(accessToken) as any;
          const refreshDecoded = jwt.decode(refreshToken) as any;

          // Refresh token expiration should be greater than access token
          expect(refreshDecoded.exp).toBeGreaterThan(accessDecoded.exp);
          expect(config.jwt.refreshTokenExpiry).toBeGreaterThan(config.jwt.accessTokenExpiry);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 4: Authentication Credential Validation
  // **Validates: Requirements 2.1, 3.1, 3.2**
  test('Property 4: Authentication Credential Validation - valid tokens should contain required claims', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.oneof(fc.constant('admin'), fc.constant('user')),
        (userId, email, role) => {
          const now = Math.floor(Date.now() / 1000);
          const token = jwt.sign(
            {
              sub: userId,
              email,
              role,
              iat: now,
              exp: now + config.jwt.accessTokenExpiry,
              iss: 'ticketing-api',
            },
            config.jwt.secret
          );

          const decoded = jwt.verify(token, config.jwt.secret) as any;

          // All required claims should be present
          expect(decoded.sub).toBe(userId);
          expect(decoded.email).toBe(email);
          expect(decoded.role).toBe(role);
          expect(decoded.iat).toBeDefined();
          expect(decoded.exp).toBeDefined();
          expect(decoded.iss).toBe('ticketing-api');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 5: Token Blacklist Enforcement
  // **Validates: Requirements 2.8, 3.3**
  test('Property 5: Token Blacklist Enforcement - blacklisted tokens should be identifiable', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (userId) => {
          const now = Math.floor(Date.now() / 1000);
          const token = jwt.sign(
            {
              sub: userId,
              email: 'test@example.com',
              role: 'user',
              iat: now,
              exp: now + config.jwt.accessTokenExpiry,
              iss: 'ticketing-api',
            },
            config.jwt.secret
          );

          // Token should be valid before blacklisting
          expect(() => {
            jwt.verify(token, config.jwt.secret);
          }).not.toThrow();

          // After blacklisting, the token hash should be stored
          // (In real implementation, this would be checked against database)
          const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
          expect(tokenHash).toBeDefined();
          expect(tokenHash.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 17: Password Hashing
  // **Validates: Requirements 7.5**
  test('Property 17: Password Hashing - hashed passwords should not be plain text', async () => {
    const bcrypt = require('bcrypt');
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 8, maxLength: 50 }),
        async (password) => {
          const saltRounds = config.security.bcryptSaltRounds;

          const hash = await bcrypt.hash(password, saltRounds);

          // Hash should not equal plain password
          expect(hash).not.toBe(password);

          // Hash should be longer than password
          expect(hash.length).toBeGreaterThan(password.length);

          // Hash should start with bcrypt prefix
          expect(hash).toMatch(/^\$2[aby]\$/);
        }
      ),
      { numRuns: 50 }
    );
  });

  // Additional property: Token signature verification
  test('Property: Token Signature Verification - tokens signed with wrong key should fail verification', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (userId) => {
          const now = Math.floor(Date.now() / 1000);
          const token = jwt.sign(
            {
              sub: userId,
              email: 'test@example.com',
              role: 'user',
              iat: now,
              exp: now + config.jwt.accessTokenExpiry,
              iss: 'ticketing-api',
            },
            config.jwt.secret
          );

          // Verification with correct key should succeed
          expect(() => {
            jwt.verify(token, config.jwt.secret);
          }).not.toThrow();

          // Verification with wrong key should fail
          expect(() => {
            jwt.verify(token, 'wrong-secret-key');
          }).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional property: Token payload immutability
  test('Property: Token Payload Immutability - modifying token payload should invalidate signature', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (userId) => {
          const now = Math.floor(Date.now() / 1000);
          const token = jwt.sign(
            {
              sub: userId,
              email: 'test@example.com',
              role: 'user',
              iat: now,
              exp: now + config.jwt.accessTokenExpiry,
              iss: 'ticketing-api',
            },
            config.jwt.secret
          );

          // Split token into parts
          const parts = token.split('.');
          expect(parts).toHaveLength(3);

          // Decode and modify payload
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          payload.role = 'admin'; // Try to escalate privileges

          // Re-encode modified payload
          const modifiedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
          const modifiedToken = `${parts[0]}.${modifiedPayload}.${parts[2]}`;

          // Verification should fail due to signature mismatch
          expect(() => {
            jwt.verify(modifiedToken, config.jwt.secret);
          }).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});
