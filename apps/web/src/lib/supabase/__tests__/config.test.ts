import { describe, expect, it } from 'vitest'
import { getSupabaseRuntimeConfig } from '../config'

describe('getSupabaseRuntimeConfig', () => {
  it('returns url and anon key when both env vars exist', () => {
    expect(
      getSupabaseRuntimeConfig({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      })
    ).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'anon-key',
    })
  })

  it('throws a descriptive error when env vars are missing', () => {
    expect(() => getSupabaseRuntimeConfig({})).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL: missing/
    )
  })
})
