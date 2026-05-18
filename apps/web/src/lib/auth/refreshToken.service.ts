import { cookies } from 'next/headers';

import { createClient } from '../supabase/server';
import { RefreshTokenError } from './refresh-token.errors';
import {
  buildAccessTokenCookieOptions,
  createAccessTokenExpiry,
  createRefreshTokenExpiry,
  generateSecureToken,
  getDeviceFingerprint,
  getIpAddress,
  hashRefreshToken,
  isRefreshTokenInactive,
} from './refresh-token.helpers';

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string | null;
  last_used_at: string | null;
  device_fingerprint?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  is_revoked: boolean | null;
  revoked_at?: string | null;
  revoked_reason?: string | null;
}

export interface SessionInfo {
  userId: string;
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
}

export interface RefreshSessionInfo {
  userId: string;
  accessToken: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
}

type RefreshTokenRow = Omit<
  RefreshToken,
  'created_at' | 'last_used_at' | 'is_revoked'
> & {
  created_at: string | null;
  last_used_at: string | null;
  is_revoked: boolean | null;
};

const REFRESH_TOKEN_SELECT =
  'id, user_id, token_hash, expires_at, created_at, last_used_at, device_fingerprint, ip_address, user_agent, is_revoked, revoked_at, revoked_reason';

function normalizeRefreshToken(row: RefreshTokenRow): RefreshToken {
  const createdAt = row.created_at ?? row.last_used_at ?? new Date().toISOString();
  const lastUsedAt = row.last_used_at ?? createdAt;

  return {
    ...row,
    created_at: createdAt,
    last_used_at: lastUsedAt,
    is_revoked: row.is_revoked ?? false,
  };
}

export class RefreshTokenService {
  static async hashTokenForLookup(token: string): Promise<string> {
    return hashRefreshToken(token);
  }

  private static async findActiveRefreshToken(
    refreshToken: string
  ): Promise<RefreshToken> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('refresh_tokens')
      .select(REFRESH_TOKEN_SELECT)
      .eq('token_hash', hashRefreshToken(refreshToken))
      .eq('is_revoked', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) {
      throw new RefreshTokenError(
        'REFRESH_TOKEN_LOOKUP_FAILED',
        `Error fetching refresh token: ${error.message}`
      );
    }

    if (!data) {
      throw new RefreshTokenError('INVALID_REFRESH_TOKEN');
    }

    return normalizeRefreshToken(data as RefreshTokenRow);
  }

  static async createSession(
    userId: string,
    rememberMe: boolean = false,
    request?: Request
  ): Promise<SessionInfo> {
    const supabase = await createClient();

    const accessToken = generateSecureToken();
    const refreshToken = generateSecureToken();
    const accessExpiresAt = createAccessTokenExpiry();
    const refreshExpiresAt = createRefreshTokenExpiry(rememberMe);

    const { error } = await supabase.from('refresh_tokens').insert({
      user_id: userId,
      token_hash: hashRefreshToken(refreshToken),
      expires_at: refreshExpiresAt.toISOString(),
      device_fingerprint: getDeviceFingerprint(request),
      ip_address: getIpAddress(request),
      user_agent: request?.headers.get('user-agent') || null,
      is_revoked: false,
    });

    if (error) {
      throw new Error(`Error creando refresh token: ${error.message}`);
    }

    return {
      userId,
      accessToken,
      refreshToken,
      accessExpiresAt,
      refreshExpiresAt,
    };
  }

  static async refreshSession(): Promise<RefreshSessionInfo> {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (!refreshToken) {
      throw new RefreshTokenError('MISSING_REFRESH_TOKEN');
    }

    const tokenData = await this.findActiveRefreshToken(refreshToken);

    if (
      tokenData.last_used_at &&
      isRefreshTokenInactive(tokenData.last_used_at)
    ) {
      await this.revokeToken(tokenData.id, 'Session expired due to inactivity');
      throw new RefreshTokenError('INACTIVE_REFRESH_TOKEN');
    }

    const { error: updateError } = await supabase
      .from('refresh_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', tokenData.id)
      .eq('is_revoked', false);

    if (updateError) {
      throw new RefreshTokenError(
        'REFRESH_TOKEN_UPDATE_FAILED',
        `Error updating refresh token: ${updateError.message}`
      );
    }

    const accessToken = generateSecureToken();
    const accessExpiresAt = createAccessTokenExpiry();

    cookieStore.set(
      'access_token',
      accessToken,
      buildAccessTokenCookieOptions(accessExpiresAt)
    );

    return {
      userId: tokenData.user_id,
      accessToken,
      accessExpiresAt,
      refreshExpiresAt: new Date(tokenData.expires_at),
    };
  }

  static async revokeToken(
    tokenId: string,
    reason: string = 'Manual revocation'
  ): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from('refresh_tokens')
      .update({
        is_revoked: true,
        revoked_at: new Date().toISOString(),
        revoked_reason: reason,
      })
      .eq('id', tokenId);
  }

  static async revokeAllUserTokens(
    userId: string,
    reason: string = 'User logout'
  ): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from('refresh_tokens')
      .update({
        is_revoked: true,
        revoked_at: new Date().toISOString(),
        revoked_reason: reason,
      })
      .eq('user_id', userId)
      .eq('is_revoked', false);
  }

  static async destroySession(userId?: string): Promise<void> {
    const cookieStore = await cookies();

    cookieStore.delete('access_token');
    cookieStore.delete('refresh_token');

    if (userId) {
      await this.revokeAllUserTokens(userId, 'User logout');
    }
  }

  static async getUserActiveSessions(userId: string): Promise<RefreshToken[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('refresh_tokens')
      .select(REFRESH_TOKEN_SELECT)
      .eq('user_id', userId)
      .eq('is_revoked', false)
      .gte('expires_at', new Date().toISOString())
      .order('last_used_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching active sessions: ${error.message}`);
    }

    return (data || []).map((row) => normalizeRefreshToken(row as RefreshTokenRow));
  }

  static async cleanExpiredTokens(): Promise<number> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('refresh_tokens')
      .delete()
      .or(
        `expires_at.lt.${new Date().toISOString()},and(is_revoked.eq.true,revoked_at.lt.${new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString()})`
      )
      .select('id');

    if (error) {
      return 0;
    }

    return data?.length || 0;
  }
}
