import 'server-only';

import type { ElevenLabsVoiceSettings } from '../../utils/tts-voice-settings';
import type { TextToSpeechContext, TextToSpeechRequestPayload } from './types';
import {
  DEFAULT_ELEVENLABS_MODEL_ID,
  DEFAULT_ELEVENLABS_REALTIME_MODEL_ID,
  DEFAULT_ELEVENLABS_VOICE_ID,
  DEFAULT_TTS_LANGUAGE,
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

function isRealtimeContext(context?: TextToSpeechContext) {
  return context === 'chat' || context === 'chat_continuation';
}

function getElevenLabsModelId(context?: TextToSpeechContext) {
  if (isRealtimeContext(context)) {
    return process.env.ELEVENLABS_REALTIME_MODEL_ID || DEFAULT_ELEVENLABS_REALTIME_MODEL_ID;
  }

  return process.env.ELEVENLABS_MODEL_ID || DEFAULT_ELEVENLABS_MODEL_ID;
}

export function isElevenLabsConfigured() {
  return Boolean(getElevenLabsApiKey());
}

function envNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Ajustes de voz que se aplican cuando quien llama no especifica ninguno — hoy,
 * el chat en streaming.
 *
 * Antes, esa ausencia hacía que ElevenLabs cayera en los ajustes guardados en el
 * dashboard de la voz: configuración que vive fuera del repositorio, que nadie
 * versiona y que cualquiera con acceso al panel puede cambiar sin desplegar. El
 * timbre de SofLIA era así irreproducible desde el código, que es justo lo que
 * hace que un fallo de audio se perciba como "a veces".
 *
 * `stability` alta prioriza consistencia sobre expresividad, que es lo que pide
 * un asistente que locuta datos y rutas. Ajustable por entorno para calibrar de
 * oído sin redesplegar.
 */
function getDefaultVoiceSettings(): ElevenLabsVoiceSettings {
  return {
    stability: envNumber(process.env.ELEVENLABS_DEFAULT_STABILITY, 0.5),
    similarity_boost: envNumber(process.env.ELEVENLABS_DEFAULT_SIMILARITY, 0.75),
  };
}

export async function synthesizeSpeech(payload: TextToSpeechRequestPayload) {
  const apiKey = getElevenLabsApiKey();

  if (!apiKey) {
    throw new Error('ELEVENLABS_NOT_CONFIGURED');
  }

  const url = new URL(`${ELEVENLABS_TTS_ENDPOINT}/${getElevenLabsVoiceId()}`);
  url.searchParams.set('output_format', DEFAULT_TTS_OUTPUT_FORMAT);

  const voiceSettings = payload.voiceSettings ?? getDefaultVoiceSettings();

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
      model_id: getElevenLabsModelId(payload.context),
      // Sin `language_code` los modelos v2.5 autodetectan el idioma en CADA
      // petición; con los fragmentos cortos del chat esa detección falla y la
      // frase sale con fonética de otro idioma.
      language_code: payload.language ?? DEFAULT_TTS_LANGUAGE,
      // Expande cifras, porcentajes, fechas y monedas a palabras. Sin esto (por
      // defecto 'auto') el modelo del chat se salta la expansión: medido, "3,03 %"
      // pasa de ~3.0 s a ~4.0 s de audio al activarlo, y no añade latencia
      // apreciable frente a 'auto'.
      apply_text_normalization: 'on',
      // `speed` pertenece a `voice_settings`: en la raíz del cuerpo ElevenLabs lo
      // acepta con 200 y lo ignora en silencio.
      voice_settings: payload.speed
        ? { ...voiceSettings, speed: payload.speed }
        : voiceSettings,
      // Contexto de prosodia del fragmento anterior, para que la entonación no
      // se reinicie en cada corte del streaming. No se sintetiza ni se factura.
      ...(payload.previousText ? { previous_text: payload.previousText } : {}),
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
    model: getElevenLabsModelId(payload.context),
    context: payload.context ?? 'chat',
  };
}
