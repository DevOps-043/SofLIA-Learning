import { describe, expect, it } from 'vitest'

import { buildTTSCacheKey } from '../server/tts-cache-key'
import type { TTSCacheDescriptor } from '../server.service'

const baseDescriptor: TTSCacheDescriptor = {
  provider: 'elevenlabs',
  voice: 'imFXYz8XIletRKLZZQaA',
  model: 'eleven_turbo_v2_5',
  context: 'reading',
}

describe('buildTTSCacheKey', () => {
  it('is deterministic for the same descriptor + text', () => {
    const a = buildTTSCacheKey(baseDescriptor, 'Hola mundo')
    const b = buildTTSCacheKey(baseDescriptor, 'Hola mundo')

    expect(a).toBe(b)
    // sha256 hex → 64 caracteres
    expect(a).toMatch(/^[a-f0-9]{64}$/)
  })

  it('changes when the text changes', () => {
    const a = buildTTSCacheKey(baseDescriptor, 'Hola mundo')
    const b = buildTTSCacheKey(baseDescriptor, 'Hola mundo!')

    expect(a).not.toBe(b)
  })

  it('changes when the voice changes', () => {
    const a = buildTTSCacheKey(baseDescriptor, 'Texto')
    const b = buildTTSCacheKey({ ...baseDescriptor, voice: 'Sulafat' }, 'Texto')

    expect(a).not.toBe(b)
  })

  it('changes when the context changes', () => {
    const reading = buildTTSCacheKey(baseDescriptor, 'Texto')
    const continuation = buildTTSCacheKey(
      { ...baseDescriptor, context: 'reading_continuation' },
      'Texto',
    )

    expect(reading).not.toBe(continuation)
  })

  it('changes when the provider or model changes', () => {
    const base = buildTTSCacheKey(baseDescriptor, 'Texto')
    const provider = buildTTSCacheKey({ ...baseDescriptor, provider: 'other-provider' }, 'Texto')
    const model = buildTTSCacheKey({ ...baseDescriptor, model: 'other-model' }, 'Texto')

    expect(provider).not.toBe(base)
    expect(model).not.toBe(base)
  })
})
