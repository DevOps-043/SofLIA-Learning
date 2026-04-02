import { describe, expect, it } from 'vitest'
import {
  buildCourseDetailSummary,
  formatCourseDuration,
  formatLessonDuration,
  getInitialExpandedModuleIds,
  resolveCourseDifficultyClassName,
  resolveCourseDifficultyText,
  resolveInstructorName,
} from '../course-detail-display.service'

describe('course-detail-display.service', () => {
  it('formats durations for minutes and lesson seconds', () => {
    expect(formatCourseDuration(135)).toBe('2h 15m')
    expect(formatLessonDuration(125)).toBe('2:05')
  })

  it('resolves difficulty labels and classes', () => {
    expect(resolveCourseDifficultyText('beginner')).toBe('Principiante')
    expect(resolveCourseDifficultyClassName('advanced')).toContain('bg-red-500')
  })

  it('builds course summaries from modules', () => {
    const summary = buildCourseDetailSummary([
      { module_id: 'module-1', module_title: 'Module 1', module_order_index: 1, lessons: [{ lesson_id: 'lesson-1', lesson_title: 'Lesson 1', lesson_order_index: 1, duration_seconds: 60 }] },
      { module_id: 'module-2', module_title: 'Module 2', module_order_index: 2, lessons: [{ lesson_id: 'lesson-2', lesson_title: 'Lesson 2', lesson_order_index: 1, duration_seconds: 60 }] },
    ], 90)

    expect(summary).toEqual({
      totalModules: 2,
      totalLessons: 2,
      totalDurationMinutes: 90
    })
  })

  it('returns initial expanded modules and resolves instructor names', () => {
    expect(getInitialExpandedModuleIds([
      { module_id: 'module-1', module_title: 'Module 1', module_order_index: 1, lessons: [] }
    ])).toEqual(['module-1'])

    expect(resolveInstructorName(
      { id: 'course-1', title: 'Course', description: '', thumbnail: '', status: 'Disponible', estimatedDuration: 30, difficulty: 'beginner', isPublic: true, instructor_name: 'Fallback Instructor' },
      { id: 'instructor-1', display_name: 'Display Instructor' }
    )).toBe('Display Instructor')
  })
})
