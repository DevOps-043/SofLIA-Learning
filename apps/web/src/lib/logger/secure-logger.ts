import { SecureLogger } from './secure-logger.class';
import {
  redactSensitivePatterns,
  sanitizeData,
} from './secure-logger.sanitizers';
import type { LoggerOptions, LogMetadata } from './secure-logger.types';

export { SecureLogger } from './secure-logger.class';
export {
  redactSensitivePatterns,
  sanitizeData,
  sanitizeStackTrace,
} from './secure-logger.sanitizers';
export { LogLevel } from './secure-logger.types';
export type { LoggerOptions, LogMetadata } from './secure-logger.types';

export const logger = new SecureLogger('AprendeYAplica');

export function createLogger(
  context: string,
  options?: LoggerOptions
): SecureLogger {
  return new SecureLogger(context, options);
}

export function logRequest(
  request: Request,
  metadata?: LogMetadata,
  options?: LoggerOptions
): void {
  const { method, url } = request;
  const requestLogger = logger.child('HTTP');

  requestLogger.http(`${method} ${url}`, {
    method,
    url: redactSensitivePatterns(url),
    headers: sanitizeData({
      'user-agent': request.headers.get('user-agent'),
      'content-type': request.headers.get('content-type'),
    }),
    ...metadata,
  }, options);
}

export function logError(
  message: string,
  error: Error | unknown,
  metadata?: LogMetadata,
  options?: LoggerOptions
): void {
  logger.error(message, error, metadata, options);
}
