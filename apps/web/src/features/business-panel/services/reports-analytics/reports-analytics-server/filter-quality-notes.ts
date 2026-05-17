import { getCourseIdFromLesson } from './get-course-id-from-lesson'
import { shouldIncludeEngagementRecord } from './should-include-engagement-record'
import type { BuildContext } from './build-context'
import type { LessonNoteRecord } from './lesson-note-record'

export function filterQualityNotes(
  context: BuildContext,
  notes: LessonNoteRecord[],
): LessonNoteRecord[] {
  return notes.filter((note) =>
    shouldIncludeEngagementRecord(context, note.user_id, getCourseIdFromLesson(note.course_lessons), [
      note.created_at,
      note.updated_at,
    ]),
  )
}
