import {
  getAssignmentProgress,
  getTeamMetadata,
  isAssignmentCompleted,
} from './analytics-aggregation.utils'
import { roundToTwoDecimals } from './analytics-math.utils'
import type { AnalyticsTransformContext } from './analytics-transform-context.utils'
import type {
  AnalyticsOrganizationNodeRecord,
  AnalyticsTeam,
  AnalyticsTeamsData,
} from './analytics.types'

export function buildTeamsAnalytics(
  nodes: AnalyticsOrganizationNodeRecord[],
  context: AnalyticsTransformContext,
): AnalyticsTeamsData {
  const teams: AnalyticsTeam[] = nodes.map((node) =>
    buildTeamAnalytics(node, context),
  )

  return {
    total_teams: teams.length,
    teams,
    ranking: [...teams].sort(
      (left, right) => right.stats.average_progress - left.stats.average_progress,
    ),
  }
}

function buildTeamAnalytics(
  node: AnalyticsOrganizationNodeRecord,
  context: AnalyticsTransformContext,
): AnalyticsTeam {
  const memberIds = (node.organization_node_users ?? []).map(
    (member) => member.user_id,
  )
  const assignments = memberIds.flatMap(
    (userId) => context.assignmentsByUser.get(userId) ?? [],
  )
  const lessonProgress = memberIds.flatMap(
    (userId) => context.lessonProgressByUser.get(userId) ?? [],
  )
  const { description, image_url } = getTeamMetadata(node)
  const totalProgress = assignments.reduce(
    (sum, assignment) =>
      sum + getAssignmentProgress(assignment, context.enrollmentMap),
    0,
  )

  return {
    team_id: node.id,
    name: node.name,
    description,
    image_url,
    member_count: memberIds.length,
    stats: {
      average_progress:
        assignments.length > 0
          ? roundToTwoDecimals(totalProgress / assignments.length)
          : 0,
      courses_completed: assignments.filter((assignment) =>
        isAssignmentCompleted(assignment, context.enrollmentMap),
      ).length,
      total_assignments: assignments.length,
      total_time_hours: roundToTwoDecimals(
        lessonProgress.reduce((sum, item) => sum + (item.time_spent_minutes ?? 0), 0) / 60,
      ),
      active_members: memberIds.filter((id) => context.activeUserIds.has(id)).length,
    },
  }
}
