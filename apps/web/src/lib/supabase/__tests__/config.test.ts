import { describe, expect, it } from 'vitest'
import { getSupabaseRuntimeConfig } from '../config'

describe('getSupabaseRuntimeConfig', () => {
  it('returns url and anon key when overrides are provided', () => {
    expect(
      getSupabaseRuntimeConfig({
        url: 'https://example.supabase.co',
        anonKey: 'anon-key',
      })
    ).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'anon-key',
    })
  })

  it('throws a descriptive error when env vars are missing and no overrides given', () => {
    // Sin overrides, depende de process.env que en test environment está vacío
    // para estas variables, así que debe lanzar error
    expect(() => getSupabaseRuntimeConfig()).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL: missing/
    )
  })

  it('throws when only partial overrides are given', () => {
    expect(() =>
      getSupabaseRuntimeConfig({ url: 'https://example.supabase.co' })
    ).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY: missing/)
  })
})
