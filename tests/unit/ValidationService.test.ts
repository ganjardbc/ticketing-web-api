import { ValidationService, ValidationSchema } from '../../src/services/ValidationService';

describe('ValidationService', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe('Required Field Validation', () => {
    it('should reject data with missing required fields', () => {
      const schema: ValidationSchema = {
        email: { required: true, type: 'string' },
        password: { required: true, type: 'string' },
      };

      const result = validationService.validate({}, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].field).toBe('email');
      expect(result.errors[1].field).toBe('password');
    });

    it('should accept data with all required fields', () => {
      const schema: ValidationSchema = {
        email: { required: true, type: 'string' },
        password: { required: true, type: 'string' },
      };

      const result = validationService.validate(
        { email: 'test@example.com', password: 'password123' },
        schema
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty strings for required fields', () => {
      const schema: ValidationSchema = {
        email: { required: true, type: 'string' },
      };

      const result = validationService.validate({ email: '' }, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should reject null values for required fields', () => {
      const schema: ValidationSchema = {
        email: { required: true, type: 'string' },
      };

      const result = validationService.validate({ email: null }, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should accept optional fields when not provided', () => {
      const schema: ValidationSchema = {
        email: { required: true, type: 'string' },
        phone: { required: false, type: 'string' },
      };

      const result = validationService.validate({ email: 'test@example.com' }, schema);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Data Type Validation', () => {
    it('should validate string type', () => {
      const schema: ValidationSchema = {
        name: { type: 'string' },
      };

      const validResult = validationService.validate({ name: 'John' }, schema);
      expect(validResult.isValid).toBe(true);

      const invalidResult = validationService.validate({ name: 123 }, schema);
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate number type', () => {
      const schema: ValidationSchema = {
        age: { type: 'number' },
      };

      const validResult = validationService.validate({ age: 25 }, schema);
      expect(validResult.isValid).toBe(true);

      const invalidResult = validationService.validate({ age: 'twenty-five' }, schema);
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate boolean type', () => {
      const schema: ValidationSchema = {
        active: { type: 'boolean' },
      };

      const validResult = validationService.validate({ active: true }, schema);
      expect(validResult.isValid).toBe(true);

      const invalidResult = validationService.validate({ active: 'true' }, schema);
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate array type', () => {
      const schema: ValidationSchema = {
        tags: { type: 'array' },
      };

      const validResult = validationService.validate({ tags: ['a', 'b'] }, schema);
      expect(validResult.isValid).toBe(true);

      const invalidResult = validationService.validate({ tags: 'not-an-array' }, schema);
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate object type', () => {
      const schema: ValidationSchema = {
        metadata: { type: 'object' },
      };

      const validResult = validationService.validate({ metadata: { key: 'value' } }, schema);
      expect(validResult.isValid).toBe(true);

      const invalidResult = validationService.validate({ metadata: 'not-an-object' }, schema);
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate date type', () => {
      const schema: ValidationSchema = {
        createdAt: { type: 'date' },
      };

      const validResult = validationService.validate({ createdAt: new Date() }, schema);
      expect(validResult.isValid).toBe(true);

      const validISOResult = validationService.validate({ createdAt: '2024-01-01' }, schema);
      expect(validISOResult.isValid).toBe(true);

      const invalidResult = validationService.validate({ createdAt: 'not-a-date' }, schema);
      expect(invalidResult.isValid).toBe(false);
    });
  });

  describe('Format Validation', () => {
    it('should validate email format', () => {
      const schema: ValidationSchema = {
        email: { format: 'email' },
      };

      const validResult = validationService.validate({ email: 'test@example.com' }, schema);
      expect(validResult.isValid).toBe(true);

      const invalidResult = validationService.validate({ email: 'invalid-email' }, schema);
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate ISO date format', () => {
      const schema: ValidationSchema = {
        date: { format: 'iso-date' },
      };

      const validResult = validationService.validate({ date: '2024-01-15' }, schema);
      expect(validResult.isValid).toBe(true);

      const validWithTimeResult = validationService.validate({ date: '2024-01-15T10:30:00' }, schema);
      expect(validWithTimeResult.isValid).toBe(true);

      const invalidResult = validationService.validate({ date: '01/15/2024' }, schema);
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate UUID format', () => {
      const schema: ValidationSchema = {
        id: { format: 'uuid' },
      };

      const validResult = validationService.validate(
        { id: '550e8400-e29b-41d4-a716-446655440000' },
        schema
      );
      expect(validResult.isValid).toBe(true);

      const invalidResult = validationService.validate({ id: 'not-a-uuid' }, schema);
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate URL format', () => {
      const schema: ValidationSchema = {
        website: { format: 'url' },
      };

      const validResult = validationService.validate({ website: 'https://example.com' }, schema);
      expect(validResult.isValid).toBe(true);

      const invalidResult = validationService.validate({ website: 'not-a-url' }, schema);
      expect(invalidResult.isValid).toBe(false);
    });
  });

  describe('String Constraints', () => {
    it('should validate minLength constraint', () => {
      const schema: ValidationSchema = {
        password: { minLength: 8 },
      };

      const validResult = validationService.validate({ password: 'password123' }, schema);
      expect(validResult.isValid).toBe(true);

      const invalidResult = validationService.validate({ password: 'pass' }, schema);
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate maxLength constraint', () => {
      const schema: ValidationSchema = {
        name: { maxLength: 50 },
      };

      const validResult = validationService.validate({ name: 'John Doe' }, schema);
      expect(validResult.isValid).toBe(true);

      const invalidResult = validationService.validate({ name: 'a'.repeat(51) }, schema);
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate pattern constraint', () => {
      const schema: ValidationSchema = {
        code: { pattern: /^[A-Z]{3}-\d{3}$/ },
      };

      const validResult = validationService.validate({ code: 'ABC-123' }, schema);
      expect(validResult.isValid).toBe(true);

      const invalidResult = validationService.validate({ code: 'abc-123' }, schema);
      expect(invalidResult.isValid).toBe(false);
    });
  });

  describe('Number Constraints', () => {
    it('should validate min constraint', () => {
      const schema: ValidationSchema = {
        age: { min: 18 },
      };

      const validResult = validationService.validate({ age: 25 }, schema);
      expect(validResult.isValid).toBe(true);

      const invalidResult = validationService.validate({ age: 15 }, schema);
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate max constraint', () => {
      const schema: ValidationSchema = {
        quantity: { max: 100 },
      };

      const validResult = validationService.validate({ quantity: 50 }, schema);
      expect(validResult.isValid).toBe(true);

      const invalidResult = validationService.validate({ quantity: 150 }, schema);
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate both min and max constraints', () => {
      const schema: ValidationSchema = {
        rating: { min: 1, max: 5 },
      };

      const validResult = validationService.validate({ rating: 3 }, schema);
      expect(validResult.isValid).toBe(true);

      const tooLowResult = validationService.validate({ rating: 0 }, schema);
      expect(tooLowResult.isValid).toBe(false);

      const tooHighResult = validationService.validate({ rating: 6 }, schema);
      expect(tooHighResult.isValid).toBe(false);
    });
  });

  describe('Enum Validation', () => {
    it('should validate enum values', () => {
      const schema: ValidationSchema = {
        status: { enum: ['pending', 'completed', 'cancelled'] },
      };

      const validResult = validationService.validate({ status: 'pending' }, schema);
      expect(validResult.isValid).toBe(true);

      const invalidResult = validationService.validate({ status: 'invalid' }, schema);
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate numeric enum values', () => {
      const schema: ValidationSchema = {
        priority: { enum: [1, 2, 3] },
      };

      const validResult = validationService.validate({ priority: 2 }, schema);
      expect(validResult.isValid).toBe(true);

      const invalidResult = validationService.validate({ priority: 5 }, schema);
      expect(invalidResult.isValid).toBe(false);
    });
  });

  describe('Custom Validation', () => {
    it('should validate with custom function returning boolean', () => {
      const schema: ValidationSchema = {
        email: {
          custom: (value) => value.includes('@'),
        },
      };

      const validResult = validationService.validate({ email: 'test@example.com' }, schema);
      expect(validResult.isValid).toBe(true);

      const invalidResult = validationService.validate({ email: 'invalid' }, schema);
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate with custom function returning error message', () => {
      const schema: ValidationSchema = {
        price: {
          custom: (value) => (value > 0 ? true : 'Price must be positive'),
        },
      };

      const validResult = validationService.validate({ price: 100 }, schema);
      expect(validResult.isValid).toBe(true);

      const invalidResult = validationService.validate({ price: -10 }, schema);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors[0].message).toBe('Price must be positive');
    });
  });

  describe('Business Rule Validation', () => {
    it('should validate business rules', () => {
      const rules = {
        price: (value: number) => value > 0 ? true : 'Price must be positive',
        quantity: (value: number) => value >= 1 ? true : 'Quantity must be at least 1',
      };

      const validResult = validationService.validateBusinessRules(
        { price: 100, quantity: 5 },
        rules
      );
      expect(validResult.isValid).toBe(true);

      const invalidResult = validationService.validateBusinessRules(
        { price: -10, quantity: 0 },
        rules
      );
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toHaveLength(2);
    });
  });

  describe('Complex Schema Validation', () => {
    it('should validate complete user registration schema', () => {
      const schema: ValidationSchema = {
        email: { required: true, type: 'string', format: 'email' },
        password: { required: true, type: 'string', minLength: 8 },
        name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
        age: { required: false, type: 'number', min: 18, max: 120 },
        role: { required: false, type: 'string', enum: ['admin', 'user'] },
      };

      const validData = {
        email: 'test@example.com',
        password: 'securePassword123',
        name: 'John Doe',
        age: 25,
        role: 'user',
      };

      const validResult = validationService.validate(validData, schema);
      expect(validResult.isValid).toBe(true);

      const invalidData = {
        email: 'invalid-email',
        password: 'short',
        name: 'J',
        age: 15,
        role: 'superuser',
      };

      const invalidResult = validationService.validate(invalidData, schema);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    it('should validate complete order schema', () => {
      const schema: ValidationSchema = {
        orderId: { required: true, type: 'string', format: 'uuid' },
        userId: { required: true, type: 'string', format: 'uuid' },
        ticketId: { required: true, type: 'string', format: 'uuid' },
        quantity: { required: true, type: 'number', min: 1, max: 1000 },
        totalAmount: { required: true, type: 'number', min: 0.01 },
        status: { required: true, type: 'string', enum: ['pending', 'completed', 'cancelled'] },
        paymentType: { required: true, type: 'string', enum: ['cash', 'non-cash'] },
        visitDate: { required: true, type: 'date', format: 'iso-date' },
      };

      const validData = {
        orderId: '550e8400-e29b-41d4-a716-446655440000',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        ticketId: '550e8400-e29b-41d4-a716-446655440002',
        quantity: 5,
        totalAmount: 250.00,
        status: 'pending',
        paymentType: 'cash',
        visitDate: '2024-02-15',
      };

      const validResult = validationService.validate(validData, schema);
      expect(validResult.isValid).toBe(true);
    });
  });

  describe('validateRequired helper', () => {
    it('should validate required fields', () => {
      const result = validationService.validateRequired(
        { email: 'test@example.com' },
        ['email', 'password']
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('password');
    });
  });

  describe('validateTypes helper', () => {
    it('should validate data types', () => {
      const result = validationService.validateTypes(
        { name: 'John', age: 'twenty-five' },
        { name: 'string', age: 'number' }
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('age');
    });
  });

  describe('Error Messages', () => {
    it('should provide clear error messages', () => {
      const schema: ValidationSchema = {
        email: { required: true, format: 'email' },
        age: { type: 'number', min: 18 },
      };

      const result = validationService.validate(
        { email: 'invalid', age: 15 },
        schema
      );

      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].message).toContain('Email');
      expect(result.errors[1].message).toContain('Age');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined data object', () => {
      const schema: ValidationSchema = {
        email: { required: true },
      };

      const result = validationService.validate(undefined, schema);
      expect(result.isValid).toBe(false);
    });

    it('should handle empty schema', () => {
      const result = validationService.validate({ email: 'test@example.com' }, {});
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle extra fields in data', () => {
      const schema: ValidationSchema = {
        email: { required: true },
      };

      const result = validationService.validate(
        { email: 'test@example.com', extraField: 'value' },
        schema
      );
      expect(result.isValid).toBe(true);
    });

    it('should handle zero as valid number', () => {
      const schema: ValidationSchema = {
        count: { type: 'number' },
      };

      const result = validationService.validate({ count: 0 }, schema);
      expect(result.isValid).toBe(true);
    });

    it('should handle false as valid boolean', () => {
      const schema: ValidationSchema = {
        active: { type: 'boolean' },
      };

      const result = validationService.validate({ active: false }, schema);
      expect(result.isValid).toBe(true);
    });
  });
});
