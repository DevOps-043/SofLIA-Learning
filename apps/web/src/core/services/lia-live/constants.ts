// Configuración compartida (sin secretos) de la voz en vivo de SofLIA (Gemini Live).

/** Endpoint que emite el token efímero de corta vida para conectar a Gemini Live. */
export const LIA_LIVE_TOKEN_PATH = '/api/lia/live-token';
export const LIA_LIVE_TRANSCRIPTS_PATH = '/api/lia/live-transcripts';

/**
 * Modelo Live nativo por defecto. Se mantiene configurable con GEMINI_LIVE_MODEL
 * porque los IDs preview pueden cambiar sin esperar un release de la app.
 */
export const DEFAULT_LIA_LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';

/** Voz prebuilt; el acento es-MX se refuerza vía systemInstruction. */
export const DEFAULT_LIA_LIVE_VOICE = 'Zephyr';
export const LIA_LIVE_LANGUAGE_CODE = 'es-US';

// Gemini Live: entrada PCM16 mono a 16 kHz; salida PCM16 mono a 24 kHz.
export const LIA_LIVE_INPUT_SAMPLE_RATE = 16000;
export const LIA_LIVE_OUTPUT_SAMPLE_RATE = 24000;
export const LIA_LIVE_INPUT_MIME_TYPE = `audio/pcm;rate=${LIA_LIVE_INPUT_SAMPLE_RATE}`;

export function isNativeAudioLiveModel(model: string): boolean {
  return model.toLowerCase().includes('native-audio');
}

/** Persona/dirección de voz de SofLIA para la sesión en vivo. */
export const LIA_LIVE_SYSTEM_INSTRUCTION = [
  'Eres SofLIA, la asistente educativa de la plataforma.',
  'Hablas en español de México, con acento mexicano neutro: cálida, cercana,',
  'natural y profesional. Responde de forma concisa y conversacional (no leas',
  'listas largas en voz alta). Si no sabes algo, dilo con honestidad. Evita sonar',
  'robótica o exagerada.',
].join(' ');

/** Clave localStorage del toggle de voz en vivo (opt-in, por dispositivo). */
export const LIA_LIVE_ENABLED_STORAGE_KEY = 'soflia-live-voice-enabled';
