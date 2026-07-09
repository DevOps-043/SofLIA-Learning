import { describe, expect, it } from 'vitest'
import {
  getLessonsTableName,
  resolveLastWatchedLessonId,
} from '../learn-data/learn-data-lessons.service'

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

  it('does not stop scanning at the first lesson with no progress row (non-contiguous completion)', () => {
    const modules = [
      { module_id: 'module-1', module_title: 'Modulo 1', module_order_index: 1, is_published: true },
      { module_id: 'module-2', module_title: 'Modulo 2', module_order_index: 2, is_published: true },
    ]
    const lesson = (lessonId: string, moduleId: string, orderIndex: number) => ({
      lesson_id: lessonId,
      lesson_title: `Leccion ${lessonId}`,
      lesson_description: null,
      lesson_order_index: orderIndex,
      duration_seconds: 120,
      video_provider_id: null,
      video_provider: null,
      is_published: true,
      module_id: moduleId,
      transcript_content: null,
      summary_content: null,
    })
    const lessons = [
      lesson('lesson-1', 'module-1', 1),
      lesson('lesson-2', 'module-1', 2), // no progress row at all — never opened
      lesson('lesson-3', 'module-1', 3),
      lesson('lesson-4', 'module-1', 4),
      lesson('lesson-5', 'module-1', 5),
      lesson('lesson-6', 'module-2', 1),
    ]
    const completed = (lessonId: string) => ({
      lesson_id: lessonId,
      is_completed: true,
      lesson_status: 'completed',
      video_progress_percentage: 100,
      last_accessed_at: '2026-04-01T09:00:00.000Z',
      started_at: '2026-04-01T08:00:00.000Z',
    })
    const progressData = [
      completed('lesson-1'),
      // lesson-2 intentionally has no row
      completed('lesson-3'),
      completed('lesson-4'),
      completed('lesson-5'),
      completed('lesson-6'),
    ]

    const lessonId = resolveLastWatchedLessonId(modules, lessons, progressData)

    // Must resume at lesson-2 (first not-completed lesson in course order),
    // not lesson-1 as the old break-on-first-gap bug would return.
    expect(lessonId).toBe('lesson-2')
  })

  it('resolves the first incomplete lesson in module 2 when module 1 is fully completed', () => {
    const modules = [
      { module_id: 'module-1', module_title: 'Modulo 1', module_order_index: 1, is_published: true },
      { module_id: 'module-2', module_title: 'Modulo 2', module_order_index: 2, is_published: true },
    ]
    const lesson = (lessonId: string, moduleId: string, orderIndex: number) => ({
      lesson_id: lessonId,
      lesson_title: `Leccion ${lessonId}`,
      lesson_description: null,
      lesson_order_index: orderIndex,
      duration_seconds: 120,
      video_provider_id: null,
      video_provider: null,
      is_published: true,
      module_id: moduleId,
      transcript_content: null,
      summary_content: null,
    })
    const lessons = [
      lesson('lesson-1', 'module-1', 1),
      lesson('lesson-2', 'module-1', 2),
      lesson('lesson-3', 'module-1', 3),
      lesson('lesson-4', 'module-2', 1), // no progress row — first incomplete
      lesson('lesson-5', 'module-2', 2),
    ]
    const completed = (lessonId: string) => ({
      lesson_id: lessonId,
      is_completed: true,
      lesson_status: 'completed',
      video_progress_percentage: 100,
      last_accessed_at: '2026-04-01T09:00:00.000Z',
      started_at: '2026-04-01T08:00:00.000Z',
    })
    const progressData = [completed('lesson-1'), completed('lesson-2'), completed('lesson-3')]

    const lessonId = resolveLastWatchedLessonId(modules, lessons, progressData)

    expect(lessonId).toBe('lesson-4')
  })
})
