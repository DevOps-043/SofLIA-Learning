import { deleteOptionalByEq, deleteOptionalByIn } from './delete-helpers'
import type { SupabaseClient } from './types'

const TEAM_TABLES = [
  ['work_team_course_assignments', 'las asignaciones de equipos del taller'],
  ['work_team_feedback', 'la retroalimentacion de equipos del taller'],
  ['work_team_messages', 'los mensajes de equipos del taller'],
  ['work_team_objectives', 'los objetivos de equipos del taller'],
  ['work_team_statistics', 'las estadisticas de equipos del taller'],
  ['work_team_members', 'los miembros de equipos del taller'],
] as const

export async function deleteTeamData(
  supabase: SupabaseClient,
  teamIds: string[],
  workshopId: string,
) {
  for (const [tableName, label] of TEAM_TABLES) {
    await deleteOptionalByIn(supabase, tableName, 'team_id', teamIds, { label })
  }

  await deleteOptionalByEq(supabase, 'work_teams', 'course_id', workshopId, {
    label: 'los equipos de trabajo del taller',
  })
}
