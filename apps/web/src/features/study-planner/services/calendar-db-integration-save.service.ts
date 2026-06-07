import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createAdminClient } from '@/lib/supabase/admin';
import type {
  CalendarIntegration,
  CalendarIntegrationMetadata,
} from '../types/user-context.types';
import { CALENDAR_INTEGRATION_PUBLIC_SELECT } from './calendar-db.constants';
import type { Json } from '@/lib/supabase/types';

interface CalendarTokenPayload {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

export async function saveCalendarIntegrationRecord(
  userId: string,
  provider: 'google' | 'microsoft',
  tokens: CalendarTokenPayload,
  calendarEmail?: string | null,
): Promise<CalendarIntegration | null> {
  const supabase = createAdminClient();
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  const { data: existing } = await supabase
    .from('calendar_integrations')
    .select('id, refresh_token, metadata')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single();

  const result = existing
    ? await updateCalendarIntegrationRecord(
        {
          id: existing.id,
          refresh_token: existing.refresh_token,
          metadata: parseCalendarIntegrationMetadata(existing.metadata),
        },
        provider,
        tokens,
        expiresAt,
        calendarEmail,
      )
    : await createCalendarIntegrationRecord(userId, provider, tokens, expiresAt, calendarEmail);

  if (!result) {
    return null;
  }

  return {
    id: result.id,
    userId: result.user_id,
    provider: result.provider as 'google' | 'microsoft',
    isConnected: true,
    expiresAt: result.expires_at || undefined,
    scope: result.scope || undefined,
  };
}

function parseCalendarIntegrationMetadata(value: Json): CalendarIntegrationMetadata {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const metadata = value as Record<string, unknown>;
  return {
    account_email: typeof metadata.account_email === 'string' ? metadata.account_email : undefined,
    provider_account_id: typeof metadata.provider_account_id === 'string' ? metadata.provider_account_id : undefined,
    secondary_calendar_id: typeof metadata.secondary_calendar_id === 'string' ? metadata.secondary_calendar_id : undefined,
    selected_calendar_ids: Array.isArray(metadata.selected_calendar_ids)
      ? metadata.selected_calendar_ids.filter((calendarId): calendarId is string => typeof calendarId === 'string')
      : undefined,
  };
}

async function updateCalendarIntegrationRecord(
  existing: {
    id: string;
    refresh_token?: string | null;
    metadata?: CalendarIntegrationMetadata | null;
  },
  provider: 'google' | 'microsoft',
  tokens: CalendarTokenPayload,
  expiresAt: string | null,
  calendarEmail?: string | null,
) {
  const supabase = createAdminClient();
  const refreshTokenToSave = tokens.refresh_token || existing.refresh_token;
  const existingMetadata = (existing.metadata || {}) as CalendarIntegrationMetadata;
  const { data, error } = await supabase
    .from('calendar_integrations')
    .update({
      access_token: tokens.access_token,
      refresh_token: refreshTokenToSave,
      expires_at: expiresAt,
      metadata: {
        ...existingMetadata,
        account_email: calendarEmail || existingMetadata.account_email,
        provider_account_id:
          calendarEmail
          || existingMetadata.provider_account_id
          || existingMetadata.account_email,
      },
      scope: tokens.scope,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id)
    .select(CALENDAR_INTEGRATION_PUBLIC_SELECT)
    .single();

  handleCalendarIntegrationError(error, `actualizando integracion ${provider}`);
  return data;
}

async function createCalendarIntegrationRecord(
  userId: string,
  provider: 'google' | 'microsoft',
  tokens: CalendarTokenPayload,
  expiresAt: string | null,
  calendarEmail?: string | null,
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('calendar_integrations')
    .insert({
      user_id: userId,
      provider,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      metadata: calendarEmail
        ? {
            account_email: calendarEmail,
            provider_account_id: calendarEmail,
          }
        : undefined,
      scope: tokens.scope,
    })
    .select(CALENDAR_INTEGRATION_PUBLIC_SELECT)
    .single();

  handleCalendarIntegrationError(error, `creando integracion ${provider}`);
  return data;
}

function handleCalendarIntegrationError(error: { code?: string; message?: string } | null, context: string): void {
  if (!error) {
    return;
  }

  techDebtLogger.error(`Error ${context}:`, error);

  if (error.code === '42501' || error.message?.includes('row-level security')) {
    throw new Error('RLS_ERROR: No tienes permisos para modificar integraciones de calendario. Verifica las politicas RLS de la tabla calendar_integrations en Supabase.');
  }

  throw error;
}
