import { csvEscape } from './analytics-math.utils'
import type {
  AnalyticsExportScope,
  BusinessAnalyticsData,
} from './analytics.types'

type CsvCell = string | number | null

export function buildAnalyticsCsv(
  data: BusinessAnalyticsData,
  scope: AnalyticsExportScope,
) {
  if (scope === 'summary') return toCsv(buildSummaryRows(data))
  if (scope === 'teams') return toCsv(buildTeamRows(data))
  return toCsv(buildUserRows(data))
}

function buildSummaryRows(data: BusinessAnalyticsData): CsvCell[][] {
  return [
    ['metric', 'value'],
    ['organization_name', data.organization.name],
    ['total_users', data.general_metrics.total_users],
    ['active_users', data.general_metrics.active_users],
    ['total_courses_assigned', data.general_metrics.total_courses_assigned],
    ['completed_courses', data.general_metrics.completed_courses],
    ['average_progress', data.general_metrics.average_progress],
    ['total_time_hours', data.general_metrics.total_time_hours],
    ['total_certificates', data.general_metrics.total_certificates],
    ['retention_rate', data.general_metrics.retention_rate],
  ]
}

function buildTeamRows(data: BusinessAnalyticsData): CsvCell[][] {
  return [
    [
      'team_id',
      'name',
      'member_count',
      'active_members',
      'average_progress',
      'courses_completed',
      'total_assignments',
      'total_time_hours',
    ],
    ...data.teams.teams.map((team) => [
      team.team_id,
      team.name,
      team.member_count,
      team.stats.active_members,
      team.stats.average_progress,
      team.stats.courses_completed,
      team.stats.total_assignments,
      team.stats.total_time_hours,
    ]),
  ]
}

function buildUserRows(data: BusinessAnalyticsData): CsvCell[][] {
  return [
    [
      'user_id',
      'display_name',
      'email',
      'role',
      'courses_assigned',
      'courses_completed',
      'average_progress',
      'total_time_hours',
      'certificates_count',
      'last_login_at',
      'last_active',
    ],
    ...data.user_analytics.map((user) => [
      user.user_id,
      user.display_name,
      user.email,
      user.role,
      user.courses_assigned,
      user.courses_completed,
      user.average_progress,
      user.total_time_hours,
      user.certificates_count,
      user.last_login_at,
      user.last_active,
    ]),
  ]
}

function toCsv(rows: CsvCell[][]) {
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n')
}
