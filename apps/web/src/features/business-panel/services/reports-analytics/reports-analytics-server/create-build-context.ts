import type { ReportsAnalyticsFilters } from '../../../types/reports-analytics.types'
import { mapUserDimension } from './map-user-dimension'
import { matchesDimensionFilters } from './matches-dimension-filters'
import type { AnalyticsQueryData } from './analytics-query-data'
import type { BuildContext } from './build-context'
import type { MutableCourseStats } from './mutable-course-stats'
import type { MutableUserStats } from './mutable-user-stats'
import type { UserDimension } from './user-dimension'

export function createBuildContext(
  queryData: Pick<AnalyticsQueryData, 'organizationUsers' | 'regions' | 'zones' | 'teams'>,
  filters: ReportsAnalyticsFilters,
): BuildContext {
  const regions = new Map(queryData.regions.filter((region) => region.is_active !== false).map((region) => [region.id, region]))
  const zones = new Map(queryData.zones.filter((zone) => zone.is_active !== false).map((zone) => [zone.id, zone]))
  const teams = new Map(queryData.teams.filter((team) => team.is_active !== false).map((team) => [team.id, team]))
  const dimensions = queryData.organizationUsers
    .map((record) => mapUserDimension(record, { regions, zones, teams }))
    .filter((dimension): dimension is UserDimension => Boolean(dimension))
    .filter((dimension) => dimension.status !== 'removed')
    .filter((dimension) => matchesDimensionFilters(dimension, filters))

  const users = new Map<string, MutableUserStats>()
  dimensions.forEach((dimension) => {
    users.set(dimension.userId, {
      detail: {
        userId: dimension.userId,
        displayName: dimension.displayName,
        email: dimension.email,
        status: dimension.status,
        role: dimension.role,
        jobTitle: dimension.jobTitle,
        gender: dimension.gender,
        dateOfBirth: dimension.dateOfBirth,
        age: dimension.age,
        ageBand: dimension.ageBand,
        lastConnectionAt: dimension.lastConnectionAt,
        regionId: dimension.regionId,
        regionName: dimension.regionName,
        zoneId: dimension.zoneId,
        zoneName: dimension.zoneName,
        teamId: dimension.teamId,
        teamName: dimension.teamName,
        coursesAssigned: 0,
        coursesCompleted: 0,
        averageCompletionDays: 0,
        averageProgress: 0,
        overdueAssignments: 0,
        completedLessons: 0,
        timeSpentMinutes: 0,
        sofliaConversations: 0,
        sofliaMessages: 0,
        notesCreated: 0,
        activitiesCompleted: 0,
        activityAttempts: 0,
        quizAttempts: 0,
        quizAverageScore: 0,
        plannedSessions: 0,
        completedSessions: 0,
        missedSessions: 0,
        plannerAdherenceRate: 0,
        lastActivityAt: null,
        qualityScore: 0,
      },
      assignedCourseIds: new Set<string>(),
      completedCourseIds: new Set<string>(),
      progressByCourse: new Map<string, number>(),
      completionDays: [],
      quizScores: [],
      activityQualityScores: [],
      sofliaQualityScores: [],
      notesQualityScores: [],
      plannedMinutes: [],
      actualMinutes: [],
      lastActivityDates: [],
      completedTrendCourseIds: new Set<string>(),
    })
  })

  return {
    users,
    dimensions,
    courses: new Map<string, MutableCourseStats>(),
    regions,
    zones,
    teams,
    completionTrendCounts: new Map<string, number>(),
    filters,
    aiSamples: [],
  }
}
