export const TTS_API_PATH = '/api/tts';

export const DEFAULT_TTS_PROVIDER = 'elevenlabs';
export const DEFAULT_ELEVENLABS_VOICE_ID = 'ay4iqk10DLwc8KGSrf2t';
export const DEFAULT_ELEVENLABS_MODEL_ID = 'eleven_turbo_v2_5';
// Modelo TTS de Gemini. Override con GEMINI_TTS_MODEL si el id de API difiere.
export const DEFAULT_GEMINI_TTS_MODEL_ID = 'gemini-3.1-flash-tts-preview';
export const DEFAULT_GEMINI_TTS_VOICE_NAME = 'Sulafat';
// Zephyr (Bright) — female voice, high-pitched, clear and sweet, ideal for educational narration
export const DEFAULT_GEMINI_TTS_READING_VOICE_NAME = 'Zephyr';
export const DEFAULT_TTS_OUTPUT_FORMAT = 'mp3_22050_32';
export const DEFAULT_TTS_OPTIMIZE_STREAMING_LATENCY = 4;
export const DEFAULT_TTS_VOLUME = 0.8;
export const MAX_TTS_TEXT_LENGTH = 4000;
export const DEFAULT_TTS_SYNTHESIS_TIMEOUT_MS = 20_000;

export function getTTSSynthesisTimeoutMs() {
  const raw = Number(process.env.TTS_SYNTHESIS_TIMEOUT_MS || DEFAULT_TTS_SYNTHESIS_TIMEOUT_MS);

  if (!Number.isFinite(raw)) {
    return DEFAULT_TTS_SYNTHESIS_TIMEOUT_MS;
  }

  return Math.min(Math.max(Math.trunc(raw), 5_000), 55_000);
}

// Versión de los prompts/voz de síntesis. Forma parte de la clave del caché de
// audio: incrementar este número invalida el audio cacheado cuando cambian los
// prompts o la voz, evitando servir audio obsoleto.
export const TTS_PROMPT_VERSION = 2;
