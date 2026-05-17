import type { AdminSupabaseClient } from './client'

export async function checkAndCloseSession(
  supabase: AdminSupabaseClient,
  sessionId: string,
  completionMethod: string,
) {
  if (!sessionId) return

  const { data: pendingTrackings, error } = await supabase
    .from('lesson_tracking')
    .select('id')
    .eq('session_id', sessionId)
    .eq('status', 'in_progress')

  if (error) {
    console.error('Error verificando trackings pendientes:', error)
    return
  }

  if (!pendingTrackings || pendingTrackings.length === 0) {
    const now = new Date()

    await supabase
      .from('study_sessions')
      .update({
        status: 'completed',
        completed_at: now.toISOString(),
        completion_method: completionMethod,
        updated_at: now.toISOString(),
      })
      .eq('id', sessionId)
      .eq('status', 'in_progress')

    console.log(`Sesion ${sessionId} cerrada automaticamente`)
  }
}
