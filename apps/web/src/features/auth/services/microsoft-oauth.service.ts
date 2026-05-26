import { getMicrosoftRedirectUri } from '@/lib/oauth/microsoft';
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker';

export interface MicrosoftTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  id_token?: string;
  token_type: string;
  scope?: string;
}

export interface MicrosoftProfile {
  id: string;
  displayName?: string;
  givenName?: string;
  surname?: string;
  mail?: string;
  userPrincipalName?: string;
}

export class MicrosoftOAuthService {
  static async exchangeCodeForTokens(code: string): Promise<MicrosoftTokens> {
    const tenant = process.env.MICROSOFT_TENANT_ID || 'common';
    const clientId = process.env.MICROSOFT_OAUTH_CLIENT_ID!;
    const clientSecret = process.env.MICROSOFT_OAUTH_CLIENT_SECRET!;
    const redirectUri = getMicrosoftRedirectUri();

    const res = await fetchWithCircuitBreaker(`microsoft-oauth`, `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Microsoft token error: ${res.status} ${res.statusText} - ${text}`);
    }
    return res.json();
  }

  static async getUserProfile(accessToken: string): Promise<MicrosoftProfile> {
    const res = await fetchWithCircuitBreaker('microsoft-oauth', 'https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Microsoft profile error: ${res.status} ${res.statusText} - ${text}`);
    }
    return res.json();
  }

  // Returns the raw JPEG bytes of the user's profile photo, or null if none exists.
  // Many corporate M365 accounts have no photo configured; this is always a best-effort fetch.
  static async getUserPhoto(accessToken: string): Promise<ArrayBuffer | null> {
    try {
      const res = await fetchWithCircuitBreaker(
        'microsoft-oauth',
        'https://graph.microsoft.com/v1.0/me/photo/$value',
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) return null;
      return res.arrayBuffer();
    } catch {
      return null;
    }
  }
}

