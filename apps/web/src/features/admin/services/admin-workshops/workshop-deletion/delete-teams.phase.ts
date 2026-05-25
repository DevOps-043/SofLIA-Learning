import { deleteByEqBatch, deleteByInBatch } from './delete-batches'
import type { SupabaseClient, WorkshopDeletionContext } from './types'

export async function deleteWorkshopTeamData(
  supabase: SupabaseClient,
  context: WorkshopDeletionContext,
) {
  await deleteByInBatch(supabase, [
    { table: 'work_team_course_assignments', column: 'team_id', values: context.teamIds, label: 'las asignaciones de equipos del taller', optional: true },
    { table: 'work_team_feedback', column: 'team_id', values: context.teamIds, label: 'la retroalimentacion de equipos del taller', optional: true },
    { table: 'work_team_messages', column: 'team_id', values: context.teamIds, label: 'los mensajes de equipos del taller', optional: true },
    { table: 'work_team_objectives', column: 'team_id', values: context.teamIds, label: 'los objetivos de equipos del taller', optional: true },
    { table: 'work_team_statistics', column: 'team_id', values: context.teamIds, label: 'las estadisticas de equipos del taller', optional: true },
    { table: 'work_team_members', column: 'team_id', values: context.teamIds, label: 'los miembros de equipos del taller', optional: true },
  ])
  await deleteByEqBatch(supabase, [
    { table: 'work_teams', column: 'course_id', value: context.workshopId, label: 'los equipos de trabajo del taller', optional: true },
  ])
}
