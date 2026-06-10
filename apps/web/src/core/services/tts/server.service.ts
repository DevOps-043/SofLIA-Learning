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
import {
  isGoogleCloudTTSConfigured,
  resolveGoogleCloudVoiceAndModel,
  synthesizeSpeechWithGoogleCloud,
} from './google-cloud-tts.service';

// La lectura de cursos prefiere ElevenLabs cuando está configurado: sintetiza
// texto largo en una sola petición y no tiene el "punishing per-day request cap"
// del tier preview de Gemini TTS.
const READING_CONTEXTS = new Set(['reading', 'reading_continuation']);

// Voz del chat de SofLIA. Se sacó de Gemini preview (síntesis no-streaming,
// latencia alta y rate-limit que cortaban las respuestas largas) y es configurable
// por env para balancear costo/latencia sin tocar código.
const CHAT_CONTEXTS = new Set(['chat', 'chat_continuation']);

/**
 * Proveedor para la voz del chat. Configurable con `CHAT_TTS_PROVIDER`
 * (`elevenlabs` | `google-cloud` | `gemini`). Por defecto prefiere ElevenLabs si
 * está configurado y, si no, cae al proveedor global. Permite, p. ej., usar
 * Google Cloud TTS (Neural2/Chirp3: barato, baja latencia, free tier) solo con
 * cambiar la variable de entorno.
 */
function getChatTTSProvider(): TextToSpeechProvider {
  const explicit = (process.env.CHAT_TTS_PROVIDER || '').trim().toLowerCase();
  if (explicit === 'elevenlabs' || explicit === 'google-cloud' || explicit === 'gemini') {
    return explicit;
  }
  if (isElevenLabsConfigured()) {
    return 'elevenlabs';
  }
  return getConfiguredTTSProvider();
}

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

  if (provider === 'gemini' || provider === 'elevenlabs' || provider === 'google-cloud') {
    return provider;
  }

  // Auto-detect Gemini: accept any of the three key env vars the project uses
  if (process.env.GEMINI_TTS_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) {
    return 'gemini';
  }

  return DEFAULT_TTS_PROVIDER;
}

/**
 * Proveedor para un contexto de síntesis. La lectura de cursos prefiere ElevenLabs;
 * la voz del chat usa el proveedor configurable (`getChatTTSProvider`); cualquier
 * otro contexto usa el proveedor global.
 */
export function resolveProviderForContext(context?: string): TextToSpeechProvider {
  if (context && READING_CONTEXTS.has(context) && isElevenLabsConfigured()) {
    return 'elevenlabs';
  }
  if (context && CHAT_CONTEXTS.has(context)) {
    return getChatTTSProvider();
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

  if (provider === 'google-cloud') {
    return isGoogleCloudTTSConfigured();
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

  if (provider === 'google-cloud') {
    const { voice, model } = resolveGoogleCloudVoiceAndModel();
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

  if (provider === 'google-cloud') {
    return {
      provider,
      response: await synthesizeSpeechWithGoogleCloud(payload),
    };
  }

  return {
    provider,
    response: await synthesizeSpeechWithElevenLabs(payload),
  };
}
