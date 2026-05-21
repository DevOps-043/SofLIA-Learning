import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { clearAllRateLimits } from '../../../../core/lib/rate-limit';

function createRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/tts', () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.ELEVENLABS_API_KEY;
  const originalPublicApiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
  const originalTTSProvider = process.env.TTS_PROVIDER;
  const originalGeminiTTSApiKey = process.env.GEMINI_TTS_API_KEY;
  const originalGoogleApiKey = process.env.GOOGLE_API_KEY;

  beforeEach(() => {
    clearAllRateLimits();
    vi.restoreAllMocks();
    delete process.env.ELEVENLABS_API_KEY;
    delete process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
    delete process.env.TTS_PROVIDER;
    delete process.env.GEMINI_TTS_API_KEY;
    delete process.env.GOOGLE_API_KEY;
  });

  afterEach(() => {
    clearAllRateLimits();
    global.fetch = originalFetch;

    if (originalApiKey) {
      process.env.ELEVENLABS_API_KEY = originalApiKey;
    } else {
      delete process.env.ELEVENLABS_API_KEY;
    }

    if (originalPublicApiKey) {
      process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY = originalPublicApiKey;
    } else {
      delete process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
    }

    if (originalTTSProvider) {
      process.env.TTS_PROVIDER = originalTTSProvider;
    } else {
      delete process.env.TTS_PROVIDER;
    }

    if (originalGoogleApiKey) {
      process.env.GOOGLE_API_KEY = originalGoogleApiKey;
    } else {
      delete process.env.GOOGLE_API_KEY;
    }

    if (originalGeminiTTSApiKey) {
      process.env.GEMINI_TTS_API_KEY = originalGeminiTTSApiKey;
    } else {
      delete process.env.GEMINI_TTS_API_KEY;
    }
  });

  it('returns 400 when payload is invalid', async () => {
    const response = await POST(createRequest({ text: '' }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe('Invalid text-to-speech payload');
  });

  it('returns 503 when ElevenLabs is not configured on the server', async () => {
    const response = await POST(createRequest({ text: 'Hola mundo' }));
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.code).toBe('TTS_PROVIDER_UNAVAILABLE');
    expect(payload.provider).toBe('elevenlabs');
  });

  it('proxies synthesized audio when ElevenLabs responds correctly', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-server-key';
    global.fetch = vi.fn().mockResolvedValue(
      new Response(Uint8Array.from([1, 2, 3]), {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
        },
      })
    ) as typeof fetch;

    const response = await POST(createRequest({ text: 'Hola SofLIA' }));
    const audio = new Uint8Array(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('audio/mpeg');
    expect(Array.from(audio)).toEqual([1, 2, 3]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('proxies synthesized audio when Gemini responds correctly', async () => {
    process.env.TTS_PROVIDER = 'gemini';
    process.env.GEMINI_TTS_API_KEY = 'test-google-key';
    global.fetch = vi.fn().mockResolvedValue(
      Response.json({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: 'audio/pcm',
                    data: Buffer.from([1, 2, 3]).toString('base64'),
                  },
                },
              ],
            },
          },
        ],
      })
    ) as typeof fetch;

    const response = await POST(createRequest({ text: 'Hola SofLIA' }));
    const audio = new Uint8Array(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('audio/wav');
    expect(String.fromCharCode(...audio.slice(0, 4))).toBe('RIFF');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
