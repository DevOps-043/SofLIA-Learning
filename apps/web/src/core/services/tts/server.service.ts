import 'server-only';

import type { TextToSpeechContext, TextToSpeechRequestPayload } from './types';
import {
  DEFAULT_ELEVENLABS_MODEL_ID,
  DEFAULT_ELEVENLABS_VOICE_ID,
  DEFAULT_TTS_OUTPUT_FORMAT,
  getTTSSynthesisTimeoutMs,
} from './shared';

/**
 * Síntesis de voz de SofLIA. ElevenLabs es el único proveedor: sintetiza texto
 * largo en una sola petición, devuelve MP3 comprimido y es el más rápido de los
 * evaluados para los tamaños de fragmento que usa el chat.
 */

const ELEVENLABS_TTS_ENDPOINT = 'https://api.elevenlabs.io/v1/text-to-speech';

/**
 * Identificador del proveedor DENTRO de la clave del caché de audio. Es un valor
 * CONGELADO del contrato de hash: cambiarlo invalidaría todo el audio de lectura
 * ya pregenerado en Storage y obligaría a re-sintetizarlo (coste y cuota).
 */
const TTS_CACHE_PROVIDER_ID = 'elevenlabs';

/**
 * Nombre del proveedor para logs, cabeceras y cuerpos de error. Deliberadamente
 * separado de `TTS_CACHE_PROVIDER_ID`: son dos contratos distintos (observabilidad
 * vs. clave de caché) que pueden evolucionar por razones distintas.
 */
export const TTS_PROVIDER_NAME = 'elevenlabs';

/**
 * Únicamente la clave server-only. Nunca `NEXT_PUBLIC_ELEVENLABS_API_KEY`: las
 * variables con ese prefijo se inlinean en el bundle del navegador, y una clave
 * de un proveedor de pago expuesta ahí puede ser extraída y usada por cualquiera.
 */
function getElevenLabsApiKey() {
  return process.env.ELEVENLABS_API_KEY || null;
}

function getElevenLabsVoiceId() {
  return process.env.ELEVENLABS_VOICE_ID || DEFAULT_ELEVENLABS_VOICE_ID;
}

function getElevenLabsModelId() {
  return process.env.ELEVENLABS_MODEL_ID || DEFAULT_ELEVENLABS_MODEL_ID;
}

export function isElevenLabsConfigured() {
  return Boolean(getElevenLabsApiKey());
}

export async function synthesizeSpeech(payload: TextToSpeechRequestPayload) {
  const apiKey = getElevenLabsApiKey();

  if (!apiKey) {
    throw new Error('ELEVENLABS_NOT_CONFIGURED');
  }

  const url = new URL(`${ELEVENLABS_TTS_ENDPOINT}/${getElevenLabsVoiceId()}`);
  url.searchParams.set('output_format', DEFAULT_TTS_OUTPUT_FORMAT);

  return fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    // Timeout duro para que la ruta serverless falle limpio en vez de colgarse.
    signal: AbortSignal.timeout(getTTSSynthesisTimeoutMs()),
    body: JSON.stringify({
      text: payload.text,
      model_id: getElevenLabsModelId(),
      voice_settings: payload.voiceSettings,
      speed: payload.speed,
    }),
  });
}

export interface TTSCacheDescriptor {
  provider: string;
  voice: string;
  model: string;
  context: TextToSpeechContext;
}

/**
 * Describe la voz/modelo que se usarán realmente para este payload. Es la base de
 * la clave del caché de audio: garantiza que el audio cacheado corresponda
 * exactamente a la voz/modelo que produciría la síntesis.
 */
export function resolveTTSCacheDescriptor(
  payload: TextToSpeechRequestPayload,
): TTSCacheDescriptor {
  return {
    provider: TTS_CACHE_PROVIDER_ID,
    voice: getElevenLabsVoiceId(),
    model: getElevenLabsModelId(),
    context: payload.context ?? 'chat',
  };
}
