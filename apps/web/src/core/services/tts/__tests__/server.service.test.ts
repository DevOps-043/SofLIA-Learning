import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  getConfiguredTTSProvider,
  isConfiguredTTSProviderAvailable,
  isElevenLabsConfigured,
  synthesizeSpeechWithElevenLabs,
  synthesizeSpeechWithConfiguredProvider,
} from '../server.service'

const originalApiKey = process.env.ELEVENLABS_API_KEY
const originalPublicApiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
const originalVoiceId = process.env.ELEVENLABS_VOICE_ID
const originalModelId = process.env.ELEVENLABS_MODEL_ID
const originalTTSProvider = process.env.TTS_PROVIDER
const originalGeminiTTSApiKey = process.env.GEMINI_TTS_API_KEY
const originalGoogleApiKey = process.env.GOOGLE_API_KEY
const originalGeminiApiKey = process.env.GEMINI_API_KEY
const originalGeminiModel = process.env.GEMINI_TTS_MODEL
const originalGeminiVoice = process.env.GEMINI_TTS_VOICE
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

  if (originalGoogleApiKey) {
    process.env.GOOGLE_API_KEY = originalGoogleApiKey
  } else {
    delete process.env.GOOGLE_API_KEY
  }

  if (originalGeminiTTSApiKey) {
    process.env.GEMINI_TTS_API_KEY = originalGeminiTTSApiKey
  } else {
    delete process.env.GEMINI_TTS_API_KEY
  }

  if (originalGeminiApiKey) {
    process.env.GEMINI_API_KEY = originalGeminiApiKey
  } else {
    delete process.env.GEMINI_API_KEY
  }

  if (originalGeminiModel) {
    process.env.GEMINI_TTS_MODEL = originalGeminiModel
  } else {
    delete process.env.GEMINI_TTS_MODEL
  }

  if (originalGeminiVoice) {
    process.env.GEMINI_TTS_VOICE = originalGeminiVoice
  } else {
    delete process.env.GEMINI_TTS_VOICE
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

  it('selects Gemini when configured as the TTS provider', () => {
    delete process.env.ELEVENLABS_API_KEY
    process.env.TTS_PROVIDER = ' gemini '
    process.env.GOOGLE_API_KEY = 'google-key'

    expect(getConfiguredTTSProvider()).toBe('gemini')
    expect(isConfiguredTTSProviderAvailable()).toBe(true)
  })

  it('selects Gemini when only the dedicated TTS key is configured', () => {
    delete process.env.ELEVENLABS_API_KEY
    delete process.env.TTS_PROVIDER
    process.env.GEMINI_TTS_API_KEY = 'tts-google-key'

    expect(getConfiguredTTSProvider()).toBe('gemini')
    expect(isConfiguredTTSProviderAvailable()).toBe(true)
  })

  it('passes Gemini speech config and returns playable wav audio', async () => {
    process.env.TTS_PROVIDER = 'gemini'
    process.env.GEMINI_TTS_API_KEY = 'tts-google-key'
    process.env.GOOGLE_API_KEY = 'chat-google-key'
    process.env.GEMINI_TTS_MODEL = 'gemini-2.5-flash-preview-tts'
    process.env.GEMINI_TTS_VOICE = 'Sulafat'
    global.fetch = vi.fn().mockResolvedValue(
      Response.json({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: 'audio/pcm',
                    data: Buffer.from([1, 2, 3, 4]).toString('base64'),
                  },
                },
              ],
            },
          },
        ],
      })
    ) as typeof fetch

    const { provider, response } = await synthesizeSpeechWithConfiguredProvider({
      text: 'Hola SofLIA',
      modelId: 'eleven_turbo_v2_5',
      voiceId: 'eleven-voice-id',
    })
    const audio = new Uint8Array(await response.arrayBuffer())
    const [url, init] = vi.mocked(global.fetch).mock.calls[0]
    const requestUrl = new URL(String(url))
    const body = JSON.parse(String(init?.body))

    expect(provider).toBe('gemini')
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('audio/wav')
    expect(String.fromCharCode(...audio.slice(0, 4))).toBe('RIFF')
    expect(requestUrl.pathname).toBe('/v1beta/models/gemini-2.5-flash-preview-tts:generateContent')
    expect(requestUrl.searchParams.get('key')).toBe('tts-google-key')
    expect(body.generationConfig.responseModalities).toEqual(['AUDIO'])
    expect(
      body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName
    ).toBe('Sulafat')
    expect(body.contents[0].parts[0].text).toContain('Hola SofLIA')
  })
})
