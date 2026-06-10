import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isGoogleCloudTTSConfigured,
  resolveGoogleCloudVoiceAndModel,
  synthesizeSpeechWithGoogleCloud,
} from '../google-cloud-tts.service';

const originalKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;
const originalVoice = process.env.GOOGLE_CLOUD_TTS_VOICE;
const originalLanguage = process.env.GOOGLE_CLOUD_TTS_LANGUAGE;
const originalFetch = global.fetch;

afterEach(() => {
  vi.restoreAllMocks();
  global.fetch = originalFetch;
  if (originalKey) process.env.GOOGLE_CLOUD_TTS_API_KEY = originalKey;
  else delete process.env.GOOGLE_CLOUD_TTS_API_KEY;
  if (originalVoice) process.env.GOOGLE_CLOUD_TTS_VOICE = originalVoice;
  else delete process.env.GOOGLE_CLOUD_TTS_VOICE;
  if (originalLanguage) process.env.GOOGLE_CLOUD_TTS_LANGUAGE = originalLanguage;
  else delete process.env.GOOGLE_CLOUD_TTS_LANGUAGE;
});

describe('google cloud tts service', () => {
  beforeEach(() => {
    delete process.env.GOOGLE_CLOUD_TTS_VOICE;
    delete process.env.GOOGLE_CLOUD_TTS_LANGUAGE;
  });

  it('reports configured only when the api key is present', () => {
    delete process.env.GOOGLE_CLOUD_TTS_API_KEY;
    expect(isGoogleCloudTTSConfigured()).toBe(false);

    process.env.GOOGLE_CLOUD_TTS_API_KEY = 'gctts-key';
    expect(isGoogleCloudTTSConfigured()).toBe(true);
  });

  it('throws when synthesizing without a key', async () => {
    delete process.env.GOOGLE_CLOUD_TTS_API_KEY;
    await expect(
      synthesizeSpeechWithGoogleCloud({ text: 'Hola', context: 'chat' }),
    ).rejects.toThrow('GOOGLE_CLOUD_TTS_NOT_CONFIGURED');
  });

  it('resolves default es-US Neural2 voice/language', () => {
    expect(resolveGoogleCloudVoiceAndModel()).toEqual({
      voice: 'es-US-Neural2-A',
      model: 'es-US',
    });
  });

  it('calls the synthesize endpoint and returns decoded MP3 bytes', async () => {
    process.env.GOOGLE_CLOUD_TTS_API_KEY = 'gctts-key';
    const audioBase64 = Buffer.from('fake-mp3').toString('base64');

    let requestUrl = '';
    let requestBody: Record<string, unknown> = {};
    global.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      requestUrl = String(url);
      requestBody = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({ audioContent: audioBase64 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as unknown as typeof fetch;

    const response = await synthesizeSpeechWithGoogleCloud({ text: 'Hola SofLIA', context: 'chat' });
    const bytes = new Uint8Array(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('audio/mpeg');
    expect(Buffer.from(bytes).toString()).toBe('fake-mp3');
    expect(requestUrl).toContain('texttospeech.googleapis.com/v1/text:synthesize');
    expect(requestUrl).toContain('key=gctts-key');
    expect(requestBody).toMatchObject({
      input: { text: 'Hola SofLIA' },
      voice: { languageCode: 'es-US', name: 'es-US-Neural2-A' },
      audioConfig: { audioEncoding: 'MP3' },
    });
  });

  it('returns a 502 when the response has no audio content', async () => {
    process.env.GOOGLE_CLOUD_TTS_API_KEY = 'gctts-key';
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ) as unknown as typeof fetch;

    const response = await synthesizeSpeechWithGoogleCloud({ text: 'Hola', context: 'chat' });
    expect(response.status).toBe(502);
  });
});
