import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { getModuleLessons } from '../admin-lessons/query.service'

function createLessonsChain(result: { data: unknown[]; error: unknown | null }) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(result),
  }
}

function createUsersChain(result: { data: unknown[]; error: unknown | null }) {
  return {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue(result),
  }
}

describe('admin-lessons query service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  })

  it('loads instructor names in bulk and avoids per-lesson user queries', async () => {
    const lessonsChain = createLessonsChain({
      data: [
        {
          lesson_id: 'lesson-1',
          lesson_title: 'Leccion 1',
          lesson_description: null,
          lesson_order_index: 1,
          video_provider_id: 'video-1.mp4',
          video_provider: 'direct',
          duration_seconds: 600,
          total_duration_minutes: 10,
          transcript_content: null,
          summary_content: null,
          is_published: true,
          module_id: 'module-1',
          instructor_id: 'instructor-1',
          created_at: '2026-04-01T00:00:00.000Z',
          updated_at: '2026-04-01T00:00:00.000Z',
        },
        {
          lesson_id: 'lesson-2',
          lesson_title: 'Leccion 2',
          lesson_description: null,
          lesson_order_index: 2,
          video_provider_id: 'https://cdn.example/video.mp4',
          video_provider: 'custom',
          duration_seconds: 900,
          total_duration_minutes: 15,
          transcript_content: null,
          summary_content: null,
          is_published: false,
          module_id: 'module-1',
          instructor_id: 'instructor-1',
          created_at: '2026-04-01T00:00:00.000Z',
          updated_at: '2026-04-01T00:00:00.000Z',
        },
      ],
      error: null,
    })
    const usersChain = createUsersChain({
      data: [
        {
          id: 'instructor-1',
          display_name: 'Ana Ruiz',
          first_name: 'Ana',
          last_name: 'Ruiz',
        },
      ],
      error: null,
    })

    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'course_lessons') {
          return lessonsChain
        }

        if (table === 'users') {
          return usersChain
        }

        throw new Error(`Unexpected table: ${table}`)
      }),
    } as never)

    const lessons = await getModuleLessons('module-1')

    expect(lessonsChain.select).toHaveBeenCalledWith(
      expect.stringContaining('lesson_id'),
    )
    expect(lessonsChain.select).not.toHaveBeenCalledWith('*')
    expect(usersChain.in).toHaveBeenCalledWith('id', ['instructor-1'])
    expect(lessons).toEqual([
      expect.objectContaining({
        lesson_id: 'lesson-1',
        instructor_name: 'Ana Ruiz',
        video_provider_id:
          'https://example.supabase.co/storage/v1/object/public/course-videos/videos/video-1.mp4',
      }),
      expect.objectContaining({
        lesson_id: 'lesson-2',
        instructor_name: 'Ana Ruiz',
        video_provider_id: 'https://cdn.example/video.mp4',
      }),
    ])
  })
})
