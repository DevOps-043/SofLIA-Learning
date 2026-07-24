import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';
import { clearAllRateLimits } from '../../../../core/lib/rate-limit';
import { requireUser } from '@/lib/auth/requireUser';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth/requireUser', () => ({ requireUser: vi.fn() }));

const requireUserMock = vi.mocked(requireUser);

/** Sesion valida: el caso por defecto de casi todas las pruebas. */
function givenAuthenticatedUser() {
  requireUserMock.mockResolvedValue({
    userId: 'user-1',
    userEmail: 'user@soflia.ai',
    userRole: 'BusinessUser',
  });
}

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
  const originalVoiceId = process.env.ELEVENLABS_VOICE_ID;

  beforeEach(() => {
    clearAllRateLimits();
    vi.restoreAllMocks();
    givenAuthenticatedUser();
    delete process.env.ELEVENLABS_API_KEY;
    delete process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
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

    if (originalVoiceId) {
      process.env.ELEVENLABS_VOICE_ID = originalVoiceId;
    } else {
      delete process.env.ELEVENLABS_VOICE_ID;
    }
  });

  it('rechaza sin sesion y no llega a gastar cuota del proveedor', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-server-key';
    requireUserMock.mockResolvedValue(
      NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    );
    global.fetch = vi.fn() as typeof fetch;

    const response = await POST(createRequest({ text: 'Hola SofLIA' }));

    expect(response.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
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

  it('ignora una voz enviada por el cliente y usa la del servidor', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-server-key';
    process.env.ELEVENLABS_VOICE_ID = 'voz-del-servidor';
    global.fetch = vi.fn().mockResolvedValue(
      new Response(Uint8Array.from([1]), {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' },
      })
    ) as typeof fetch;

    await POST(createRequest({ text: 'Hola SofLIA', voiceId: 'voz-pirata', modelId: 'modelo-caro' }));

    const [url, init] = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toContain('/text-to-speech/voz-del-servidor');
    expect(String(url)).not.toContain('voz-pirata');
    expect(JSON.parse((init as RequestInit).body as string).model_id).not.toBe('modelo-caro');
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
