import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { resolveOwnedIntroVideoReference } from '../intro-video-upload-validation.server'

const UUID = '123e4567-e89b-42d3-a456-426614174000'

describe('intro video upload ownership', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
  })

  it('accepts only the expected organization and folder', () => {
    expect(resolveOwnedIntroVideoReference({
      folder: 'courses',
      organizationSlug: 'acme',
      publicUrl: `https://project.supabase.co/storage/v1/object/public/intro-videos/org/acme/courses/${UUID}.mp4`,
    })?.storagePath).toBe(`org/acme/courses/${UUID}.mp4`)
  })

  it('rejects another tenant, external origins and traversal', () => {
    for (const publicUrl of [
      `https://project.supabase.co/storage/v1/object/public/intro-videos/org/other/courses/${UUID}.mp4`,
      `https://attacker.test/storage/v1/object/public/intro-videos/org/acme/courses/${UUID}.mp4`,
      `https://project.supabase.co/storage/v1/object/public/intro-videos/org/acme/courses/%2e%2e/${UUID}.mp4`,
    ]) {
      expect(resolveOwnedIntroVideoReference({
        folder: 'courses', organizationSlug: 'acme', publicUrl,
      })).toBeNull()
    }
  })
})
