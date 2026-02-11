/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Field validation rule
 */
export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: (string | number)[];
  custom?: (value: any) => boolean | string;
  format?: 'email' | 'date' | 'iso-date' | 'uuid' | 'url';
}

/**
 * Schema definition for validation
 */
export interface ValidationSchema {
  [field: string]: ValidationRule;
}

/**
 * Validation Service
 * Provides comprehensive input validation with support for:
 * - Required field validation
 * - Data type validation
 * - Format validation (email, dates, etc.)
 * - Business rule validation
 */
export class ValidationService {
  /**
   * Validate data against a schema
   */
  validate(data: any, schema: ValidationSchema): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate each field in the schema
    for (const field in schema) {
      const rule = schema[field];
      const value = data?.[field];

      // Check required fields
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field,
          message: `${this.formatFieldName(field)} is required`,
        });
        continue;
      }

      // Skip validation if field is not required and not provided
      if (!rule.required && (value === undefined || value === null)) {
        continue;
      }

      // For optional fields, skip if empty string
      if (!rule.required && value === '') {
        continue;
      }

      // Validate data type
      if (rule.type) {
        const typeError = this.validateType(field, value, rule.type);
        if (typeError) {
          errors.push(typeError);
          continue;
        }
      }

      // Validate format
      if (rule.format) {
        const formatError = this.validateFormat(field, value, rule.format);
        if (formatError) {
          errors.push(formatError);
          continue;
        }
      }

      // Validate string constraints
      if (typeof value === 'string') {
        if (rule.minLength !== undefined && value.length < rule.minLength) {
          errors.push({
            field,
            message: `${this.formatFieldName(field)} must be at least ${rule.minLength} characters`,
          });
        }
        if (rule.maxLength !== undefined && value.length > rule.maxLength) {
          errors.push({
            field,
            message: `${this.formatFieldName(field)} must be at most ${rule.maxLength} characters`,
          });
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push({
            field,
            message: `${this.formatFieldName(field)} has invalid format`,
          });
        }
      }

      // Validate number constraints
      if (typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push({
            field,
            message: `${this.formatFieldName(field)} must be at least ${rule.min}`,
          });
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push({
            field,
            message: `${this.formatFieldName(field)} must be at most ${rule.max}`,
          });
        }
      }

      // Validate enum values
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push({
          field,
          message: `${this.formatFieldName(field)} must be one of: ${rule.enum.join(', ')}`,
        });
      }

      // Validate custom rules
      if (rule.custom) {
        const customResult = rule.custom(value);
        if (customResult !== true) {
          const message = typeof customResult === 'string' ? customResult : `${this.formatFieldName(field)} is invalid`;
          errors.push({
            field,
            message,
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate data type
   */
  private validateType(field: string, value: any, type: string): ValidationError | null {
    let actualType = typeof value;

    // Handle special types
    if (type === 'date') {
      if (!(value instanceof Date) && isNaN(Date.parse(value))) {
        return {
          field,
          message: `${this.formatFieldName(field)} must be a valid date`,
        };
      }
      return null;
    }

    if (type === 'array') {
      if (!Array.isArray(value)) {
        return {
          field,
          message: `${this.formatFieldName(field)} must be an array`,
        };
      }
      return null;
    }

    if (type === 'object') {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return {
          field,
          message: `${this.formatFieldName(field)} must be an object`,
        };
      }
      return null;
    }

    if (actualType !== type) {
      return {
        field,
        message: `${this.formatFieldName(field)} must be a ${type}`,
      };
    }

    return null;
  }

  /**
   * Validate format (email, date, uuid, url)
   */
  private validateFormat(field: string, value: any, format: string): ValidationError | null {
    const stringValue = String(value);

    switch (format) {
      case 'email':
        if (!this.isValidEmail(stringValue)) {
          return {
            field,
            message: `${this.formatFieldName(field)} must be a valid email address`,
          };
        }
        break;

      case 'date':
      case 'iso-date':
        if (!this.isValidDate(stringValue)) {
          return {
            field,
            message: `${this.formatFieldName(field)} must be a valid date`,
          };
        }
        break;

      case 'uuid':
        if (!this.isValidUUID(stringValue)) {
          return {
            field,
            message: `${this.formatFieldName(field)} must be a valid UUID`,
          };
        }
        break;

      case 'url':
        if (!this.isValidURL(stringValue)) {
          return {
            field,
            message: `${this.formatFieldName(field)} must be a valid URL`,
          };
        }
        break;
    }

    return null;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate date format (ISO 8601)
   */
  private isValidDate(date: string): boolean {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/;
    if (!isoDateRegex.test(date)) {
      return false;
    }
    const parsed = Date.parse(date);
    return !isNaN(parsed);
  }

  /**
   * Validate UUID format
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate URL format
   */
  private isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Format field name for error messages (convert camelCase to Title Case)
   */
  private formatFieldName(field: string): string {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  /**
   * Validate required fields
   */
  validateRequired(data: any, requiredFields: string[]): ValidationResult {
    const errors: ValidationError[] = [];

    for (const field of requiredFields) {
      const value = data?.[field];
      if (value === undefined || value === null || value === '') {
        errors.push({
          field,
          message: `${this.formatFieldName(field)} is required`,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate data types
   */
  validateTypes(data: any, typeMap: { [field: string]: string }): ValidationResult {
    const errors: ValidationError[] = [];

    for (const field in typeMap) {
      const value = data?.[field];
      if (value === undefined || value === null) {
        continue;
      }

      const expectedType = typeMap[field];
      const actualType = typeof value;

      if (actualType !== expectedType) {
        errors.push({
          field,
          message: `${this.formatFieldName(field)} must be a ${expectedType}`,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate business rules
   */
  validateBusinessRules(data: any, rules: { [field: string]: (value: any) => boolean | string }): ValidationResult {
    const errors: ValidationError[] = [];

    for (const field in rules) {
      const value = data?.[field];
      const rule = rules[field];

      const result = rule(value);
      if (result !== true) {
        const message = typeof result === 'string' ? result : `${this.formatFieldName(field)} violates business rules`;
        errors.push({
          field,
          message,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
