import 'server-only'
import { createClient as createServiceClient } from '@supabase/supabase-js';
import type {
  CalendarIntegrationRow,
  StudySessionRow,
} from './check-changes.types';
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';

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

export async function getUserPlanIds(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<{ planIds: string[]; error?: unknown }> {
  const { data: allPlans, error } = await supabase
    .from('study_plans')
    .select('id, timezone')
    .eq('user_id', userId);

  if (error || !allPlans || allPlans.length === 0) {
    return { planIds: [], error };
  }

  return { planIds: allPlans.map((plan) => plan.id) };
}

export async function getSyncedStudySessions(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  planIds: string[],
): Promise<{ sessions: StudySessionRow[]; error?: unknown }> {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('id, title, start_time, end_time, external_event_id, calendar_provider, status, plan_id, metrics')
    .in('plan_id', planIds)
    .eq('user_id', userId)
    .not('external_event_id', 'is', null);

  return { sessions: (data ?? []) as StudySessionRow[], error };
}

export async function getLatestCalendarIntegration(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<CalendarIntegrationRow | null> {
  const { data: integrations, error } = await supabase
    .from('calendar_integrations')
    .select(SELECT_COLUMNS.calendar_integrations)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error || !integrations || integrations.length === 0) {
    return null;
  }

  return (integrations as CalendarIntegrationRow[])[0];
}
