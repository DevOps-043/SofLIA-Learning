import type { TextToSpeechRequestPayload } from './types';
import {
  DEFAULT_GOOGLE_CLOUD_TTS_LANGUAGE,
  DEFAULT_GOOGLE_CLOUD_TTS_VOICE,
  getTTSSynthesisTimeoutMs,
} from './shared';

/**
 * Google Cloud Text-to-Speech (REST). Es el producto de TTS "de producción" de
 * Google, distinto del Gemini TTS preview: voces Neural2/Chirp3, salida MP3
 * comprimida, baja latencia, free tier mensual y facturación normal de GCP (los
 * créditos de la cuenta aplican). Autentica con API key (`?key=`), igual patrón
 * que el resto de integraciones del proyecto.
 */

interface GoogleCloudTTSResponse {
  audioContent?: string;
}

function getGoogleCloudTTSApiKey() {
  return process.env.GOOGLE_CLOUD_TTS_API_KEY || null;
}

function getGoogleCloudTTSVoice() {
  return process.env.GOOGLE_CLOUD_TTS_VOICE || DEFAULT_GOOGLE_CLOUD_TTS_VOICE;
}

function getGoogleCloudTTSLanguage() {
  return process.env.GOOGLE_CLOUD_TTS_LANGUAGE || DEFAULT_GOOGLE_CLOUD_TTS_LANGUAGE;
}

export function isGoogleCloudTTSConfigured() {
  return Boolean(getGoogleCloudTTSApiKey());
}

/**
 * Voz/idioma que se usarán realmente. Lo consume la clave del caché de audio para
 * reflejar fielmente lo que se sintetiza (el `model` lo modelamos como el código
 * de idioma, ya que Google selecciona el motor por nombre de voz + languageCode).
 */
export function resolveGoogleCloudVoiceAndModel() {
  return {
    voice: getGoogleCloudTTSVoice(),
    model: getGoogleCloudTTSLanguage(),
  };
}

export async function synthesizeSpeechWithGoogleCloud(payload: TextToSpeechRequestPayload) {
  const apiKey = getGoogleCloudTTSApiKey();

  if (!apiKey) {
    throw new Error('GOOGLE_CLOUD_TTS_NOT_CONFIGURED');
  }

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Timeout duro para que la ruta serverless falle limpio en vez de colgarse.
      signal: AbortSignal.timeout(getTTSSynthesisTimeoutMs()),
      body: JSON.stringify({
        input: { text: payload.text },
        voice: {
          languageCode: getGoogleCloudTTSLanguage(),
          name: getGoogleCloudTTSVoice(),
        },
        audioConfig: {
          audioEncoding: 'MP3',
          // `speakingRate` solo si viene en el payload; las voces Chirp3-HD
          // ignoran algunos parámetros, así que lo mantenemos mínimo por defecto.
          ...(payload.speed ? { speakingRate: payload.speed } : {}),
        },
      }),
    },
  );

  if (!response.ok) {
    // Devolvemos la respuesta cruda: la capa de orquestación la traduce a error.
    return response;
  }

  const data = (await response.json()) as GoogleCloudTTSResponse;

  if (!data.audioContent) {
    return Response.json(
      {
        error: 'Google Cloud TTS response did not include audio data',
        code: 'GOOGLE_CLOUD_TTS_AUDIO_MISSING',
      },
      { status: 502 },
    );
  }

  const audioBytes = Buffer.from(data.audioContent, 'base64');
  return new Response(audioBytes, {
    status: 200,
    headers: { 'Content-Type': 'audio/mpeg' },
  });
}
