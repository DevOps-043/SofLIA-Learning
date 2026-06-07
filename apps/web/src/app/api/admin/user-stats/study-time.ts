export interface LessonProgressTimeRow {
  user_id: string
  lesson_id: string
  completed_at?: string | null
  is_completed?: boolean | null
  lesson_status?: string | null
  time_spent_minutes?: number | null
}

export interface LessonTrackingTimeRow {
  user_id: string
  lesson_id: string
  completed_at?: string | null
  started_at?: string | null
  status?: string | null
  t_lesson_minutes?: number | null
  t_materials_minutes?: number | null
  t_video_minutes?: number | null
}

export interface CourseLessonTimeRow {
  lesson_id: string
  duration_seconds?: number | null
  total_duration_minutes?: number | null
}

interface StudyTimeRecord {
  completed: boolean
  lessonId: string
  progressMinutes: number
  trackingMinutes: number
  userId: string
}

const COMPLETED_STATUSES = new Set(['completed', 'complete', 'done', 'finished'])

export function roundStudyMinutes(value: number): number {
  return Math.round(value * 10) / 10
}

export function isCompletedStudyStatus(status?: string | null): boolean {
  return status ? COMPLETED_STATUSES.has(status.toLowerCase()) : false
}

export function getLessonTrackingMinutes(row: LessonTrackingTimeRow): number {
  const explicitMinutes = toPositiveNumber(row.t_lesson_minutes)
  if (explicitMinutes > 0) return explicitMinutes

  const contentMinutes =
    toPositiveNumber(row.t_video_minutes) + toPositiveNumber(row.t_materials_minutes)
  if (contentMinutes > 0) return contentMinutes

  if (!row.started_at || !row.completed_at) return 0

  const startedAt = new Date(row.started_at).getTime()
  const completedAt = new Date(row.completed_at).getTime()
  if (Number.isNaN(startedAt) || Number.isNaN(completedAt) || completedAt <= startedAt) {
    return 0
  }

  return roundStudyMinutes((completedAt - startedAt) / 60_000)
}

export function getEstimatedLessonMinutes(row?: CourseLessonTimeRow | null): number {
  if (!row) return 0

  const totalDuration = toPositiveNumber(row.total_duration_minutes)
  if (totalDuration > 0) return totalDuration

  const durationSeconds = toPositiveNumber(row.duration_seconds)
  return durationSeconds > 0 ? Math.ceil(durationSeconds / 60) : 0
}

export function resolveStudyMinutes(input: {
  completed: boolean
  estimatedMinutes: number
  progressMinutes: number
  trackingMinutes: number
}): number {
  if (input.progressMinutes > 0) return roundStudyMinutes(input.progressMinutes)
  if (input.trackingMinutes > 0) return roundStudyMinutes(input.trackingMinutes)
  return input.completed ? roundStudyMinutes(input.estimatedMinutes) : 0
}

export function buildEstimatedMinutesByLesson(
  courseLessons: CourseLessonTimeRow[],
): Map<string, number> {
  return new Map(
    courseLessons.map((lesson) => [
      lesson.lesson_id,
      getEstimatedLessonMinutes(lesson),
    ]),
  )
}

export function buildStudyMinutesByUserLesson(input: {
  courseLessons: CourseLessonTimeRow[]
  lessonProgress: LessonProgressTimeRow[]
  lessonTracking: LessonTrackingTimeRow[]
}): Map<string, number> {
  const records = buildStudyTimeRecords(input.lessonProgress, input.lessonTracking)
  const estimatedMinutesByLesson = buildEstimatedMinutesByLesson(input.courseLessons)
  const minutesByUserLesson = new Map<string, number>()

  records.forEach((record) => {
    minutesByUserLesson.set(
      createUserLessonKey(record.userId, record.lessonId),
      resolveStudyMinutes({
        completed: record.completed,
        estimatedMinutes: estimatedMinutesByLesson.get(record.lessonId) || 0,
        progressMinutes: record.progressMinutes,
        trackingMinutes: record.trackingMinutes,
      }),
    )
  })

  return minutesByUserLesson
}

export function buildStudyMinutesByUser(input: {
  courseLessons: CourseLessonTimeRow[]
  lessonProgress: LessonProgressTimeRow[]
  lessonTracking: LessonTrackingTimeRow[]
}): Map<string, number> {
  const minutesByUser = new Map<string, number>()

  buildStudyMinutesByUserLesson(input).forEach((minutes, key) => {
    const { userId } = parseUserLessonKey(key)
    minutesByUser.set(userId, roundStudyMinutes((minutesByUser.get(userId) || 0) + minutes))
  })

  return minutesByUser
}

export function createUserLessonKey(userId: string, lessonId: string): string {
  return `${userId}::${lessonId}`
}

export function parseUserLessonKey(key: string): { lessonId: string; userId: string } {
  const [userId, ...lessonParts] = key.split('::')
  return { lessonId: lessonParts.join('::'), userId }
}

function buildStudyTimeRecords(
  lessonProgress: LessonProgressTimeRow[],
  lessonTracking: LessonTrackingTimeRow[],
): Map<string, StudyTimeRecord> {
  const records = new Map<string, StudyTimeRecord>()

  lessonProgress.forEach((progress) => {
    const key = createUserLessonKey(progress.user_id, progress.lesson_id)
    const existing = getOrCreateRecord(records, progress.user_id, progress.lesson_id)
    existing.progressMinutes += toPositiveNumber(progress.time_spent_minutes)
    existing.completed =
      existing.completed ||
      progress.is_completed === true ||
      Boolean(progress.completed_at) ||
      isCompletedStudyStatus(progress.lesson_status)
    records.set(key, existing)
  })

  lessonTracking.forEach((tracking) => {
    const key = createUserLessonKey(tracking.user_id, tracking.lesson_id)
    const existing = getOrCreateRecord(records, tracking.user_id, tracking.lesson_id)
    existing.trackingMinutes += getLessonTrackingMinutes(tracking)
    existing.completed =
      existing.completed ||
      Boolean(tracking.completed_at) ||
      isCompletedStudyStatus(tracking.status)
    records.set(key, existing)
  })

  return records
}

function getOrCreateRecord(
  records: Map<string, StudyTimeRecord>,
  userId: string,
  lessonId: string,
): StudyTimeRecord {
  const key = createUserLessonKey(userId, lessonId)
  return records.get(key) ?? {
    completed: false,
    lessonId,
    progressMinutes: 0,
    trackingMinutes: 0,
    userId,
  }
}

function toPositiveNumber(value: number | null | undefined): number {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0
}
