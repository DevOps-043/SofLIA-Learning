import { cacheGet, cacheSet } from '../../../lib/cache/ttlCache';
import { logger } from '../../../lib/logger';
import { createClient } from '../../../lib/supabase/server';
import type {
  LegacySessionLookupRow,
  LegacySessionRecord,
  SessionUserRecord,
} from './session.types';

const LEGACY_SESSION_CACHE_TTL_MS = 30_000;

interface BuildLegacySessionRecordParams {
  expiresAt: Date;
  ip: string;
  sessionToken: string;
  userAgent: string;
  userId: string;
}

function getLegacySessionCacheKey(sessionToken: string): string {
  return `user-by-session:${sessionToken}`;
}

export function buildLegacySessionRecord({
  expiresAt,
  ip,
  sessionToken,
  userAgent,
  userId,
}: BuildLegacySessionRecordParams): LegacySessionRecord {
  return {
    user_id: userId,
    jwt_id: sessionToken,
    issued_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
    ip,
    user_agent: userAgent,
    revoked: false,
  };
}

export function getCachedLegacySessionUser(
  sessionToken: string
): SessionUserRecord | null {
  return cacheGet<SessionUserRecord>(getLegacySessionCacheKey(sessionToken)) ?? null;
}

export function cacheLegacySessionUser(
  sessionToken: string,
  user: SessionUserRecord
): void {
  cacheSet(getLegacySessionCacheKey(sessionToken), user, LEGACY_SESSION_CACHE_TTL_MS);
}

export async function findActiveLegacySession(
  sessionToken: string
): Promise<LegacySessionLookupRow | null> {
  const supabase = await createClient();

  logger.debug('Buscando sesión legacy en DB con jwt_id', {
    tokenPrefix: `${sessionToken.substring(0, 8)}...`,
  });

  const { data, error } = await supabase
    .from('user_session')
    .select('user_id, expires_at, revoked')
    .eq('jwt_id', sessionToken)
    .eq('revoked', false)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error) {
    logger.warn('⚠️ Error buscando sesión legacy:', {
      code: error.code,
      message: error.message,
      hint: error.hint,
    });
    return null;
  }

  if (!data) {
    logger.warn('⚠️ Sesión legacy no encontrada o inválida');
    return null;
  }

  return data as LegacySessionLookupRow;
}

export async function revokeLegacySession(
  sessionToken: string
): Promise<string | null> {
  const supabase = await createClient();

  const { data: session } = await supabase
    .from('user_session')
    .select('user_id')
    .eq('jwt_id', sessionToken)
    .single();

  await supabase
    .from('user_session')
    .update({ revoked: true })
    .eq('jwt_id', sessionToken);

  logger.debug('Sesión legacy revocada');

  return (session as { user_id?: string } | null)?.user_id ?? null;
}
