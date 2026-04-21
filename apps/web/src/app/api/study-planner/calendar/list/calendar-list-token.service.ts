import { createClient as createServiceClient } from '@supabase/supabase-js';
import type { CalendarIntegrationMetadata } from '../../../../../features/study-planner/types/user-context.types';

export interface CalendarIntegrationRow {
  id: string;
  provider: 'google' | 'microsoft';
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  metadata: CalendarIntegrationMetadata | null;
}

interface TokenRefreshResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID ||
  process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID ||
  process.env.GOOGLE_CLIENT_ID ||
  process.env.GOOGLE_OAUTH_CLIENT_ID;

const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET ||
  process.env.GOOGLE_CLIENT_SECRET ||
  process.env.GOOGLE_OAUTH_CLIENT_SECRET;

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CALENDAR_CLIENT_ID ||
  process.env.NEXT_PUBLIC_MICROSOFT_CALENDAR_CLIENT_ID ||
  process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID ||
  process.env.MICROSOFT_CLIENT_ID ||
  process.env.MICROSOFT_OAUTH_CLIENT_ID;

const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CALENDAR_CLIENT_SECRET ||
  process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_SECRET ||
  process.env.MICROSOFT_CLIENT_SECRET ||
  process.env.MICROSOFT_OAUTH_CLIENT_SECRET;

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Variables de Supabase no configuradas');
  }

  return createServiceClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function refreshAccessToken(
  integration: CalendarIntegrationRow,
): Promise<{ success: boolean; accessToken?: string }> {
  try {
    const refreshConfig = getRefreshConfig(integration);
    if (!refreshConfig) {
      return { success: false };
    }

    const response = await fetch(refreshConfig.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(refreshConfig.body),
    });

    if (!response.ok) return { success: false };
    const tokens: TokenRefreshResponse = await response.json();
    if (!tokens.access_token) return { success: false };

    const supabase = createAdminClient();
    await supabase
      .from('calendar_integrations')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || integration.refresh_token,
        expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration.id);

    return { success: true, accessToken: tokens.access_token };
  } catch (error) {
    console.error('[Calendar List] Error refrescando token:', error);
    return { success: false };
  }
}

function getRefreshConfig(integration: CalendarIntegrationRow): {
  url: string;
  body: Record<string, string>;
} | null {
  if (integration.provider === 'google') {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !integration.refresh_token) {
      return null;
    }

    return {
      url: 'https://oauth2.googleapis.com/token',
      body: {
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
      },
    };
  }

  if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET || !integration.refresh_token) {
    return null;
  }

  return {
    url: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    body: {
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      refresh_token: integration.refresh_token,
      grant_type: 'refresh_token',
      scope: 'offline_access Calendars.Read User.Read',
    },
  };
}
