import { Logger } from '../../src/utils/logger';
import fs from 'fs';

describe('Logger', () => {
  let logger: Logger;
  const testContext = 'TestContext';

  beforeEach(() => {
    logger = new Logger(testContext);
  });

  describe('constructor', () => {
    it('should create logger with context', () => {
      expect(logger).toBeDefined();
    });

    it('should ensure log directory exists', () => {
      const logDir = './logs';
      expect(fs.existsSync(logDir)).toBe(true);
    });
  });

  describe('logging methods', () => {
    it('should log info message', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      logger.info('Test info message');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log warning message', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      logger.warn('Test warning message');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log error message', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      logger.error('Test error message');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log with data', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const testData = { key: 'value' };
      logger.info('Test message', testData);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log error with Error object', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('Test error');
      logger.error('Error occurred', testError);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
