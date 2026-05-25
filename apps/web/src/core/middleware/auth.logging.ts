import type { NextRequest } from 'next/server';
import { logger } from '../../lib/logger';
import type { SecurityEvent } from './auth.types';

export async function logSecurityEvent(
  event: SecurityEvent,
  data: {
    userId?: string;
    path?: string;
    ip?: string;
    role?: string;
    attemptedPath?: string;
    userAgent?: string;
  },
) {
  const logData = {
    event,
    timestamp: new Date().toISOString(),
    ...data,
  };

  if (event === 'ROLE_VALIDATION_SUCCESS') {
    logger.debug('Security validation passed', logData);
  } else {
    logger.error(`[SECURITY] ${event}`, undefined, logData);
  }
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIp) return realIp;

  return 'unknown';
}
