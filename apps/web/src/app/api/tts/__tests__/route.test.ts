import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { clearAllRateLimits } from '../../../../core/lib/rate-limit';

vi.mock('server-only', () => ({}));

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

  beforeEach(() => {
    clearAllRateLimits();
    vi.restoreAllMocks();
    delete process.env.ELEVENLABS_API_KEY;
    delete process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
    delete process.env.TTS_PROVIDER;
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

  it('returns 204 so the browser can fallback when the provider fails', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-server-key';
    global.fetch = vi.fn().mockResolvedValue(
      Response.json(
        {
          error: 'upstream unavailable',
        },
        { status: 502 }
      )
    ) as typeof fetch;

    const response = await POST(createRequest({ text: 'Hola SofLIA' }));

    expect(response.status).toBe(204);
    expect(response.headers.get('X-TTS-Fallback')).toBe('browser');
    expect(response.headers.get('X-TTS-Provider')).toBe('elevenlabs');
  });
});
