import { createAdminClient } from './check-changes-db.service';
import type {
  CalendarIntegrationRow,
  TokenRefreshResponse,
} from './check-changes.types';
import { getRefreshCredentials } from './check-changes-token.credentials';

export async function resolveCalendarAccessToken(
  integration: CalendarIntegrationRow,
): Promise<string | null> {
  const tokenExpiry = integration.expires_at ? new Date(integration.expires_at) : null;
  const needsRefresh = !tokenExpiry || tokenExpiry <= new Date();

  if (!needsRefresh) {
    return integration.access_token;
  }

  if (!integration.refresh_token) {
    return integration.access_token;
  }

  const refreshResult = await refreshAccessToken(integration);
  return refreshResult.success && refreshResult.accessToken
    ? refreshResult.accessToken
    : integration.access_token;
}

async function refreshAccessToken(
  integration: CalendarIntegrationRow,
): Promise<{ success: boolean; accessToken?: string }> {
  const credentials = getRefreshCredentials(integration.provider);

  if (!credentials || !integration.refresh_token) {
    return { success: false };
  }

  try {
    const response = await fetch(credentials.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      return { success: false };
    }

    const tokens = await response.json() as TokenRefreshResponse;
    if (!tokens.access_token) {
      return { success: false };
    }

    await persistRefreshedTokens(integration, tokens);
    return { success: true, accessToken: tokens.access_token };
  } catch (error) {
    console.error('Error en refreshAccessToken:', error);
    return { success: false };
  }
}

async function persistRefreshedTokens(
  integration: CalendarIntegrationRow,
  tokens: TokenRefreshResponse,
): Promise<void> {
  const supabase = createAdminClient();
  const expiresAt = new Date(
    Date.now() + (tokens.expires_in || 3600) * 1000,
  ).toISOString();

  await supabase
    .from('calendar_integrations')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || integration.refresh_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', integration.id);
}
