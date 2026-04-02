import { describe, expect, it } from 'vitest'
import {
  normalizeDirectVideoProviderId,
} from '../admin-lessons/shared'

describe('admin-lessons shared helpers', () => {
  it('extracts and truncates direct supabase storage paths before persisting them', () => {
    const normalizedVideoProviderId = normalizeDirectVideoProviderId(
      'https://example.supabase.co/storage/v1/object/public/course-videos/videos/very-long-file-name-that-should-be-truncated-because-it-exceeds-fifty-characters.mp4',
      'direct',
    )

    expect(normalizedVideoProviderId).toBe(
      'very-long-file-name-that-should-be-truncated-becau',
    )
    expect(normalizedVideoProviderId.length).toBe(50)
  })
})
