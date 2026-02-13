import fs from 'fs';
import path from 'path';
import { config } from '../config/environment';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Logger utility for application logging
 */
export class Logger {
  private context: string;
  private logDir: string;

  constructor(context: string) {
    this.context = context;
    this.logDir = config.logging.dir;
    this.ensureLogDir();
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDir(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Format log message
   */
  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}${dataStr}`;
  }

  /**
   * Write log to file
   */
  private writeToFile(level: LogLevel, message: string): void {
    try {
      const logFile = path.join(this.logDir, `${level}.log`);
      fs.appendFileSync(logFile, message + '\n');
    } catch (error) {
      console.error('Failed to write log to file', error);
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: unknown): void {
    const formattedMessage = this.formatMessage('debug', message, data);
    if (LOG_LEVELS[config.logging.level as LogLevel] <= LOG_LEVELS.debug) {
      console.log(formattedMessage);
      this.writeToFile('debug', formattedMessage);
    }
  }

  /**
   * Log info message
   */
  info(message: string, data?: unknown): void {
    const formattedMessage = this.formatMessage('info', message, data);
    if (LOG_LEVELS[config.logging.level as LogLevel] <= LOG_LEVELS.info) {
      console.log(formattedMessage);
      this.writeToFile('info', formattedMessage);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: unknown): void {
    const formattedMessage = this.formatMessage('warn', message, data);
    if (LOG_LEVELS[config.logging.level as LogLevel] <= LOG_LEVELS.warn) {
      console.warn(formattedMessage);
      this.writeToFile('warn', formattedMessage);
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: unknown): void {
    const errorData = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
    } : error;
    const formattedMessage = this.formatMessage('error', message, errorData);
    if (LOG_LEVELS[config.logging.level as LogLevel] <= LOG_LEVELS.error) {
      console.error(formattedMessage);
      this.writeToFile('error', formattedMessage);
    }
  }
}
