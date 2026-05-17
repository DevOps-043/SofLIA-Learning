import {
  redactSensitivePatterns,
  sanitizeData,
  sanitizeStackTrace,
} from './secure-logger.sanitizers';
import { LogLevel, type LoggerOptions, type LogMetadata } from './secure-logger.types';

export class SecureLogger {
  private context: string;
  private defaultOptions: LoggerOptions;

  constructor(context: string = 'App', options: LoggerOptions = {}) {
    this.context = context;
    this.defaultOptions = {
      sanitize: true,
      includeStackTrace: process.env.NODE_ENV !== 'production',
      ...options,
    };
  }

  private formatLog(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata,
    options?: LoggerOptions
  ): string {
    const opts = { ...this.defaultOptions, ...options };
    const sanitizedMetadata = opts.sanitize && metadata
      ? sanitizeData(metadata)
      : metadata;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message: opts.sanitize ? redactSensitivePatterns(message) : message,
      ...sanitizedMetadata,
    };

    return JSON.stringify(
      logEntry,
      null,
      process.env.NODE_ENV === 'development' ? 2 : 0
    );
  }

  error(
    message: string,
    error?: Error | unknown,
    metadata?: LogMetadata,
    options?: LoggerOptions
  ): void {
    const opts = { ...this.defaultOptions, ...options };
    const errorMetadata: LogMetadata = { ...metadata };

    if (error instanceof Error) {
      errorMetadata.error = {
        name: error.name,
        message: opts.sanitize ? redactSensitivePatterns(error.message) : error.message,
        stack: opts.includeStackTrace ? sanitizeStackTrace(error.stack) : undefined,
      };
    } else if (error) {
      errorMetadata.error = opts.sanitize ? sanitizeData({ error }) : error;
    }

    console.error(this.formatLog(LogLevel.ERROR, message, errorMetadata, opts));
  }

  warn(message: string, metadata?: LogMetadata, options?: LoggerOptions): void {
    console.warn(this.formatLog(LogLevel.WARN, message, metadata, options));
  }

  info(message: string, metadata?: LogMetadata, options?: LoggerOptions): void {
    this.formatLog(LogLevel.INFO, message, metadata, options);
  }

  http(message: string, metadata?: LogMetadata, options?: LoggerOptions): void {
    this.formatLog(LogLevel.HTTP, message, metadata, options);
  }

  debug(message: string, metadata?: LogMetadata, options?: LoggerOptions): void {
    if (process.env.NODE_ENV === 'development') {
      this.formatLog(LogLevel.DEBUG, message, metadata, options);
    }
  }

  child(context: string, options?: LoggerOptions): SecureLogger {
    return new SecureLogger(`${this.context}:${context}`, {
      ...this.defaultOptions,
      ...options,
    });
  }
}
