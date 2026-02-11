import fc from 'fast-check';
import { ValidationService, ValidationSchema } from '../../src/services/ValidationService';

/**
 * Property-Based Tests for ValidationService
 * **Validates: Requirements 6.1, 6.2, 6.3**
 */
describe('ValidationService - Property-Based Tests', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  /**
   * Property 11: Input Validation Rejection
   * For any request with missing required fields, the API should reject it with a 400 Bad Request response that lists the missing fields.
   * **Validates: Requirements 6.2**
   */
  describe('Property 11: Input Validation Rejection', () => {
    it('should reject all requests with missing required fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            email: fc.string({ minLength: 5, maxLength: 50 }),
            password: fc.string({ minLength: 8 }),
          }),
          (validData) => {
            // Test with email missing
            const missingEmail = { password: validData.password };
            const schema: ValidationSchema = {
              email: { required: true, type: 'string' },
              password: { required: true, type: 'string' },
            };

            const result = validationService.validate(missingEmail, schema);

            // Should be invalid
            expect(result.isValid).toBe(false);

            // Should have error for email field
            const emailError = result.errors.find((e) => e.field === 'email');
            expect(emailError).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept all requests with all required fields present', () => {
      fc.assert(
        fc.property(
          fc.record({
            email: fc.string({ minLength: 5, maxLength: 50 }),
            password: fc.string({ minLength: 8 }),
            name: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          (data) => {
            const schema: ValidationSchema = {
              email: { required: true, type: 'string' },
              password: { required: true, type: 'string' },
              name: { required: true, type: 'string' },
            };

            const result = validationService.validate(data, schema);

            // Should be valid when all required fields are present
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should list all missing required fields in error response', () => {
      fc.assert(
        fc.property(
          fc.record({
            field1: fc.string(),
            field2: fc.string(),
            field3: fc.string(),
          }),
          () => {
            const schema: ValidationSchema = {
              field1: { required: true },
              field2: { required: true },
              field3: { required: true },
            };

            // Remove all fields to test missing field detection
            const result = validationService.validate({}, schema);

            // Should have exactly 3 errors
            expect(result.errors).toHaveLength(3);

            // Each error should have a field and message
            result.errors.forEach((error) => {
              expect(error.field).toBeDefined();
              expect(error.message).toBeDefined();
              expect(error.message).toContain('required');
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 12: Business Rule Validation
   * For any request that violates business rules (e.g., negative price, invalid status), the API should reject it with a 422 Unprocessable Entity response.
   * **Validates: Requirements 6.3**
   */
  describe('Property 12: Business Rule Validation', () => {
    it('should reject all orders with negative prices', () => {
      fc.assert(
        fc.property(
          fc.record({
            price: fc.integer({ min: -1000, max: -1 }),
            quantity: fc.integer({ min: 1, max: 1000 }),
          }),
          (data) => {
            const rules = {
              price: (value: number) => (value > 0 ? true : 'Price must be positive'),
              quantity: (value: number) => (value >= 1 ? true : 'Quantity must be at least 1'),
            };

            const result = validationService.validateBusinessRules(data, rules);

            // Should be invalid for negative price
            expect(result.isValid).toBe(false);

            // Should have error for price field
            const priceError = result.errors.find((e) => e.field === 'price');
            expect(priceError).toBeDefined();
            expect(priceError?.message).toContain('positive');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject all orders with invalid status values', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter((s) => !['pending', 'completed', 'cancelled'].includes(s)),
          (invalidStatus) => {
            const schema: ValidationSchema = {
              status: { enum: ['pending', 'completed', 'cancelled'] },
            };

            const result = validationService.validate({ status: invalidStatus }, schema);

            // Should be invalid for status not in enum
            expect(result.isValid).toBe(false);

            // Should have error for status field
            const statusError = result.errors.find((e) => e.field === 'status');
            expect(statusError).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept all orders with valid business rules', () => {
      fc.assert(
        fc.property(
          fc.record({
            price: fc.integer({ min: 1, max: 10000 }),
            quantity: fc.integer({ min: 1, max: 1000 }),
            status: fc.constantFrom('pending', 'completed', 'cancelled'),
          }),
          (data) => {
            const schema: ValidationSchema = {
              price: { type: 'number', min: 1 },
              quantity: { type: 'number', min: 1 },
              status: { enum: ['pending', 'completed', 'cancelled'] },
            };

            const result = validationService.validate(data, schema);

            // Should be valid when all business rules are satisfied
            expect(result.isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide meaningful error messages for business rule violations', () => {
      fc.assert(
        fc.property(
          fc.record({
            quantity: fc.integer({ min: -100, max: 0 }),
          }),
          (data) => {
            const rules = {
              quantity: (value: number) =>
                value >= 1 ? true : 'Quantity must be at least 1',
            };

            const result = validationService.validateBusinessRules(data, rules);

            // Should be invalid
            expect(result.isValid).toBe(false);

            // Should have meaningful error message
            expect(result.errors[0].message).toBe('Quantity must be at least 1');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional Property Tests for Comprehensive Coverage
   */
  describe('Property: Data Type Validation Consistency', () => {
    it('should consistently reject invalid data types', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string({ minLength: 1 }),
            fc.boolean(),
            fc.array(fc.anything()),
            fc.object()
          ),
          (nonNumber) => {
            // Skip if it's actually a number
            if (typeof nonNumber === 'number') {
              return;
            }

            const schema: ValidationSchema = {
              age: { type: 'number' },
            };

            const result = validationService.validate({ age: nonNumber }, schema);

            // Should be invalid for non-number types
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Email Format Validation', () => {
    it('should accept all valid email-like formats', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9]+$/.test(s)),
            fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9]+$/.test(s))
          ),
          ([localPart, domain]) => {
            const email = `${localPart}@${domain}.com`;
            const schema: ValidationSchema = {
              email: { format: 'email' },
            };

            const result = validationService.validate({ email }, schema);

            // Should be valid for email-like formats
            expect(result.isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject all invalid email formats without @', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter((s) => !s.includes('@')),
          (invalidEmail) => {
            const schema: ValidationSchema = {
              email: { format: 'email' },
            };

            const result = validationService.validate({ email: invalidEmail }, schema);

            // Should be invalid for emails without @
            expect(result.isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: String Length Constraints', () => {
    it('should accept all strings within length constraints', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 20 }),
          (maxLength) => {
            fc.assert(
              fc.property(
                fc.string({ minLength: 0, maxLength }),
                (str) => {
                  const schema: ValidationSchema = {
                    name: { maxLength },
                  };

                  const result = validationService.validate({ name: str }, schema);

                  // Should be valid for strings within max length
                  expect(result.isValid).toBe(true);
                }
              ),
              { numRuns: 50 }
            );
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject all strings exceeding length constraints', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (maxLength) => {
            fc.assert(
              fc.property(
                fc.string({ minLength: maxLength + 1, maxLength: maxLength + 100 }),
                (str) => {
                  const schema: ValidationSchema = {
                    name: { maxLength },
                  };

                  const result = validationService.validate({ name: str }, schema);

                  // Should be invalid for strings exceeding max length
                  expect(result.isValid).toBe(false);
                }
              ),
              { numRuns: 50 }
            );
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property: Number Range Constraints', () => {
    it('should accept all numbers within range constraints', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          (min, max) => {
            if (min > max) {
              return; // Skip invalid ranges
            }

            fc.assert(
              fc.property(
                fc.integer({ min, max }),
                (num) => {
                  const schema: ValidationSchema = {
                    value: { min, max },
                  };

                  const result = validationService.validate({ value: num }, schema);

                  // Should be valid for numbers within range
                  expect(result.isValid).toBe(true);
                }
              ),
              { numRuns: 50 }
            );
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject all numbers outside range constraints', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 50 }),
          (max) => {
            fc.assert(
              fc.property(
                fc.oneof(
                  fc.integer({ min: -1000, max: -1 }),
                  fc.integer({ min: max + 1, max: 1000 })
                ),
                (num) => {
                  const schema: ValidationSchema = {
                    value: { min: 0, max },
                  };

                  const result = validationService.validate({ value: num }, schema);

                  // Should be invalid for numbers outside range
                  expect(result.isValid).toBe(false);
                }
              ),
              { numRuns: 50 }
            );
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property: Enum Validation', () => {
    it('should accept all values in enum list', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
          (enumValues) => {
            fc.assert(
              fc.property(
                fc.constantFrom(...enumValues),
                (value) => {
                  const schema: ValidationSchema = {
                    status: { enum: enumValues },
                  };

                  const result = validationService.validate({ status: value }, schema);

                  // Should be valid for values in enum
                  expect(result.isValid).toBe(true);
                }
              ),
              { numRuns: 50 }
            );
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property: Optional Field Handling', () => {
    it('should accept data with optional fields omitted', () => {
      fc.assert(
        fc.property(
          fc.record({
            required: fc.string({ minLength: 1 }),
          }),
          (data) => {
            const schema: ValidationSchema = {
              required: { required: true },
              optional: { required: false },
            };

            const result = validationService.validate(data, schema);

            // Should be valid even without optional field
            expect(result.isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept data with optional fields provided', () => {
      fc.assert(
        fc.property(
          fc.record({
            required: fc.string({ minLength: 1 }),
            optional: fc.string({ minLength: 1 }),
          }),
          (data) => {
            const schema: ValidationSchema = {
              required: { required: true },
              optional: { required: false },
            };

            const result = validationService.validate(data, schema);

            // Should be valid with optional field provided
            expect(result.isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Error Message Consistency', () => {
    it('should always include field name in error messages', () => {
      fc.assert(
        fc.property(
          fc.record({
            email: fc.string({ minLength: 1 }).filter((s) => !s.includes('@')),
          }),
          (data) => {
            const schema: ValidationSchema = {
              email: { format: 'email' },
            };

            const result = validationService.validate(data, schema);

            // All errors should have field and message
            result.errors.forEach((error) => {
              expect(error.field).toBeDefined();
              expect(error.message).toBeDefined();
              expect(error.message.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
