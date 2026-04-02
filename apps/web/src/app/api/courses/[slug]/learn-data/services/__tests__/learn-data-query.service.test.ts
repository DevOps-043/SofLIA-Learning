import { describe, expect, it } from 'vitest'
import {
  getLessonsTableName,
  resolveLastWatchedLessonId,
} from '../learn-data-query.service'

describe('learn-data-query.service', () => {
  it('maps the language to the correct lessons table', () => {
    expect(getLessonsTableName('en')).toBe('course_lessons_en')
    expect(getLessonsTableName('pt')).toBe('course_lessons_pt')
    expect(getLessonsTableName('es')).toBe('course_lessons')
    expect(getLessonsTableName('fr')).toBe('course_lessons')
  })

  it('returns the most recent in-progress lesson when available', () => {
    const lessonId = resolveLastWatchedLessonId(
      [
        {
          module_id: 'module-2',
          module_title: 'Modulo 2',
          module_order_index: 2,
          is_published: true,
        },
        {
          module_id: 'module-1',
          module_title: 'Modulo 1',
          module_order_index: 1,
          is_published: true,
        },
      ],
      [
        {
          lesson_id: 'lesson-2',
          lesson_title: 'Leccion 2',
          lesson_description: null,
          lesson_order_index: 2,
          duration_seconds: 120,
          video_provider_id: null,
          video_provider: null,
          is_published: true,
          module_id: 'module-1',
          transcript_content: null,
          summary_content: null,
        },
        {
          lesson_id: 'lesson-1',
          lesson_title: 'Leccion 1',
          lesson_description: null,
          lesson_order_index: 1,
          duration_seconds: 120,
          video_provider_id: null,
          video_provider: null,
          is_published: true,
          module_id: 'module-1',
          transcript_content: null,
          summary_content: null,
        },
        {
          lesson_id: 'lesson-3',
          lesson_title: 'Leccion 3',
          lesson_description: null,
          lesson_order_index: 1,
          duration_seconds: 120,
          video_provider_id: null,
          video_provider: null,
          is_published: true,
          module_id: 'module-2',
          transcript_content: null,
          summary_content: null,
        },
      ],
      [
        {
          lesson_id: 'lesson-1',
          is_completed: true,
          lesson_status: 'completed',
          video_progress_percentage: 100,
          last_accessed_at: '2026-04-01T10:00:00.000Z',
          started_at: '2026-04-01T09:00:00.000Z',
        },
        {
          lesson_id: 'lesson-2',
          is_completed: false,
          lesson_status: 'in_progress',
          video_progress_percentage: 20,
          last_accessed_at: '2026-04-01T12:00:00.000Z',
          started_at: '2026-04-01T11:00:00.000Z',
        },
      ],
    )

    expect(lessonId).toBe('lesson-2')
  })

  it('falls back to the first unlocked lesson when there is no progress', () => {
    const lessonId = resolveLastWatchedLessonId(
      [
        {
          module_id: 'module-1',
          module_title: 'Modulo 1',
          module_order_index: 1,
          is_published: true,
        },
      ],
      [
        {
          lesson_id: 'lesson-1',
          lesson_title: 'Leccion 1',
          lesson_description: null,
          lesson_order_index: 1,
          duration_seconds: 120,
          video_provider_id: null,
          video_provider: null,
          is_published: true,
          module_id: 'module-1',
          transcript_content: null,
          summary_content: null,
        },
      ],
      [],
    )

    expect(lessonId).toBeNull()
  })
})
