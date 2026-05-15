import { describe, expect, it } from 'vitest'
import {
  normalizeDirectVideoProviderId,
} from '../admin-lessons/shared'

describe('admin-lessons shared helpers', () => {
  it('extracts direct supabase storage paths before persisting them', () => {
    const normalizedVideoProviderId = normalizeDirectVideoProviderId(
      'https://example.supabase.co/storage/v1/object/public/course-videos/videos/very-long-file-name-that-should-be-truncated-because-it-exceeds-fifty-characters.mp4',
      'direct',
    )

    expect(normalizedVideoProviderId).toBe(
      'course-videos/videos/very-long-file-name-that-should-be-truncated-because-it-exceeds-fifty-characters.mp4',
    )
  })

  it('preserves adaptive HLS storage paths for direct videos', () => {
    const normalizedVideoProviderId = normalizeDirectVideoProviderId(
      'https://example.supabase.co/storage/v1/object/public/course-videos/videos/hls/lesson-asset/master.m3u8',
      'direct',
    )

    expect(normalizedVideoProviderId).toBe(
      'course-videos/videos/hls/lesson-asset/master.m3u8',
    )
  })
})
