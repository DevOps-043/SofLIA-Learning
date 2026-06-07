import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createAdminClient } from '@/lib/supabase/admin';
import type { CalendarIntegrationMetadata } from '../types/user-context.types';

type CalendarProvider = 'google' | 'microsoft';

interface CalendarSelectionRow {
  id: string;
  metadata: CalendarIntegrationMetadata | null;
}

async function getCalendarSelectionRow(
  userId: string,
  provider?: CalendarProvider,
): Promise<CalendarSelectionRow | null> {
  const supabase = createAdminClient();
  let query = supabase
    .from('calendar_integrations')
    .select('id, metadata')
    .eq('user_id', userId);

  if (provider) {
    query = query.eq('provider', provider);
  }

  const { data } = await query
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    metadata: (data.metadata ?? null) as CalendarIntegrationMetadata | null,
  };
}

export async function getSelectedCalendarIds(
  userId: string,
  provider?: CalendarProvider,
): Promise<string[] | null> {
  try {
    const data = await getCalendarSelectionRow(userId, provider);

    if (!data?.metadata) return null;
    const metadata = data.metadata as CalendarIntegrationMetadata;
    return metadata.selected_calendar_ids || null;
  } catch (error) {
    techDebtLogger.error('[Calendar] Error obteniendo calendarios seleccionados:', error);
    return null;
  }
}

export async function saveSelectedCalendarIds(
  userId: string,
  calendarIds: string[],
  provider?: CalendarProvider,
): Promise<void> {
  const supabase = createAdminClient();
  const data = await getCalendarSelectionRow(userId, provider);

  if (!data) {
    return;
  }

  const existingMetadata = (data?.metadata || {}) as CalendarIntegrationMetadata;

  await supabase
    .from('calendar_integrations')
    .update({
      metadata: {
        ...existingMetadata,
        selected_calendar_ids: calendarIds,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.id);
}
