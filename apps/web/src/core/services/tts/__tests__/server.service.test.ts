import { afterEach, describe, expect, it } from 'vitest'

import {
  isElevenLabsConfigured,
  synthesizeSpeechWithElevenLabs,
} from '../server.service'

const originalApiKey = process.env.ELEVENLABS_API_KEY
const originalPublicApiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY

afterEach(() => {
  if (originalApiKey) {
    process.env.ELEVENLABS_API_KEY = originalApiKey
  } else {
    delete process.env.ELEVENLABS_API_KEY
  }

  if (originalPublicApiKey) {
    process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY = originalPublicApiKey
  } else {
    delete process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
  }
})

describe('tts server service', () => {
  it('ignores NEXT_PUBLIC_ELEVENLABS_API_KEY on the server', () => {
    delete process.env.ELEVENLABS_API_KEY
    process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY = 'public-key-should-not-work'

    expect(isElevenLabsConfigured()).toBe(false)
  })

  it('throws when only a public key is configured', async () => {
    delete process.env.ELEVENLABS_API_KEY
    process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY = 'public-key-should-not-work'

    await expect(
      synthesizeSpeechWithElevenLabs({ text: 'Hola' })
    ).rejects.toThrow('ELEVENLABS_NOT_CONFIGURED')
  })
})
