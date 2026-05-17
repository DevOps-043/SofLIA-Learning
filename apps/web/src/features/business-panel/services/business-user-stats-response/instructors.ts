import type { BusinessUserStatsInstructorRecord } from '../business-user-stats-query.service'

export type BusinessUserStatsInstructorMap = Map<
  string,
  { name: string; username: string | null }
>

export function createInstructorMap(
  records: BusinessUserStatsInstructorRecord[],
): BusinessUserStatsInstructorMap {
  return records.reduce((map, instructor) => {
    const fullName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim()
    map.set(instructor.id, {
      name: fullName || instructor.username || 'Instructor',
      username: instructor.username,
    })
    return map
  }, new Map<string, { name: string; username: string | null }>())
}
