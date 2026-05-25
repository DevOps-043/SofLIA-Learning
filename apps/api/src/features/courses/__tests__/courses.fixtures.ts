import type { Request, Response } from 'express'
import { vi } from 'vitest'

import type { CoursesRepository } from '../courses.repository'
import type { CourseListItem, LessonProgress } from '../courses.types'

export function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    user: { id: 'user-1', email: 'test@test.com', role: 'BusinessUser' },
    query: {},
    params: {},
    body: {},
    ...overrides,
  } as unknown as Request
}

export function makeRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  }

  return res as unknown as Response
}

export function makeCourse(overrides: Partial<CourseListItem> = {}): CourseListItem {
  return {
    id: 'course-1',
    title: 'Test Course',
    description: 'A test course',
    category: 'technology',
    level: 'beginner',
    instructor_id: 'inst-1',
    duration_total_minutes: 120,
    thumbnail_url: null,
    slug: 'test-course',
    is_active: true,
    price: 0,
    average_rating: 4.5,
    student_count: 100,
    review_count: 20,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    instructor: null,
    ...overrides,
  }
}

export function makeProgress(
  overrides: Partial<LessonProgress> = {},
): LessonProgress {
  return {
    progress_id: 'progress-1',
    lesson_id: 'lesson-1',
    user_id: 'user-1',
    enrollment_id: 'enrollment-1',
    progress_percent: 50,
    time_spent_seconds: 300,
    is_completed: false,
    last_position: 150,
    completed_at: null,
    updated_at: '2026-01-01T00:00:00Z',
    last_accessed_at: '2026-01-01T00:00:00Z',
    lesson_status: 'in_progress',
    video_progress_percentage: 50,
    quiz_completed: false,
    quiz_passed: false,
    ...overrides,
  }
}

export function makeRepository(
  overrides: Partial<CoursesRepository> = {},
): CoursesRepository {
  return {
    findCourses: vi.fn().mockResolvedValue({ courses: [], total: 0 }),
    findCourseBySlug: vi.fn().mockResolvedValue(makeCourse()),
    findLessonProgress: vi.fn().mockResolvedValue(null),
    upsertLessonProgress: vi.fn().mockResolvedValue(makeProgress()),
    findUserEnrollments: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}
