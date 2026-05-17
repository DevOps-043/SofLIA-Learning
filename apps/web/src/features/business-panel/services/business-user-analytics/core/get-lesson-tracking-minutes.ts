import { LessonTrackingRecord } from './lesson-tracking-record'

export function getLessonTrackingMinutes(tracking: LessonTrackingRecord): number {
  const explicitMinutes = Number(tracking.t_lesson_minutes)
  if (Number.isFinite(explicitMinutes) && explicitMinutes > 0) {
    return explicitMinutes
  }

  const videoMinutes = Number(tracking.t_video_minutes) || 0
  const materialMinutes = Number(tracking.t_materials_minutes) || 0
  const contentMinutes = videoMinutes + materialMinutes
  if (contentMinutes > 0) {
    return contentMinutes
  }

  if (!tracking.started_at || !tracking.completed_at) return 0
  const startedAt = new Date(tracking.started_at).getTime()
  const completedAt = new Date(tracking.completed_at).getTime()
  if (Number.isNaN(startedAt) || Number.isNaN(completedAt) || completedAt <= startedAt) {
    return 0
  }

  return Math.round(((completedAt - startedAt) / 60_000) * 10) / 10
}
