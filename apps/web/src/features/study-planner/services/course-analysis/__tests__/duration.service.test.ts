import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

vi.mock('../db', () => ({
  fetchLessonRows: vi.fn(),
  fetchLessonEstimateRows: vi.fn(),
  fetchLessonActivityRows: vi.fn(),
  fetchLessonMaterialRows: vi.fn(),
}))

import { fetchLessonDurationMap, fetchCourseLessonDurations } from '../duration.service'
import {
  fetchLessonRows,
  fetchLessonEstimateRows,
  fetchLessonActivityRows,
  fetchLessonMaterialRows,
} from '../db'

describe('fetchLessonDurationMap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty map for empty lessonIds', async () => {
    const result = await fetchLessonDurationMap([])
    expect(result.size).toBe(0)
    expect(fetchLessonRows).not.toHaveBeenCalled()
  })

  it('uses estimate rows when available', async () => {
    vi.mocked(fetchLessonRows).mockResolvedValue([
      { lesson_id: 'l1', lesson_title: 'Intro', duration_seconds: 600 },
    ])
    vi.mocked(fetchLessonEstimateRows).mockResolvedValue([
      {
        lesson_id: 'l1',
        video_minutes: 10,
        activities_time_minutes: 5,
        reading_time_minutes: 3,
        quiz_time_minutes: 2,
        exercise_time_minutes: 0,
        link_time_minutes: 0,
        interactions_time_minutes: 3,
        total_time_minutes: 23,
      },
    ])
    vi.mocked(fetchLessonActivityRows).mockResolvedValue([])
    vi.mocked(fetchLessonMaterialRows).mockResolvedValue([])

    const result = await fetchLessonDurationMap(['l1'])

    expect(result.has('l1')).toBe(true)
    expect(result.get('l1')!.isEstimated).toBe(false)
    expect(result.get('l1')!.videoMinutes).toBe(10)
  })

  it('falls back to sources when no estimate exists', async () => {
    vi.mocked(fetchLessonRows).mockResolvedValue([
      { lesson_id: 'l1', lesson_title: 'Intro', duration_seconds: 300 },
    ])
    vi.mocked(fetchLessonEstimateRows).mockResolvedValue([])
    vi.mocked(fetchLessonActivityRows).mockResolvedValue([
      { lesson_id: 'l1', estimated_time_minutes: 10 },
    ])
    vi.mocked(fetchLessonMaterialRows).mockResolvedValue([
      { lesson_id: 'l1', estimated_time_minutes: 5, material_type: 'reading' },
    ])

    const result = await fetchLessonDurationMap(['l1'])

    expect(result.has('l1')).toBe(true)
    const duration = result.get('l1')!
    expect(duration.videoMinutes).toBe(5) // 300s / 60
    expect(duration.activitiesMinutes).toBe(10)
    expect(duration.materialsMinutes).toBe(5)
  })

  it('skips lessons not found in lesson rows', async () => {
    vi.mocked(fetchLessonRows).mockResolvedValue([])
    vi.mocked(fetchLessonEstimateRows).mockResolvedValue([])
    vi.mocked(fetchLessonActivityRows).mockResolvedValue([])
    vi.mocked(fetchLessonMaterialRows).mockResolvedValue([])

    const result = await fetchLessonDurationMap(['l1'])

    expect(result.size).toBe(0)
  })

  it('handles mixed: some with estimates, some without', async () => {
    vi.mocked(fetchLessonRows).mockResolvedValue([
      { lesson_id: 'l1', lesson_title: 'Lesson 1', duration_seconds: 600 },
      { lesson_id: 'l2', lesson_title: 'Lesson 2', duration_seconds: 300 },
    ])
    vi.mocked(fetchLessonEstimateRows).mockResolvedValue([
      {
        lesson_id: 'l1',
        video_minutes: 10,
        activities_time_minutes: 5,
        total_time_minutes: 20,
      },
    ])
    vi.mocked(fetchLessonActivityRows).mockResolvedValue([])
    vi.mocked(fetchLessonMaterialRows).mockResolvedValue([])

    const result = await fetchLessonDurationMap(['l1', 'l2'])

    expect(result.size).toBe(2)
    expect(result.get('l1')!.isEstimated).toBe(false) // from estimate
    expect(result.get('l2')!.isEstimated).toBe(false) // no activities/materials → no fallback
  })
})

describe('fetchCourseLessonDurations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array for empty modules', async () => {
    const result = await fetchCourseLessonDurations([])
    expect(result).toHaveLength(0)
  })

  it('extracts lessonIds from modules and returns durations', async () => {
    vi.mocked(fetchLessonRows).mockResolvedValue([
      { lesson_id: 'l1', lesson_title: 'L1', duration_seconds: 600 },
    ])
    vi.mocked(fetchLessonEstimateRows).mockResolvedValue([
      { lesson_id: 'l1', video_minutes: 10, total_time_minutes: 15 },
    ])
    vi.mocked(fetchLessonActivityRows).mockResolvedValue([])
    vi.mocked(fetchLessonMaterialRows).mockResolvedValue([])

    const modules = [
      {
        moduleId: 'm1',
        moduleTitle: 'Module 1',
        orderIndex: 0,
        lessons: [{ lessonId: 'l1', lessonTitle: 'L1', orderIndex: 0 }],
      },
    ]

    const result = await fetchCourseLessonDurations(modules)

    expect(result).toHaveLength(1)
    expect(result[0].lessonId).toBe('l1')
  })

  it('filters out lessons not found in duration map', async () => {
    vi.mocked(fetchLessonRows).mockResolvedValue([])
    vi.mocked(fetchLessonEstimateRows).mockResolvedValue([])
    vi.mocked(fetchLessonActivityRows).mockResolvedValue([])
    vi.mocked(fetchLessonMaterialRows).mockResolvedValue([])

    const modules = [
      {
        moduleId: 'm1',
        moduleTitle: 'Module 1',
        orderIndex: 0,
        lessons: [{ lessonId: 'l-missing', lessonTitle: 'Missing', orderIndex: 0 }],
      },
    ]

    const result = await fetchCourseLessonDurations(modules)

    expect(result).toHaveLength(0)
  })
})
