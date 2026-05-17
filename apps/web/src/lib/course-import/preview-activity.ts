import { normalizeImportedActivityContent } from '../course-content'
import { buildImportedActivityRow } from '../course-import-activities'
import type { CourseEngineActivity } from './types'
import { normalizeQuizData } from './quiz'

export function buildPreviewActivity(
  activity: CourseEngineActivity,
  activityIndex: number,
  lessonId: string,
  moduleIndex: number,
  lessonIndex: number,
) {
  const activityRow = buildImportedActivityRow({ activity, index: activityIndex, lessonId })
  return {
    activity_id: `staging-act-${moduleIndex}-${lessonIndex}-${activityIndex}`,
    activity_title: activity.title,
    activity_type: activityRow.activity_type,
    activity_content: activity.type === 'quiz'
      ? JSON.stringify(normalizeQuizData(activity.data))
      : normalizeImportedActivityContent(activity.type, activity.data),
    activity_config: activityRow.activity_config,
    activity_schema_version: activityRow.activity_schema_version,
    activity_order_index: activityIndex + 1,
  }
}
