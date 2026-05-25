import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createAdminClient } from '@/lib/supabase/admin'
import {
  resolveHlsUrlForSource,
  resolveHlsUrlsForSources,
} from '../hls-source-resolver.server'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

interface JobRow {
  completed_at: string | null
  result_url: string | null
  source_path: string | null
  source_url: string | null
  status: string
}

function createSupabaseMock(rows: JobRow[]) {
  const queries: Array<{
    field: string | null
    values: string[]
  }> = []

  return {
    queries,
    from: vi.fn(() => {
      const query = {
        field: null as string | null,
        values: [] as string[],
        eq: vi.fn(() => query),
        in: vi.fn((field: string, values: string[]) => {
          query.field = field
          query.values = values
          queries.push({ field, values })
          return query
        }),
        not: vi.fn(() => query),
        order: vi.fn(async () => ({
          data: rows.filter((row) => {
            if (!query.field) return false
            const value = row[query.field as keyof JobRow]
            return typeof value === 'string' && query.values.includes(value)
          }),
          error: null,
        })),
        select: vi.fn(() => query),
      }
      return query
    }),
  } as unknown as SupabaseClient & {
    queries: Array<{ field: string | null; values: string[] }>
    from: ReturnType<typeof vi.fn>
  }
}

describe('hls-source-resolver.server', () => {
  beforeEach(() => {
    vi.mocked(createAdminClient).mockReset()
  })

  it('resolves completed HLS by storage path when the public URL changed', async () => {
    const source =
      'https://new-project.supabase.co/storage/v1/object/public/course-videos/videos/source.mp4'
    const hls =
      'https://new-project.supabase.co/storage/v1/object/public/course-videos/videos/hls/source/master.m3u8'
    const adminClient = createSupabaseMock([
      {
        completed_at: '2026-05-01T10:00:00.000Z',
        result_url: hls,
        source_path: 'videos/source.mp4',
        source_url:
          'https://old-project.supabase.co/storage/v1/object/public/course-videos/videos/source.mp4',
        status: 'completed',
      },
    ])
    const userClient = createSupabaseMock([])
    vi.mocked(createAdminClient).mockReturnValue(adminClient as never)

    const map = await resolveHlsUrlsForSources(userClient, [source])

    expect(map.get(source)).toBe(hls)
    expect(userClient.from).not.toHaveBeenCalled()
    expect(adminClient.queries.some((query) => query.field === 'source_path')).toBe(true)
  })

  it('keeps the most recent completed HLS result for a source', async () => {
    const source = 'course-videos/videos/source.mp4'
    const olderHls = 'https://cdn.test/older/master.m3u8'
    const newerHls = 'https://cdn.test/newer/master.m3u8'
    const adminClient = createSupabaseMock([
      {
        completed_at: '2026-04-01T10:00:00.000Z',
        result_url: olderHls,
        source_path: 'videos/source.mp4',
        source_url: 'https://cdn.test/source.mp4',
        status: 'completed',
      },
      {
        completed_at: '2026-05-01T10:00:00.000Z',
        result_url: newerHls,
        source_path: 'videos/source.mp4',
        source_url: 'https://cdn.test/source.mp4',
        status: 'completed',
      },
    ])
    vi.mocked(createAdminClient).mockReturnValue(adminClient as never)

    const map = await resolveHlsUrlsForSources(createSupabaseMock([]), [source])

    expect(map.get(source)).toBe(newerHls)
  })

  it('falls back to the original source when no completed HLS result exists', async () => {
    const source = 'https://cdn.test/source.mp4'
    vi.mocked(createAdminClient).mockImplementation(() => {
      throw new Error('missing service role')
    })

    const resolved = await resolveHlsUrlForSource(createSupabaseMock([]), source)

    expect(resolved).toBe(source)
  })
})
