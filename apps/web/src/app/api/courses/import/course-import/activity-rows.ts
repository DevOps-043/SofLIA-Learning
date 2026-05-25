import { buildImportedActivityRow } from '@/lib/course-import-activities'

import { normalizeQuizData } from './quiz'
import type { CourseImportActivity } from './schemas'

export function buildImportedActivityRows(
  activities: CourseImportActivity[],
  lessonId: string
) {
  return activities.map((activity, index) => {
    const row = buildImportedActivityRow({
      activity,
      index,
      lessonId,
    })

    if (activity.type !== 'quiz') {
      return row
    }

    return {
      ...row,
      activity_content: JSON.stringify(normalizeQuizData(activity.data)),
      activity_type: 'quiz',
    }
  })
}
