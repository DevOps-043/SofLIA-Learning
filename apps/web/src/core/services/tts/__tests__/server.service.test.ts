import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  isElevenLabsConfigured,
  resolveTTSCacheDescriptor,
  synthesizeSpeech,
} from '../server.service'
import { DEFAULT_ELEVENLABS_MODEL_ID, DEFAULT_ELEVENLABS_VOICE_ID } from '../shared'

const ENV_KEYS = [
  'ELEVENLABS_API_KEY',
  'NEXT_PUBLIC_ELEVENLABS_API_KEY',
  'ELEVENLABS_VOICE_ID',
  'ELEVENLABS_MODEL_ID',
] as const

const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]))
const originalFetch = global.fetch

afterEach(() => {
  vi.restoreAllMocks()
  global.fetch = originalFetch

  for (const key of ENV_KEYS) {
    const value = originalEnv[key]
    if (value) {
      process.env[key] = value
    } else {
      delete process.env[key]
    }
  }
})

describe('tts server service', () => {
  describe('resguardo de la API key', () => {
    it('ignora NEXT_PUBLIC_ELEVENLABS_API_KEY: una clave con ese prefijo viaja en el bundle del navegador', () => {
      delete process.env.ELEVENLABS_API_KEY
      process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY = 'public-key-should-not-work'

      expect(isElevenLabsConfigured()).toBe(false)
    })

    it('falla explicitamente cuando solo hay clave publica configurada', async () => {
      delete process.env.ELEVENLABS_API_KEY
      process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY = 'public-key-should-not-work'

      await expect(synthesizeSpeech({ text: 'Hola' })).rejects.toThrow('ELEVENLABS_NOT_CONFIGURED')
    })
  })

  describe('resolucion de voz y modelo', () => {
    it('usa la voz y el modelo del servidor, no valores del cliente', async () => {
      process.env.ELEVENLABS_API_KEY = 'server-key'
      process.env.ELEVENLABS_VOICE_ID = 'voice-id'
      process.env.ELEVENLABS_MODEL_ID = 'eleven_multilingual_v2'
      global.fetch = vi.fn().mockResolvedValue(new Response()) as typeof fetch

      await synthesizeSpeech({
        text: 'Hola SofLIA',
        voiceSettings: {
          stability: 0.4,
          similarity_boost: 0.65,
          style: 0.3,
          use_speaker_boost: false,
        },
      })

      const [url, init] = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(String(url)).toContain('/text-to-speech/voice-id')
      expect(String(url)).toContain('output_format=mp3_22050_32')
      expect(JSON.parse((init as RequestInit).body as string).model_id).toBe('eleven_multilingual_v2')
    })

    /**
     * Guarda de regresion sobre el CACHE de audio: la clave del audio pregenerado
     * se deriva de (proveedor, voz, modelo, contexto, texto). Si los valores por
     * defecto dejaran de coincidir con los de produccion, TODAS las lecturas ya
     * sintetizadas quedarian huerfanas y habria que regenerarlas (coste y cuota).
     */
    it('cae a la voz y el modelo de produccion cuando no hay variables de entorno', () => {
      delete process.env.ELEVENLABS_VOICE_ID
      delete process.env.ELEVENLABS_MODEL_ID

      const descriptor = resolveTTSCacheDescriptor({ text: 'Texto', context: 'reading' })

      expect(descriptor).toEqual({
        provider: 'elevenlabs',
        voice: DEFAULT_ELEVENLABS_VOICE_ID,
        model: DEFAULT_ELEVENLABS_MODEL_ID,
        context: 'reading',
      })
    })
  })
})
