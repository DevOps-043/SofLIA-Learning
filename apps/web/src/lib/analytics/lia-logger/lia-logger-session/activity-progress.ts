import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createClient } from '../../../supabase/server';
import type { ActivityProgress, ActivityStatus, LooseWriteRow } from '../lia-logger-events';
import { activityCompletionsTable } from '../lia-logger-events';

export async function updateLiaActivityProgress(
  completionId: string,
  progress: Partial<ActivityProgress> & { status?: ActivityStatus }
) {
  const supabase = await createClient();
  const updateData = createActivityProgressUpdate(progress);
  const { error } = await activityCompletionsTable(supabase)
    .update(updateData)
    .eq('completion_id', completionId);

  if (error) {
    throw error;
  }
}

export async function incrementLiaActivityRedirections(completionId: string) {
  const supabase = await createClient();
  const { data } = await activityCompletionsTable(supabase)
    .select('lia_had_to_redirect')
    .eq('completion_id', completionId)
    .single();

  if (!data) {
    return;
  }

  const { error } = await activityCompletionsTable(supabase)
    .update({
      lia_had_to_redirect: (data.lia_had_to_redirect || 0) + 1,
      updated_at: new Date().toISOString()
    })
    .eq('completion_id', completionId);

  if (error) {
    techDebtLogger.error('[SofLIALogger] Error incrementing redirections:', error);
  }
}

function createActivityProgressUpdate(
  progress: Partial<ActivityProgress> & { status?: ActivityStatus }
) {
  const updateData: LooseWriteRow = { updated_at: new Date().toISOString() };

  if (progress.completedSteps !== undefined) updateData.completed_steps = progress.completedSteps;
  if (progress.currentStep !== undefined) updateData.current_step = progress.currentStep;
  if (progress.totalSteps !== undefined) updateData.total_steps = progress.totalSteps;
  if (progress.generatedOutput !== undefined) updateData.generated_output = progress.generatedOutput;
  if (progress.status !== undefined) {
    updateData.status = progress.status;
    if (progress.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }
  }

  return updateData;
}
