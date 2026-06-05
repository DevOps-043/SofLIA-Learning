import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isTTSAbortError,
  isTTSQuotaExceededError,
  requestTTSAudio,
  selectPreferredWebSpeechVoice,
} from '../client.service';

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

  it('returns null when the server asks the browser to use local speech fallback', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 })) as typeof fetch;

    const result = await requestTTSAudio({ text: 'Hola' });

    expect(result).toBeNull();
  });

  it('throws a quota error when the provider fallback was caused by 429', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 204,
        headers: {
          'X-TTS-Provider-Status': '429',
        },
      }),
    ) as typeof fetch;

    let thrown: unknown;
    try {
      await requestTTSAudio({ text: 'Hola' });
    } catch (error) {
      thrown = error;
    }

    expect(isTTSQuotaExceededError(thrown)).toBe(true);
  });

  it('returns null after retrying a transient TTS provider failure', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: 'Unable to synthesize speech',
        }),
        { status: 502 }
      )
    ) as typeof fetch;

    const result = await requestTTSAudio({ text: 'Hola' });

    expect(result).toBeNull();
    expect(global.fetch).toHaveBeenCalledTimes(2);
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

  it('prefers feminine voices when selecting a browser speech voice', () => {
    const selectedVoice = selectPreferredWebSpeechVoice(
      [
        {
          name: 'Microsoft Jorge - es-MX',
          lang: 'es-MX',
          voiceURI: 'jorge',
          default: true,
          localService: true,
        } as SpeechSynthesisVoice,
        {
          name: 'Microsoft Sabina - es-MX',
          lang: 'es-MX',
          voiceURI: 'sabina',
          default: false,
          localService: true,
        } as SpeechSynthesisVoice,
      ],
      'es-MX'
    );

    expect(selectedVoice?.name).toBe('Microsoft Sabina - es-MX');
  });
});
