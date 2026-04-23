import { runDeleteEqPlans, runDeleteInPlans } from './delete-helpers'
import type { CourseHierarchyIds, SupabaseClient } from './types'

export async function deleteWorkshopTeamRecords(
  supabase: SupabaseClient,
  workshopId: string,
  ids: CourseHierarchyIds,
) {
  await runDeleteInPlans(supabase, [
    { tableName: 'work_team_course_assignments', column: 'team_id', values: ids.teamIds, label: 'las asignaciones de equipos del taller' },
    { tableName: 'work_team_feedback', column: 'team_id', values: ids.teamIds, label: 'la retroalimentacion de equipos del taller' },
    { tableName: 'work_team_messages', column: 'team_id', values: ids.teamIds, label: 'los mensajes de equipos del taller' },
    { tableName: 'work_team_objectives', column: 'team_id', values: ids.teamIds, label: 'los objetivos de equipos del taller' },
    { tableName: 'work_team_statistics', column: 'team_id', values: ids.teamIds, label: 'las estadisticas de equipos del taller' },
    { tableName: 'work_team_members', column: 'team_id', values: ids.teamIds, label: 'los miembros de equipos del taller' },
  ])

  await runDeleteEqPlans(supabase, [
    { tableName: 'work_teams', column: 'course_id', value: workshopId, label: 'los equipos de trabajo del taller' },
  ])
}
