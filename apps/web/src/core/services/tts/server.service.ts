import type { TextToSpeechProvider, TextToSpeechRequestPayload } from './types';
import {
  DEFAULT_TTS_PROVIDER,
  DEFAULT_ELEVENLABS_MODEL_ID,
  DEFAULT_ELEVENLABS_VOICE_ID,
  DEFAULT_TTS_OPTIMIZE_STREAMING_LATENCY,
  DEFAULT_TTS_OUTPUT_FORMAT,
  getTTSSynthesisTimeoutMs,
} from './shared';
import {
  isGeminiConfigured,
  resolveGeminiVoiceAndModel,
  synthesizeSpeechWithGemini,
} from './gemini.service';

// Reading pregeneration (transcripts, summaries, reflection activities) runs on
// ElevenLabs: it synthesizes long text in a single request and has no punishing
// per-day request cap like Gemini's preview tier. The SofLIA chat voice stays on
// the globally configured provider (Gemini).
const READING_CONTEXTS = new Set(['reading', 'reading_continuation']);

function getElevenLabsApiKey() {
  // Prefer a server-only key; fall back to the NEXT_PUBLIC one the project already
  // ships. SECURITY: move the key to a server-only `ELEVENLABS_API_KEY` so it is
  // not exposed in the browser bundle once on a paid plan.
  return process.env.ELEVENLABS_API_KEY || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || null;
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

  // Auto-detect Gemini: accept any of the three key env vars the project uses
  if (process.env.GEMINI_TTS_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) {
    return 'gemini';
  }

  return DEFAULT_TTS_PROVIDER;
}

/**
 * Provider for a given synthesis context. Reading pregeneration prefers ElevenLabs
 * (when configured); everything else uses the globally configured provider. This is
 * what keeps course reading audio on ElevenLabs while SofLIA chat stays on Gemini.
 */
export function resolveProviderForContext(context?: string): TextToSpeechProvider {
  if (context && READING_CONTEXTS.has(context) && isElevenLabsConfigured()) {
    return 'elevenlabs';
  }
  return getConfiguredTTSProvider();
}

export function isElevenLabsConfigured() {
  return Boolean(getElevenLabsApiKey());
}

export function isConfiguredTTSProviderAvailable(context?: string) {
  const provider = resolveProviderForContext(context);

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
    signal: AbortSignal.timeout(getTTSSynthesisTimeoutMs()),
    body: JSON.stringify({
      text: payload.text,
      model_id: getElevenLabsModelId(payload.modelId),
      voice_settings: payload.voiceSettings,
      speed: payload.speed,
    }),
  });
}

export interface TTSCacheDescriptor {
  provider: TextToSpeechProvider;
  voice: string;
  model: string;
  context: string;
}

/**
 * Describe la voz/modelo que el proveedor configurado usará realmente para este
 * payload. Es la base de la clave del caché de audio: garantiza que el audio
 * cacheado corresponda exactamente a la voz/modelo que produciría la síntesis.
 */
export function resolveTTSCacheDescriptor(
  payload: TextToSpeechRequestPayload,
): TTSCacheDescriptor {
  const context = payload.context ?? 'chat';
  const provider = resolveProviderForContext(context);

  if (provider === 'gemini') {
    const { voice, model } = resolveGeminiVoiceAndModel(context);
    return { provider, voice, model, context };
  }

  return {
    provider,
    voice: getElevenLabsVoiceId(payload.voiceId),
    model: getElevenLabsModelId(payload.modelId),
    context,
  };
}

export async function synthesizeSpeechWithConfiguredProvider(payload: TextToSpeechRequestPayload) {
  const provider = resolveProviderForContext(payload.context);

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
