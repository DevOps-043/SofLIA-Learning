import { afterEach, describe, expect, it, vi } from 'vitest';
import { isTTSAbortError, requestTTSAudio } from '../client.service';

describe('tts client service', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('returns null when the server TTS provider is unavailable', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: 'TTS provider unavailable',
        }),
        { status: 503 }
      )
    ) as typeof fetch;

    const result = await requestTTSAudio({ text: 'Hola' });

    expect(result).toBeNull();
  });

  it('returns an audio blob when the request succeeds', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(Uint8Array.from([5, 6, 7]), {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
        },
      })
    ) as typeof fetch;

    const result = await requestTTSAudio({ text: 'Hola' });

    expect(result).not.toBeNull();
    expect(await result?.text()).toBe('\u0005\u0006\u0007');
  });

  it('detects abort errors consistently', () => {
    expect(isTTSAbortError(new Error('request aborted'))).toBe(true);

    const abortError = new Error('signal aborted');
    abortError.name = 'AbortError';
    expect(isTTSAbortError(abortError)).toBe(true);

    expect(isTTSAbortError(new Error('different error'))).toBe(false);
  });
});
