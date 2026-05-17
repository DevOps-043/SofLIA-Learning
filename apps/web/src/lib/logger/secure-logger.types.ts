export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug',
}

export interface LogMetadata {
  [key: string]: unknown;
  timestamp?: string;
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

export interface LoggerOptions {
  context?: string;
  sanitize?: boolean;
  includeStackTrace?: boolean;
}
