import JSZip from 'jszip'
import type {
  ReportsAnalyticsBreakdownItem,
  ReportsAnalyticsDataset,
  ReportsAnalyticsLocale,
  ReportsAnalyticsTrendPoint,
} from '../../types/reports-analytics.types'
import { buildCsv } from './reports-analytics.helpers'

const EXPORT_LABELS: Record<ReportsAnalyticsLocale, Record<string, string>> = {
  es: {
    title: 'Reporte ejecutivo de Analytics',
    generatedAt: 'Generado',
    period: 'Periodo',
    overview: 'Resumen ejecutivo',
    demographics: 'Demografia',
    learning: 'Aprendizaje',
    soflia: 'SofLIA',
    activities: 'Actividades',
    notes: 'Notas',
    planner: 'Planificacion',
    courses: 'Cursos con mayor riesgo',
    dataQuality: 'Calidad de datos',
    totalUsers: 'Usuarios totales',
    activeLearners: 'Usuarios activos',
    averageProgress: 'Progreso promedio',
    completionRate: 'Tasa de finalizacion',
    overdueAssignments: 'Asignaciones vencidas',
    sofliaAdoptionRate: 'Adopcion SofLIA',
    notesAdoptionRate: 'Adopcion de notas',
    activityCompletionRate: 'Finalizacion de actividades',
    plannerAdherenceRate: 'Cumplimiento de planificacion',
    quality: 'Calidad de respuestas',
    hierarchy: 'Cuadro de honor',
    segments: 'Segmentos',
    loginHeatmap: 'Mapa de calor de conexion',
  },
  en: {
    title: 'Executive Analytics Report',
    generatedAt: 'Generated',
    period: 'Period',
    overview: 'Executive summary',
    demographics: 'Demographics',
    learning: 'Learning',
    soflia: 'SofLIA',
    activities: 'Activities',
    notes: 'Notes',
    planner: 'Planning',
    courses: 'Highest-risk courses',
    dataQuality: 'Data quality',
    totalUsers: 'Total users',
    activeLearners: 'Active learners',
    averageProgress: 'Average progress',
    completionRate: 'Completion rate',
    overdueAssignments: 'Overdue assignments',
    sofliaAdoptionRate: 'SofLIA adoption',
    notesAdoptionRate: 'Notes adoption',
    activityCompletionRate: 'Activity completion',
    plannerAdherenceRate: 'Planning adherence',
    quality: 'Response quality',
    hierarchy: 'Leaderboard',
    segments: 'Segments',
    loginHeatmap: 'Connection heatmap',
  },
  pt: {
    title: 'Relatorio executivo de Analytics',
    generatedAt: 'Gerado',
    period: 'Periodo',
    overview: 'Resumo executivo',
    demographics: 'Demografia',
    learning: 'Aprendizagem',
    soflia: 'SofLIA',
    activities: 'Atividades',
    notes: 'Notas',
    planner: 'Planejamento',
    courses: 'Cursos de maior risco',
    dataQuality: 'Qualidade dos dados',
    totalUsers: 'Usuarios totais',
    activeLearners: 'Usuarios ativos',
    averageProgress: 'Progresso medio',
    completionRate: 'Taxa de conclusao',
    overdueAssignments: 'Atribuicoes vencidas',
    sofliaAdoptionRate: 'Adocao SofLIA',
    notesAdoptionRate: 'Adocao de notas',
    activityCompletionRate: 'Conclusao de atividades',
    plannerAdherenceRate: 'Cumprimento do planejamento',
    quality: 'Qualidade das respostas',
    hierarchy: 'Quadro de honra',
    segments: 'Segmentos',
    loginHeatmap: 'Mapa de calor de conexão',
  },
}

export async function generateReportsAnalyticsZip(dataset: ReportsAnalyticsDataset): Promise<Uint8Array> {
  const zip = new JSZip()

  zip.file('users_detail.csv', buildUsersDetailCsv(dataset))
  zip.file('demographics_summary.csv', buildBreakdownCsv([
    ...withCategory('gender', dataset.demographics.gender),
    ...withCategory('age_band', dataset.demographics.ageBands),
    ...withCategory('job_title', dataset.demographics.jobTitles),
    ...withCategory('role', dataset.demographics.roles),
  ]))
  zip.file('course_progress.csv', buildCourseProgressCsv(dataset))
  zip.file('learning_completion_trend.csv', buildTrendCsv(
    dataset.learning.completionsTrend,
    'completed_courses',
    dataset.filters.granularity,
  ))
  zip.file('soflia_usage.csv', buildSofliaCsv(dataset))
  zip.file('soflia_conversation_trend.csv', buildTrendCsv(
    dataset.soflia.conversationsTrend,
    'conversations',
    dataset.filters.granularity,
  ))
  zip.file('activity_responses.csv', buildActivitiesCsv(dataset))
  zip.file('notes_usage.csv', buildNotesCsv(dataset))
  zip.file('planner_adherence.csv', buildPlannerCsv(dataset))
  zip.file('connection_heatmap.csv', buildLoginHeatmapCsv(dataset))
  zip.file('connection_calendar.csv', buildConnectionCalendarCsv(dataset))
  zip.file('segment_analysis.csv', buildSegmentAnalysisCsv(dataset))
  zip.file('response_quality.csv', buildQualityCsv(dataset))
  zip.file('hierarchy_leaderboard.csv', buildHierarchyRankingCsv(dataset))
  zip.file('user_leaderboard.csv', buildUserRankingCsv(dataset))
  zip.file('ai_samples_redacted.csv', buildAiSamplesCsv(dataset))
  zip.file('data_quality.csv', buildBreakdownCsv(withCategory('missing_field', dataset.dataQuality.missingFields)))

  return zip.generateAsync({ type: 'uint8array' })
}

export async function generateReportsAnalyticsPdf(
  dataset: ReportsAnalyticsDataset,
  locale: ReportsAnalyticsLocale,
): Promise<Uint8Array> {
  const JsPDF = (await import('jspdf')).default
  const pdf = new JsPDF('p', 'pt', 'a4')
  const labels = EXPORT_LABELS[locale] || EXPORT_LABELS.es
  const page = {
    width: pdf.internal.pageSize.getWidth(),
    height: pdf.internal.pageSize.getHeight(),
    margin: 44,
  }
  let y = page.margin

  const ensureSpace = (height: number) => {
    if (y + height <= page.height - page.margin) return
    pdf.addPage()
    y = page.margin
  }

  const addHeading = (text: string, size = 16) => {
    ensureSpace(32)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(size)
    pdf.text(text, page.margin, y)
    y += size + 12
  }

  const addLine = (label: string, value: string | number) => {
    ensureSpace(22)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text(`${label}:`, page.margin, y)
    pdf.setFont('helvetica', 'normal')
    pdf.text(String(value), page.margin + 170, y)
    y += 18
  }

  const addBreakdown = (title: string, rows: ReportsAnalyticsBreakdownItem[], limit = 8) => {
    addHeading(title, 13)
    rows.slice(0, limit).forEach((row) => {
      addLine(row.label, `${row.value} (${row.percentage}%)`)
    })
  }

  addHeading(labels.title, 20)
  addLine(labels.generatedAt, new Date(dataset.generatedAt).toLocaleString(locale))
  addLine(labels.period, `${formatDate(dataset.period.from, locale)} - ${formatDate(dataset.period.to, locale)}`)

  addHeading(labels.overview)
  addLine(labels.totalUsers, dataset.overview.totalUsers)
  addLine(labels.activeLearners, `${dataset.overview.activeLearners} (${dataset.overview.activeLearnerRate}%)`)
  addLine(labels.averageProgress, `${dataset.overview.averageProgress}%`)
  addLine(labels.completionRate, `${dataset.overview.completionRate}%`)
  addLine(labels.overdueAssignments, dataset.overview.overdueAssignments)
  addLine(labels.sofliaAdoptionRate, `${dataset.overview.sofliaAdoptionRate}%`)
  addLine(labels.notesAdoptionRate, `${dataset.overview.notesAdoptionRate}%`)
  addLine(labels.activityCompletionRate, `${dataset.overview.activityCompletionRate}%`)
  addLine(labels.plannerAdherenceRate, `${dataset.overview.plannerAdherenceRate}%`)

  addBreakdown(labels.demographics, dataset.demographics.ageBands)
  addBreakdown(labels.learning, dataset.learning.progressDistribution)
  addBreakdown(labels.soflia, dataset.soflia.contextBreakdown)
  addBreakdown(labels.activities, dataset.activities.byType)
  addBreakdown(labels.planner, dataset.planner.byStatus)
  addHeading(labels.quality)
  addLine(labels.quality, `${dataset.quality.overallScore}%`)
  addLine(labels.quizAverageScore, `${dataset.quality.quizScore}%`)
  addLine(labels.activities, `${dataset.quality.activityScore}%`)
  addLine(labels.soflia, `${dataset.quality.sofliaScore}%`)
  addLine(labels.notes, `${dataset.quality.notesScore}%`)

  addHeading(labels.hierarchy)
  dataset.rankings.regions.slice(0, 5).forEach((row) => {
    addLine(row.name, `${row.rankScore}% (${row.users})`)
  })

  addHeading(labels.courses)
  dataset.courses.slice(0, 10).forEach((course) => {
    const line = `${course.courseTitle}: ${course.averageProgress}% progress, ${course.overdueAssignments} overdue, ${course.activeLearners} active`
    ensureSpace(22)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.splitTextToSize(line, page.width - page.margin * 2).forEach((part: string) => {
      pdf.text(part, page.margin, y)
      y += 14
    })
  })

  addBreakdown(labels.dataQuality, dataset.dataQuality.missingFields)

  return new Uint8Array(pdf.output('arraybuffer'))
}

export function buildReportsAnalyticsFilename(
  extension: 'zip' | 'pdf',
  dataset: Pick<ReportsAnalyticsDataset, 'period'>,
): string {
  const from = dataset.period.from.slice(0, 10)
  const to = dataset.period.to.slice(0, 10)
  return `soflia-analytics-${from}-${to}.${extension}`
}

function buildUsersDetailCsv(dataset: ReportsAnalyticsDataset): string {
  return buildCsv(
    dataset.userDetails.map((user) => ({
      user_id: user.userId,
      display_name: user.displayName,
      email: user.email,
      status: user.status,
      role: user.role,
      job_title: user.jobTitle,
      gender: user.gender,
      date_of_birth: user.dateOfBirth,
      age: user.age,
      age_band: user.ageBand,
      courses_assigned: user.coursesAssigned,
      courses_completed: user.coursesCompleted,
      average_progress: user.averageProgress,
      overdue_assignments: user.overdueAssignments,
      completed_lessons: user.completedLessons,
      time_spent_minutes: user.timeSpentMinutes,
      soflia_conversations: user.sofliaConversations,
      soflia_messages: user.sofliaMessages,
      notes_created: user.notesCreated,
      activities_completed: user.activitiesCompleted,
      activity_attempts: user.activityAttempts,
      quiz_attempts: user.quizAttempts,
      quiz_average_score: user.quizAverageScore,
      quality_score: user.qualityScore,
      average_completion_days: user.averageCompletionDays,
      last_connection_at: user.lastConnectionAt,
      region_name: user.regionName,
      zone_name: user.zoneName,
      team_name: user.teamName,
      planned_sessions: user.plannedSessions,
      completed_sessions: user.completedSessions,
      missed_sessions: user.missedSessions,
      planner_adherence_rate: user.plannerAdherenceRate,
      last_activity_at: user.lastActivityAt,
    })),
    [
      { key: 'user_id', header: 'user_id' },
      { key: 'display_name', header: 'display_name' },
      { key: 'email', header: 'email' },
      { key: 'status', header: 'status' },
      { key: 'role', header: 'role' },
      { key: 'job_title', header: 'job_title' },
      { key: 'gender', header: 'gender' },
      { key: 'date_of_birth', header: 'date_of_birth' },
      { key: 'age', header: 'age' },
      { key: 'age_band', header: 'age_band' },
      { key: 'courses_assigned', header: 'courses_assigned' },
      { key: 'courses_completed', header: 'courses_completed' },
      { key: 'average_progress', header: 'average_progress' },
      { key: 'overdue_assignments', header: 'overdue_assignments' },
      { key: 'completed_lessons', header: 'completed_lessons' },
      { key: 'time_spent_minutes', header: 'time_spent_minutes' },
      { key: 'soflia_conversations', header: 'soflia_conversations' },
      { key: 'soflia_messages', header: 'soflia_messages' },
      { key: 'notes_created', header: 'notes_created' },
      { key: 'activities_completed', header: 'activities_completed' },
      { key: 'activity_attempts', header: 'activity_attempts' },
      { key: 'quiz_attempts', header: 'quiz_attempts' },
      { key: 'quiz_average_score', header: 'quiz_average_score' },
      { key: 'quality_score', header: 'quality_score' },
      { key: 'average_completion_days', header: 'average_completion_days' },
      { key: 'last_connection_at', header: 'last_connection_at' },
      { key: 'region_name', header: 'region_name' },
      { key: 'zone_name', header: 'zone_name' },
      { key: 'team_name', header: 'team_name' },
      { key: 'planned_sessions', header: 'planned_sessions' },
      { key: 'completed_sessions', header: 'completed_sessions' },
      { key: 'missed_sessions', header: 'missed_sessions' },
      { key: 'planner_adherence_rate', header: 'planner_adherence_rate' },
      { key: 'last_activity_at', header: 'last_activity_at' },
    ],
  )
}

function buildLoginHeatmapCsv(dataset: ReportsAnalyticsDataset): string {
  return buildCsv(
    dataset.loginHeatmap.map((cell) => ({ ...cell })),
    [
      { key: 'dayKey', header: 'day' },
      { key: 'dayIndex', header: 'day_index' },
      { key: 'hour', header: 'hour' },
      { key: 'hourLabel', header: 'hour_label' },
      { key: 'value', header: 'connections' },
      { key: 'percentage', header: 'relative_intensity' },
    ],
  )
}

function buildConnectionCalendarCsv(dataset: ReportsAnalyticsDataset): string {
  return buildCsv(
    dataset.connectionCalendar.map((cell) => ({ ...cell })),
    [
      { key: 'date', header: 'date' },
      { key: 'dayKey', header: 'day' },
      { key: 'dayIndex', header: 'day_index' },
      { key: 'weekIndex', header: 'week_index' },
      { key: 'monthKey', header: 'month_key' },
      { key: 'monthLabel', header: 'month_label' },
      { key: 'value', header: 'last_connections' },
      { key: 'level', header: 'intensity_level' },
    ],
  )
}

function buildSegmentAnalysisCsv(dataset: ReportsAnalyticsDataset): string {
  return buildCsv(
    [
      ...withSegment('age_band', dataset.segments.ageBands),
      ...withSegment('gender', dataset.segments.gender),
      ...withSegment('job_title', dataset.segments.jobTitles),
      ...withSegment('role', dataset.segments.roles),
    ],
    [
      { key: 'segment_type', header: 'segment_type' },
      { key: 'key', header: 'key' },
      { key: 'label', header: 'label' },
      { key: 'users', header: 'users' },
      { key: 'averageProgress', header: 'average_progress' },
      { key: 'completionRate', header: 'completion_rate' },
      { key: 'averageCompletionDays', header: 'average_completion_days' },
      { key: 'sofliaAdoptionRate', header: 'soflia_adoption_rate' },
      { key: 'notesAdoptionRate', header: 'notes_adoption_rate' },
      { key: 'quizAverageScore', header: 'quiz_average_score' },
      { key: 'qualityScore', header: 'quality_score' },
    ],
  )
}

function buildQualityCsv(dataset: ReportsAnalyticsDataset): string {
  return buildCsv(
    [
      { metric: 'overall_score', value: dataset.quality.overallScore },
      { metric: 'quiz_score', value: dataset.quality.quizScore },
      { metric: 'activity_score', value: dataset.quality.activityScore },
      { metric: 'soflia_score', value: dataset.quality.sofliaScore },
      { metric: 'notes_score', value: dataset.quality.notesScore },
      { metric: 'quiz_pass_rate', value: dataset.quality.quizPassRate },
      { metric: 'help_rate', value: dataset.quality.helpRate },
      { metric: 'redirect_rate', value: dataset.quality.redirectRate },
      { metric: 'off_topic_rate', value: dataset.quality.offTopicRate },
      { metric: 'question_rate', value: dataset.quality.questionRate },
      { metric: 'average_response_time_seconds', value: dataset.quality.averageResponseTimeSeconds },
      { metric: 'average_sentiment', value: dataset.quality.averageSentiment },
      { metric: 'evidence_count', value: dataset.quality.evidenceCount },
    ],
    [
      { key: 'metric', header: 'metric' },
      { key: 'value', header: 'value' },
    ],
  )
}

function buildHierarchyRankingCsv(dataset: ReportsAnalyticsDataset): string {
  return buildCsv(
    [
      ...dataset.rankings.regions,
      ...dataset.rankings.zones,
      ...dataset.rankings.teams,
    ],
    [
      { key: 'type', header: 'type' },
      { key: 'id', header: 'id' },
      { key: 'name', header: 'name' },
      { key: 'regionName', header: 'region_name' },
      { key: 'zoneName', header: 'zone_name' },
      { key: 'users', header: 'users' },
      { key: 'averageProgress', header: 'average_progress' },
      { key: 'completionRate', header: 'completion_rate' },
      { key: 'averageCompletionDays', header: 'average_completion_days' },
      { key: 'sofliaAdoptionRate', header: 'soflia_adoption_rate' },
      { key: 'notesAdoptionRate', header: 'notes_adoption_rate' },
      { key: 'qualityScore', header: 'quality_score' },
      { key: 'overdueAssignments', header: 'overdue_assignments' },
      { key: 'rankScore', header: 'rank_score' },
    ],
  )
}

function buildUserRankingCsv(dataset: ReportsAnalyticsDataset): string {
  return buildCsv(
    dataset.rankings.users,
    [
      { key: 'userId', header: 'user_id' },
      { key: 'displayName', header: 'display_name' },
      { key: 'email', header: 'email' },
      { key: 'jobTitle', header: 'job_title' },
      { key: 'regionName', header: 'region_name' },
      { key: 'zoneName', header: 'zone_name' },
      { key: 'teamName', header: 'team_name' },
      { key: 'averageProgress', header: 'average_progress' },
      { key: 'completionRate', header: 'completion_rate' },
      { key: 'averageCompletionDays', header: 'average_completion_days' },
      { key: 'sofliaConversations', header: 'soflia_conversations' },
      { key: 'notesCreated', header: 'notes_created' },
      { key: 'quizAverageScore', header: 'quiz_average_score' },
      { key: 'qualityScore', header: 'quality_score' },
      { key: 'overdueAssignments', header: 'overdue_assignments' },
      { key: 'rankScore', header: 'rank_score' },
    ],
  )
}

function buildAiSamplesCsv(dataset: ReportsAnalyticsDataset): string {
  return buildCsv(
    dataset.aiSamples.map((sample) => ({
      source: sample.source,
      anonymous_user_id: sample.anonymousUserId,
      course_id: sample.courseId || '',
      course_title: sample.courseTitle || '',
      age_band: sample.segment?.ageBand || '',
      gender: sample.segment?.gender || '',
      job_title: sample.segment?.jobTitle || '',
      region_name: sample.segment?.regionName || '',
      zone_name: sample.segment?.zoneName || '',
      team_name: sample.segment?.teamName || '',
      text_excerpt: sample.text,
      signals: JSON.stringify(sample.signals),
    })),
    [
      { key: 'source', header: 'source' },
      { key: 'anonymous_user_id', header: 'anonymous_user_id' },
      { key: 'course_id', header: 'course_id' },
      { key: 'course_title', header: 'course_title' },
      { key: 'age_band', header: 'age_band' },
      { key: 'gender', header: 'gender' },
      { key: 'job_title', header: 'job_title' },
      { key: 'region_name', header: 'region_name' },
      { key: 'zone_name', header: 'zone_name' },
      { key: 'team_name', header: 'team_name' },
      { key: 'text_excerpt', header: 'redacted_text_excerpt' },
      { key: 'signals', header: 'signals' },
    ],
  )
}

function buildCourseProgressCsv(dataset: ReportsAnalyticsDataset): string {
  return buildCsv(
    dataset.courses.map((course) => ({ ...course })),
    [
      { key: 'courseId', header: 'course_id' },
      { key: 'courseTitle', header: 'course_title' },
      { key: 'assignedUsers', header: 'assigned_users' },
      { key: 'activeLearners', header: 'active_learners' },
      { key: 'completedUsers', header: 'completed_users' },
      { key: 'averageProgress', header: 'average_progress' },
      { key: 'overdueAssignments', header: 'overdue_assignments' },
      { key: 'notesCount', header: 'notes_count' },
      { key: 'sofliaConversations', header: 'soflia_conversations' },
      { key: 'activityCompletionRate', header: 'activity_completion_rate' },
      { key: 'quizAverageScore', header: 'quiz_average_score' },
    ],
  )
}

function buildSofliaCsv(dataset: ReportsAnalyticsDataset): string {
  return buildCsv(
    [
      {
        metric: 'total_conversations',
        value: dataset.soflia.totalConversations,
      },
      {
        metric: 'total_messages',
        value: dataset.soflia.totalMessages,
      },
      {
        metric: 'active_users',
        value: dataset.soflia.activeUsers,
      },
      {
        metric: 'average_messages_per_conversation',
        value: dataset.soflia.averageMessagesPerConversation,
      },
      {
        metric: 'completion_rate',
        value: dataset.soflia.completionRate,
      },
      ...withCategory('context', dataset.soflia.contextBreakdown).map((row) => ({
        metric: `context_${row.key}`,
        value: row.value,
      })),
    ],
    [
      { key: 'metric', header: 'metric' },
      { key: 'value', header: 'value' },
    ],
  )
}

function buildActivitiesCsv(dataset: ReportsAnalyticsDataset): string {
  return buildCsv(
    [
      { metric: 'total_activities', value: dataset.activities.totalActivities },
      { metric: 'completed_activities', value: dataset.activities.completedActivities },
      { metric: 'completion_rate', value: dataset.activities.completionRate },
      { metric: 'average_attempts', value: dataset.activities.averageAttempts },
      { metric: 'average_time_minutes', value: dataset.activities.averageTimeMinutes },
      { metric: 'users_needing_help', value: dataset.activities.usersNeedingHelp },
      { metric: 'redirects', value: dataset.activities.redirects },
      { metric: 'quiz_attempts', value: dataset.activities.quizAttempts },
      { metric: 'quiz_pass_rate', value: dataset.activities.quizPassRate },
      { metric: 'quiz_average_score', value: dataset.activities.quizAverageScore },
    ],
    [
      { key: 'metric', header: 'metric' },
      { key: 'value', header: 'value' },
    ],
  )
}

function buildNotesCsv(dataset: ReportsAnalyticsDataset): string {
  return buildCsv(
    [
      { metric: 'total_notes', value: dataset.notes.totalNotes },
      { metric: 'users_with_notes', value: dataset.notes.usersWithNotes },
      { metric: 'adoption_rate', value: dataset.notes.adoptionRate },
      { metric: 'auto_generated', value: dataset.notes.autoGenerated },
      { metric: 'manual', value: dataset.notes.manual },
      ...withCategory('course', dataset.notes.byCourse).map((row) => ({
        metric: `course_${row.key}`,
        value: row.value,
      })),
    ],
    [
      { key: 'metric', header: 'metric' },
      { key: 'value', header: 'value' },
    ],
  )
}

function buildPlannerCsv(dataset: ReportsAnalyticsDataset): string {
  return buildCsv(
    [
      { metric: 'planned_sessions', value: dataset.planner.plannedSessions },
      { metric: 'completed_sessions', value: dataset.planner.completedSessions },
      { metric: 'missed_sessions', value: dataset.planner.missedSessions },
      { metric: 'rescheduled_sessions', value: dataset.planner.rescheduledSessions },
      { metric: 'adherence_rate', value: dataset.planner.adherenceRate },
      { metric: 'average_planned_minutes', value: dataset.planner.averagePlannedMinutes },
      { metric: 'average_actual_minutes', value: dataset.planner.averageActualMinutes },
    ],
    [
      { key: 'metric', header: 'metric' },
      { key: 'value', header: 'value' },
    ],
  )
}

function buildBreakdownCsv(rows: Array<{ category: string; key: string; label: string; value: number; percentage: number }>): string {
  return buildCsv(rows, [
    { key: 'category', header: 'category' },
    { key: 'key', header: 'key' },
    { key: 'label', header: 'label' },
    { key: 'value', header: 'value' },
    { key: 'percentage', header: 'percentage' },
  ])
}

function buildTrendCsv(
  rows: ReportsAnalyticsTrendPoint[],
  metric: string,
  granularity: string,
): string {
  return buildCsv(
    rows.map((row) => ({
      period: row.key,
      label: row.label,
      granularity,
      metric,
      value: row.value,
      secondary_value: row.secondaryValue ?? '',
    })),
    [
      { key: 'period', header: 'period' },
      { key: 'label', header: 'label' },
      { key: 'granularity', header: 'granularity' },
      { key: 'metric', header: 'metric' },
      { key: 'value', header: 'value' },
      { key: 'secondary_value', header: 'secondary_value' },
    ],
  )
}

function withCategory(category: string, rows: ReportsAnalyticsBreakdownItem[]) {
  return rows.map((row) => ({
    category,
    key: row.key,
    label: row.label,
    value: row.value,
    percentage: row.percentage,
  }))
}

function withSegment(segmentType: string, rows: ReportsAnalyticsDataset['segments']['ageBands']) {
  return rows.map((row) => ({
    segment_type: segmentType,
    ...row,
  }))
}

function formatDate(value: string, locale: ReportsAnalyticsLocale): string {
  return new Date(value).toLocaleDateString(locale)
}
