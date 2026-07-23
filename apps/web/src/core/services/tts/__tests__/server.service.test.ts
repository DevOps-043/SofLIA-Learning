import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  isElevenLabsConfigured,
  synthesizeSpeechWithElevenLabs,
} from '../server.service'

const originalApiKey = process.env.ELEVENLABS_API_KEY
const originalPublicApiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
const originalVoiceId = process.env.ELEVENLABS_VOICE_ID
const originalModelId = process.env.ELEVENLABS_MODEL_ID
const originalTTSProvider = process.env.TTS_PROVIDER
const originalFetch = global.fetch

afterEach(() => {
  vi.restoreAllMocks()
  global.fetch = originalFetch

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

  if (originalVoiceId) {
    process.env.ELEVENLABS_VOICE_ID = originalVoiceId
  } else {
    delete process.env.ELEVENLABS_VOICE_ID
  }

  if (originalModelId) {
    process.env.ELEVENLABS_MODEL_ID = originalModelId
  } else {
    delete process.env.ELEVENLABS_MODEL_ID
  }

  if (originalTTSProvider) {
    process.env.TTS_PROVIDER = originalTTSProvider
  } else {
    delete process.env.TTS_PROVIDER
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

  it('passes ElevenLabs query params and server model id', async () => {
    process.env.ELEVENLABS_API_KEY = 'server-key'
    process.env.ELEVENLABS_VOICE_ID = 'voice-id'
    process.env.ELEVENLABS_MODEL_ID = 'eleven_multilingual_v2'
    global.fetch = vi.fn().mockResolvedValue(new Response()) as typeof fetch

    await synthesizeSpeechWithElevenLabs({
      text: 'Hola SofLIA',
      voiceSettings: {
        stability: 0.4,
        similarity_boost: 0.65,
        style: 0.3,
        use_speaker_boost: false,
      },
    })

    expect(global.fetch).toHaveBeenCalledTimes(1)
    const [url, init] = vi.mocked(global.fetch).mock.calls[0]
    const requestUrl = new URL(String(url))
    const body = JSON.parse(String(init?.body))

    expect(requestUrl.pathname).toBe('/v1/text-to-speech/voice-id')
    expect(requestUrl.searchParams.get('optimize_streaming_latency')).toBe('4')
    expect(requestUrl.searchParams.get('output_format')).toBe('mp3_22050_32')
    expect(body).toEqual({
      text: 'Hola SofLIA',
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.65,
        style: 0.3,
        use_speaker_boost: false,
      },
    })
  })

})
