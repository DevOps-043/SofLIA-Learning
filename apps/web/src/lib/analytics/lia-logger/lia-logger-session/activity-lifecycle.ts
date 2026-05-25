import { createClient } from '../../../supabase/server';
import { activityCompletionsTable } from '../lia-logger-events';

export async function startLiaActivity(
  conversationId: string,
  userId: string,
  activityId: string,
  totalSteps: number
) {
  const supabase = await createClient();
  const { data, error } = await activityCompletionsTable(supabase)
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      activity_id: activityId,
      status: 'started',
      total_steps: totalSteps,
      current_step: 1
    })
    .select('completion_id')
    .single();

  if (error) {
    throw error;
  }

  return data?.completion_id || '';
}

export async function completeLiaActivity(
  completionId: string,
  generatedOutput?: unknown
) {
  const supabase = await createClient();
  const { data: activity } = await activityCompletionsTable(supabase)
    .select('started_at, total_steps')
    .eq('completion_id', completionId)
    .single();

  if (!activity) {
    throw new Error('Activity not found');
  }

  const startedAtMs = activity.started_at
    ? new Date(activity.started_at).getTime()
    : Date.now();
  const timeToComplete = Math.floor((Date.now() - startedAtMs) / 1000);
  const { error } = await activityCompletionsTable(supabase)
    .update({
      status: 'completed',
      completed_steps: activity.total_steps,
      completed_at: new Date().toISOString(),
      time_to_complete_seconds: timeToComplete,
      generated_output: generatedOutput || null,
      updated_at: new Date().toISOString()
    })
    .eq('completion_id', completionId);

  if (error) {
    throw error;
  }
}

export async function abandonLiaActivity(completionId: string) {
  const supabase = await createClient();
  const { error } = await activityCompletionsTable(supabase)
    .update({ status: 'abandoned', updated_at: new Date().toISOString() })
    .eq('completion_id', completionId);

  if (error) {
    throw error;
  }
}
