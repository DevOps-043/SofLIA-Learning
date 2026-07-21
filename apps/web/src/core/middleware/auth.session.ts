import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import type { createClient } from '../../lib/supabase/server';
import { logSecurityEvent } from './auth.logging';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type SupabaseSessionClient = Pick<SupabaseServerClient, 'auth' | 'from'>;

export async function resolveAuthenticatedUserId(params: {
  request: NextRequest;
  supabase: SupabaseSessionClient;
  pathname: string;
  clientIp: string;
}) {
  const nativeResult = await resolveSupabaseAuthUserId(params.supabase);
  if (nativeResult.userId) return nativeResult;

  const legacyResult = await resolveLegacySessionUserId(params);
  if (legacyResult.userId || legacyResult.error) return legacyResult;

  const refreshTokenUserId = await resolveRefreshTokenUserId(
    params.request,
    params.supabase,
  );

  return refreshTokenUserId
    ? { userId: refreshTokenUserId }
    : { userId: null };
}

async function resolveSupabaseAuthUserId(supabase: SupabaseSessionClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ? { userId: user.id } : { userId: null };
}

async function resolveLegacySessionUserId(params: {
  request: NextRequest;
  supabase: SupabaseSessionClient;
  pathname: string;
  clientIp: string;
}) {
  const sessionCookie = params.request.cookies.get('aprende-y-aplica-session')?.value;
  if (!sessionCookie) return { userId: null };

  const { data: sessionData } = await params.supabase
    .from('user_session')
    .select('user_id, expires_at, revoked')
    .eq('jwt_id', sessionCookie)
    .maybeSingle();

  if (sessionData && !sessionData.revoked && new Date(sessionData.expires_at) > new Date()) {
    return { userId: sessionData.user_id };
  }

  if (sessionData?.revoked) {
    await logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
      userId: sessionData.user_id,
      path: params.pathname,
      ip: params.clientIp,
    });
    return { userId: null, error: 'Session revoked' };
  }

  if (sessionData) {
    await logSecurityEvent('EXPIRED_SESSION_ACCESS', {
      userId: sessionData.user_id,
      path: params.pathname,
      ip: params.clientIp,
    });
    return { userId: null, error: 'Session expired' };
  }

  return { userId: null };
}

async function resolveRefreshTokenUserId(
  request: NextRequest,
  supabase: SupabaseSessionClient,
) {
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const accessToken = request.cookies.get('access_token')?.value;
  if (!refreshToken || !accessToken) return null;

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const { data: tokenData } = await supabase
    .from('refresh_tokens')
    .select('user_id')
    .eq('token_hash', tokenHash)
    .eq('is_revoked', false)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  return tokenData?.user_id || null;
}
