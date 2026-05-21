import type { TextToSpeechProvider, TextToSpeechRequestPayload } from './types';
import {
  DEFAULT_TTS_PROVIDER,
  DEFAULT_ELEVENLABS_MODEL_ID,
  DEFAULT_ELEVENLABS_VOICE_ID,
  DEFAULT_TTS_OPTIMIZE_STREAMING_LATENCY,
  DEFAULT_TTS_OUTPUT_FORMAT,
} from './shared';
import { isGeminiConfigured, synthesizeSpeechWithGemini } from './gemini.service';

function getElevenLabsApiKey() {
  return process.env.ELEVENLABS_API_KEY || null;
}

function getElevenLabsVoiceId(voiceId?: string) {
  return (
    voiceId ||
    process.env.ELEVENLABS_VOICE_ID ||
    process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID ||
    DEFAULT_ELEVENLABS_VOICE_ID
  );
}

function getElevenLabsModelId(modelId?: string) {
  return modelId || process.env.ELEVENLABS_MODEL_ID || DEFAULT_ELEVENLABS_MODEL_ID;
}

export function getConfiguredTTSProvider(): TextToSpeechProvider {
  const provider = (process.env.TTS_PROVIDER || '').trim().toLowerCase();

  if (provider === 'gemini' || provider === 'elevenlabs') {
    return provider;
  }

  if (process.env.GEMINI_TTS_API_KEY) {
    return 'gemini';
  }

  return DEFAULT_TTS_PROVIDER;
}

export function isElevenLabsConfigured() {
  return Boolean(getElevenLabsApiKey());
}

export function isConfiguredTTSProviderAvailable() {
  const provider = getConfiguredTTSProvider();

  if (provider === 'gemini') {
    return isGeminiConfigured();
  }

  return isElevenLabsConfigured();
}

export async function synthesizeSpeechWithElevenLabs(payload: TextToSpeechRequestPayload) {
  const apiKey = getElevenLabsApiKey();

  if (!apiKey) {
    throw new Error('ELEVENLABS_NOT_CONFIGURED');
  }

  const url = new URL(`https://api.elevenlabs.io/v1/text-to-speech/${getElevenLabsVoiceId(payload.voiceId)}`);
  url.searchParams.set(
    'optimize_streaming_latency',
    String(payload.optimizeStreamingLatency ?? DEFAULT_TTS_OPTIMIZE_STREAMING_LATENCY)
  );
  url.searchParams.set('output_format', payload.outputFormat || DEFAULT_TTS_OUTPUT_FORMAT);

  return fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text: payload.text,
      model_id: getElevenLabsModelId(payload.modelId),
      voice_settings: payload.voiceSettings,
      speed: payload.speed,
    }),
  });
}

export async function synthesizeSpeechWithConfiguredProvider(payload: TextToSpeechRequestPayload) {
  const provider = getConfiguredTTSProvider();

  if (provider === 'gemini') {
    return {
      provider,
      response: await synthesizeSpeechWithGemini(payload),
    };
  }

  return {
    provider,
    response: await synthesizeSpeechWithElevenLabs(payload),
  };
}
