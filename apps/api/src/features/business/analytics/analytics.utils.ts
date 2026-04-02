import type {
  AnalyticsCourseAssignmentRecord,
  AnalyticsCourseEnrollmentRecord,
  AnalyticsDailyProgressRecord,
  AnalyticsDurationPoint,
  AnalyticsExportScope,
  AnalyticsHeatmapPoint,
  AnalyticsOrganizationNodeRecord,
  AnalyticsOrganizationUserRecord,
  AnalyticsSourceData,
  AnalyticsStickinessPoint,
  AnalyticsStudySessionRecord,
  AnalyticsStreakPoint,
  AnalyticsTeamsData,
  AnalyticsTrendData,
  AnalyticsUser,
  AnalyticsUserProfileRecord,
  AnalyticsUserProfileRelation,
  BusinessAnalyticsData,
  AnalyticsFrequencyPoint,
  AnalyticsTeam,
} from './analytics.types'

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100
}

function roundToWhole(value: number) {
  return Math.round(value)
}

function sortByDateDesc<T>(items: T[], valueSelector: (item: T) => string | null) {
  return [...items].sort((left, right) => {
    const leftDate = valueSelector(left)
    const rightDate = valueSelector(right)

    return new Date(rightDate || 0).getTime() - new Date(leftDate || 0).getTime()
  })
}

function getUserProfile(
  relation: AnalyticsUserProfileRelation,
): AnalyticsUserProfileRecord | null {
  if (!relation) {
    return null
  }

  return Array.isArray(relation) ? relation[0] ?? null : relation
}

function groupByUserId<T extends { user_id: string }>(items: T[]) {
  return items.reduce((map, item) => {
    const groupedItems = map.get(item.user_id)
    if (groupedItems) {
      groupedItems.push(item)
    } else {
      map.set(item.user_id, [item])
    }
    return map
  }, new Map<string, T[]>())
}

function buildEnrollmentKey(userId: string, courseId: string) {
  return `${userId}:${courseId}`
}

function buildEnrollmentMap(enrollments: AnalyticsCourseEnrollmentRecord[]) {
  return enrollments.reduce((map, enrollment) => {
    map.set(buildEnrollmentKey(enrollment.user_id, enrollment.course_id), enrollment)
    return map
  }, new Map<string, AnalyticsCourseEnrollmentRecord>())
}

function getAssignmentProgress(
  assignment: AnalyticsCourseAssignmentRecord,
  enrollmentMap: Map<string, AnalyticsCourseEnrollmentRecord>,
) {
  return Number(
    enrollmentMap.get(buildEnrollmentKey(assignment.user_id, assignment.course_id))
      ?.overall_progress_percentage ??
      assignment.completion_percentage ??
      0,
  )
}

function isAssignmentCompleted(
  assignment: AnalyticsCourseAssignmentRecord,
  enrollmentMap: Map<string, AnalyticsCourseEnrollmentRecord>,
) {
  const enrollment = enrollmentMap.get(
    buildEnrollmentKey(assignment.user_id, assignment.course_id),
  )

  return (
    assignment.status === 'completed' ||
    enrollment?.enrollment_status === 'completed' ||
    getAssignmentProgress(assignment, enrollmentMap) >= 100
  )
}

function processTrend(
  value: string | null,
  targetMap: Map<string, number>,
  count = 1,
) {
  if (!value) {
    return
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return
  }

  const key = date.toISOString().slice(0, 7)
  targetMap.set(key, (targetMap.get(key) ?? 0) + count)
}

function formatTrendMap(map: Map<string, number>): AnalyticsTrendData[] {
  return Array.from(map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-6)
}

function calculateStickiness(
  dailyProgress: AnalyticsDailyProgressRecord[],
): AnalyticsStickinessPoint[] {
  if (dailyProgress.length === 0) {
    return []
  }

  const weeks = new Map<string, Set<string>>()
  const monthUsers = new Set<string>()

  for (const entry of dailyProgress) {
    if (!entry.had_activity) {
      continue
    }

    monthUsers.add(entry.user_id)
    const date = new Date(entry.progress_date)
    if (Number.isNaN(date.getTime())) {
      continue
    }

    const weekStart = new Date(date)
    weekStart.setUTCDate(date.getUTCDate() - date.getUTCDay())
    const weekKey = weekStart.toISOString().split('T')[0]

    const weekUsers = weeks.get(weekKey) ?? new Set<string>()
    weekUsers.add(entry.user_id)
    weeks.set(weekKey, weekUsers)
  }

  const mau = monthUsers.size

  return Array.from(weeks.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-12)
    .map(([week, users]) => ({
      name: new Date(week).toLocaleDateString('es-MX', {
        month: 'short',
        day: 'numeric',
      }),
      dau: users.size,
      mau,
      ratio: mau > 0 ? roundToWhole((users.size / mau) * 100) : 0,
    }))
}

function calculateFrequency(
  dailyProgress: AnalyticsDailyProgressRecord[],
  activeSinceDate: string,
): AnalyticsFrequencyPoint[] {
  const daysByUser = new Map<string, number>()

  for (const entry of dailyProgress) {
    if (!entry.had_activity || entry.progress_date < activeSinceDate) {
      continue
    }

    daysByUser.set(entry.user_id, (daysByUser.get(entry.user_id) ?? 0) + 1)
  }

  return [
    { name: '1-2 dias', min: 1, max: 2 },
    { name: '3-5 dias', min: 3, max: 5 },
    { name: '6-10 dias', min: 6, max: 10 },
    { name: '11-20 dias', min: 11, max: 20 },
    { name: '21+ dias', min: 21, max: Number.POSITIVE_INFINITY },
  ]
    .map((range) => ({
      name: range.name,
      users: Array.from(daysByUser.values()).filter(
        (count) => count >= range.min && count <= range.max,
      ).length,
    }))
    .filter((entry) => entry.users > 0)
}

function calculateStreaks(
  dailyProgress: AnalyticsDailyProgressRecord[],
  userIds: string[],
): AnalyticsStreakPoint[] {
  const streaksByUser = new Map<string, number>()

  for (const userId of userIds) {
    streaksByUser.set(userId, 0)
  }

  for (const entry of dailyProgress) {
    if (!streaksByUser.has(entry.user_id)) {
      continue
    }

    if ((streaksByUser.get(entry.user_id) ?? 0) === 0 && (entry.streak_count ?? 0) > 0) {
      streaksByUser.set(entry.user_id, entry.streak_count ?? 0)
    }
  }

  const streakValues = Array.from(streaksByUser.values())
  const total = streakValues.length || 1

  return [
    {
      name: 'Sin racha',
      value: roundToWhole((streakValues.filter((value) => value === 0).length / total) * 100),
    },
    {
      name: '1-3 dias',
      value: roundToWhole(
        (streakValues.filter((value) => value >= 1 && value <= 3).length / total) * 100,
      ),
    },
    {
      name: '4-7 dias',
      value: roundToWhole(
        (streakValues.filter((value) => value >= 4 && value <= 7).length / total) * 100,
      ),
    },
    {
      name: '8+ dias',
      value: roundToWhole((streakValues.filter((value) => value >= 8).length / total) * 100),
    },
  ]
}

function calculateHeatmap(
  studySessions: AnalyticsStudySessionRecord[],
): AnalyticsHeatmapPoint[] {
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
  const ranges = new Map<string, number>()

  for (const session of studySessions) {
    if (!session.start_time) {
      continue
    }

    const date = new Date(session.start_time)
    if (Number.isNaN(date.getTime())) {
      continue
    }

    const hour = date.getUTCHours()
    let range = '06-09'
    if (hour >= 21) range = '21-24'
    else if (hour >= 18) range = '18-21'
    else if (hour >= 15) range = '15-18'
    else if (hour >= 12) range = '12-15'
    else if (hour >= 9) range = '09-12'

    const key = `${dayNames[date.getUTCDay()]}_${range}`
    ranges.set(key, (ranges.get(key) ?? 0) + 1)
  }

  return Array.from(ranges.entries()).map(([key, value]) => {
    const [day, hour] = key.split('_')
    return { day, hour, value }
  })
}

function calculateDuration(
  studySessions: AnalyticsStudySessionRecord[],
  orgUsers: AnalyticsOrganizationUserRecord[],
): AnalyticsDurationPoint[] {
  const roleByUser = new Map<string, string>()
  for (const user of orgUsers) {
    roleByUser.set(user.user_id, user.job_title || user.role || 'member')
  }

  const durationsByRole = new Map<string, number[]>()

  for (const session of studySessions) {
    if (!session.actual_duration_minutes || session.actual_duration_minutes <= 0) {
      continue
    }

    const role = roleByUser.get(session.user_id) || 'member'
    const durations = durationsByRole.get(role) ?? []
    durations.push(session.actual_duration_minutes)
    durationsByRole.set(role, durations)
  }

  return Array.from(durationsByRole.entries()).map(([role, durations]) => {
    const sortedDurations = [...durations].sort((left, right) => left - right)
    const median =
      sortedDurations.length > 0
        ? sortedDurations[Math.floor(sortedDurations.length / 2)]
        : 0
    const max =
      sortedDurations.length > 0
        ? sortedDurations[sortedDurations.length - 1]
        : 0

    return {
      role,
      median: roundToWhole(median),
      max: roundToWhole(max),
      count: durations.length,
    }
  })
}

function getLatestStreak(userDailyProgress: AnalyticsDailyProgressRecord[]) {
  return sortByDateDesc(userDailyProgress, (entry) => entry.progress_date)[0]?.streak_count ?? 0
}

function getLastActive(userDailyProgress: AnalyticsDailyProgressRecord[]) {
  return sortByDateDesc(userDailyProgress, (entry) => entry.progress_date).find(
    (entry) => entry.had_activity,
  )?.progress_date ?? null
}

function getTeamMetadata(node: AnalyticsOrganizationNodeRecord) {
  const properties =
    node.properties && typeof node.properties === 'object' && !Array.isArray(node.properties)
      ? node.properties
      : {}

  return {
    description:
      typeof properties.description === 'string' ? properties.description : null,
    image_url: typeof properties.image_url === 'string' ? properties.image_url : null,
  }
}

function csvEscape(value: string | number | null | undefined) {
  const normalizedValue = value == null ? '' : String(value)
  const escapedValue = normalizedValue.replace(/"/g, '""')
  return `"${escapedValue}"`
}

export function getEmptyBusinessAnalyticsData(
  organization: AnalyticsSourceData['organization'],
): BusinessAnalyticsData {
  return {
    organization,
    general_metrics: {
      total_users: 0,
      total_courses_assigned: 0,
      completed_courses: 0,
      average_progress: 0,
      total_time_hours: 0,
      total_certificates: 0,
      active_users: 0,
      retention_rate: 0,
    },
    user_analytics: [],
    trends: {
      enrollments_by_month: [],
      completions_by_month: [],
      time_by_month: [],
      active_users_by_month: [],
    },
    by_role: {
      distribution: [],
      progress_comparison: [],
      completions: [],
      time_spent: [],
    },
    course_metrics: {
      distribution: [],
    },
    engagement_metrics: {
      stickiness: [],
      frequency: [],
      streaks: [],
      heatmap: [],
      duration: [],
    },
    teams: {
      total_teams: 0,
      teams: [],
      ranking: [],
    },
  }
}

export function buildBusinessAnalyticsData(
  source: AnalyticsSourceData,
): BusinessAnalyticsData {
  if (source.orgUsers.length === 0) {
    return getEmptyBusinessAnalyticsData(source.organization)
  }

  const enrollmentMap = buildEnrollmentMap(source.enrollments)
  const assignmentsByUser = groupByUserId(source.assignments)
  const certificatesByUser = groupByUserId(source.certificates)
  const lessonProgressByUser = groupByUserId(source.lessonProgress)
  const dailyProgressByUser = groupByUserId(source.dailyProgress)
  const studySessionsByUser = groupByUserId(source.studySessions)
  const activeUserIds = new Set(
    source.dailyProgress
      .filter((entry) => entry.had_activity && entry.progress_date >= source.activeSinceDate)
      .map((entry) => entry.user_id),
  )

  const userAnalytics: AnalyticsUser[] = source.orgUsers.map((organizationUser) => {
    const profile = getUserProfile(organizationUser.users)
    const userAssignments = assignmentsByUser.get(organizationUser.user_id) ?? []
    const userCertificates = certificatesByUser.get(organizationUser.user_id) ?? []
    const userLessonProgress = lessonProgressByUser.get(organizationUser.user_id) ?? []
    const userDailyProgress = dailyProgressByUser.get(organizationUser.user_id) ?? []
    const userStudySessions = studySessionsByUser.get(organizationUser.user_id) ?? []
    const totalProgress = userAssignments.reduce(
      (sum, assignment) => sum + getAssignmentProgress(assignment, enrollmentMap),
      0,
    )
    const totalTimeMinutes = userLessonProgress.reduce(
      (sum, item) => sum + (item.time_spent_minutes ?? 0),
      0,
    )
    const completedSessions = userStudySessions.filter(
      (session) => session.status === 'completed',
    ).length
    const completedCourses = userAssignments.filter((assignment) =>
      isAssignmentCompleted(assignment, enrollmentMap),
    ).length
    const lastActive = getLastActive(userDailyProgress)
    const totalSessions = userStudySessions.length

    return {
      user_id: organizationUser.user_id,
      display_name:
        profile?.display_name ||
        profile?.first_name ||
        profile?.email?.split('@')[0] ||
        'Usuario',
      email: profile?.email ?? '',
      username: profile?.username ?? '',
      role: organizationUser.job_title || organizationUser.role || 'member',
      profile_picture_url: profile?.profile_picture_url ?? null,
      courses_assigned: userAssignments.length,
      courses_completed: completedCourses,
      average_progress:
        userAssignments.length > 0
          ? roundToTwoDecimals(totalProgress / userAssignments.length)
          : 0,
      total_time_hours: roundToTwoDecimals(totalTimeMinutes / 60),
      total_time_minutes: totalTimeMinutes,
      certificates_count: userCertificates.length,
      last_login_at: profile?.last_login_at ?? null,
      last_active: lastActive ?? profile?.last_login_at ?? null,
      joined_at: organizationUser.joined_at,
      stats: {
        current_streak: getLatestStreak(userDailyProgress),
        planner: {
          adherence:
            totalSessions > 0 ? roundToWhole((completedSessions / totalSessions) * 100) : 0,
          total_sessions: totalSessions,
          completed_sessions: completedSessions,
          pending_sessions: totalSessions - completedSessions,
        },
        courses: {
          total_lesson_time_minutes: totalTimeMinutes,
          lessons_completed: userLessonProgress.filter((item) => item.is_completed).length,
          quizzes_completed: userLessonProgress.filter((item) => item.quiz_completed).length,
          quizzes_passed: userLessonProgress.filter((item) => item.quiz_passed).length,
        },
      },
    }
  })

  const totalCoursesAssigned = source.assignments.length
  const completedCourses = source.assignments.filter((assignment) =>
    isAssignmentCompleted(assignment, enrollmentMap),
  ).length
  const totalProgress = source.assignments.reduce(
    (sum, assignment) => sum + getAssignmentProgress(assignment, enrollmentMap),
    0,
  )
  const totalTimeMinutes = source.lessonProgress.reduce(
    (sum, progress) => sum + (progress.time_spent_minutes ?? 0),
    0,
  )

  const roleDistribution = new Map<string, number>()
  const roleProgress = new Map<string, { sum: number; count: number }>()
  const roleCompletions = new Map<string, number>()
  const roleTime = new Map<string, { sum: number; count: number }>()
  const roleByUserId = new Map<string, string>()

  for (const user of userAnalytics) {
    roleByUserId.set(user.user_id, user.role)
    roleDistribution.set(user.role, (roleDistribution.get(user.role) ?? 0) + 1)
    roleProgress.set(user.role, {
      sum: (roleProgress.get(user.role)?.sum ?? 0) + user.average_progress,
      count: (roleProgress.get(user.role)?.count ?? 0) + 1,
    })
    roleCompletions.set(
      user.role,
      (roleCompletions.get(user.role) ?? 0) + user.courses_completed,
    )
    roleTime.set(user.role, {
      sum: (roleTime.get(user.role)?.sum ?? 0) + user.total_time_hours,
      count: (roleTime.get(user.role)?.count ?? 0) + 1,
    })
  }

  const enrollmentsByMonth = new Map<string, number>()
  const completionsByMonth = new Map<string, number>()
  const timeByMonth = new Map<string, number>()
  const activeUsersByMonth = new Map<string, Set<string>>()

  for (const assignment of source.assignments) {
    processTrend(assignment.assigned_at, enrollmentsByMonth)
    if (isAssignmentCompleted(assignment, enrollmentMap)) {
      processTrend(assignment.completed_at, completionsByMonth)
    }
  }

  for (const progress of source.lessonProgress) {
    processTrend(
      progress.completed_at ?? progress.last_accessed_at,
      timeByMonth,
      progress.time_spent_minutes ?? 0,
    )
  }

  for (const entry of source.dailyProgress) {
    if (!entry.had_activity) {
      continue
    }

    const monthKey = entry.progress_date.slice(0, 7)
    const users = activeUsersByMonth.get(monthKey) ?? new Set<string>()
    users.add(entry.user_id)
    activeUsersByMonth.set(monthKey, users)
  }

  const distributionByStatus = new Map<string, number>()
  for (const assignment of source.assignments) {
    const progress = getAssignmentProgress(assignment, enrollmentMap)
    const status = isAssignmentCompleted(assignment, enrollmentMap)
      ? 'completed'
      : progress > 0
        ? 'in_progress'
        : 'not_started'

    distributionByStatus.set(status, (distributionByStatus.get(status) ?? 0) + 1)
  }

  const teams = buildTeamsAnalytics(
    source.nodes,
    assignmentsByUser,
    lessonProgressByUser,
    activeUserIds,
    enrollmentMap,
  )

  return {
    organization: source.organization,
    general_metrics: {
      total_users: source.orgUsers.length,
      total_courses_assigned: totalCoursesAssigned,
      completed_courses: completedCourses,
      average_progress:
        totalCoursesAssigned > 0 ? roundToTwoDecimals(totalProgress / totalCoursesAssigned) : 0,
      total_time_hours: roundToTwoDecimals(totalTimeMinutes / 60),
      total_certificates: source.certificates.length,
      active_users: activeUserIds.size,
      retention_rate:
        source.orgUsers.length > 0
          ? roundToWhole((activeUserIds.size / source.orgUsers.length) * 100)
          : 0,
    },
    user_analytics: userAnalytics,
    trends: {
      enrollments_by_month: formatTrendMap(enrollmentsByMonth),
      completions_by_month: formatTrendMap(completionsByMonth),
      time_by_month: formatTrendMap(timeByMonth).map((entry) => ({
        ...entry,
        count: roundToTwoDecimals(entry.count / 60),
      })),
      active_users_by_month: Array.from(activeUsersByMonth.entries())
        .map(([date, users]) => ({ date, count: users.size }))
        .sort((left, right) => left.date.localeCompare(right.date)),
    },
    by_role: {
      distribution: Array.from(roleDistribution.entries()).map(([role, count]) => ({
        role,
        count,
      })),
      progress_comparison: Array.from(roleProgress.entries()).map(([role, entry]) => ({
        role,
        average_progress: entry.count > 0 ? roundToTwoDecimals(entry.sum / entry.count) : 0,
      })),
      completions: Array.from(roleCompletions.entries()).map(([role, totalCompleted]) => ({
        role,
        total_completed: totalCompleted,
      })),
      time_spent: Array.from(roleTime.entries()).map(([role, entry]) => ({
        role,
        average_hours: entry.count > 0 ? roundToTwoDecimals(entry.sum / entry.count) : 0,
      })),
    },
    course_metrics: {
      distribution: Array.from(distributionByStatus.entries()).map(([status, count]) => ({
        status,
        count,
      })),
    },
    engagement_metrics: {
      stickiness: calculateStickiness(source.dailyProgress),
      frequency: calculateFrequency(source.dailyProgress, source.activeSinceDate),
      streaks: calculateStreaks(
        source.dailyProgress,
        source.orgUsers.map((user) => user.user_id),
      ),
      heatmap: calculateHeatmap(source.studySessions),
      duration: calculateDuration(source.studySessions, source.orgUsers),
    },
    teams,
  }
}

function buildTeamsAnalytics(
  nodes: AnalyticsOrganizationNodeRecord[],
  assignmentsByUser: Map<string, AnalyticsCourseAssignmentRecord[]>,
  lessonProgressByUser: Map<string, AnalyticsSourceData['lessonProgress']>,
  activeUserIds: Set<string>,
  enrollmentMap: Map<string, AnalyticsCourseEnrollmentRecord>,
): AnalyticsTeamsData {
  const teams: AnalyticsTeam[] = nodes.map((node) => {
    const memberIds = (node.organization_node_users ?? []).map((member) => member.user_id)
    const teamAssignments = memberIds.flatMap((userId) => assignmentsByUser.get(userId) ?? [])
    const teamLessonProgress = memberIds.flatMap(
      (userId) => lessonProgressByUser.get(userId) ?? [],
    )
    const { description, image_url } = getTeamMetadata(node)
    const totalProgress = teamAssignments.reduce(
      (sum, assignment) => sum + getAssignmentProgress(assignment, enrollmentMap),
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
          teamAssignments.length > 0 ? roundToTwoDecimals(totalProgress / teamAssignments.length) : 0,
        courses_completed: teamAssignments.filter((assignment) =>
          isAssignmentCompleted(assignment, enrollmentMap),
        ).length,
        total_assignments: teamAssignments.length,
        total_time_hours: roundToTwoDecimals(
          teamLessonProgress.reduce(
            (sum, progress) => sum + (progress.time_spent_minutes ?? 0),
            0,
          ) / 60,
        ),
        active_members: memberIds.filter((memberId) => activeUserIds.has(memberId)).length,
      },
    }
  })

  return {
    total_teams: teams.length,
    teams,
    ranking: [...teams].sort(
      (left, right) => right.stats.average_progress - left.stats.average_progress,
    ),
  }
}

export function buildAnalyticsCsv(
  data: BusinessAnalyticsData,
  scope: AnalyticsExportScope,
) {
  if (scope === 'summary') {
    const summaryRows = [
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

    return summaryRows.map((row) => row.map(csvEscape).join(',')).join('\n')
  }

  if (scope === 'teams') {
    const rows = [
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

    return rows.map((row) => row.map(csvEscape).join(',')).join('\n')
  }

  const rows = [
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

  return rows.map((row) => row.map(csvEscape).join(',')).join('\n')
}
