export const TTS_API_PATH = '/api/tts';

export const DEFAULT_TTS_PROVIDER = 'elevenlabs';
export const DEFAULT_ELEVENLABS_VOICE_ID = 'ay4iqk10DLwc8KGSrf2t';
export const DEFAULT_ELEVENLABS_MODEL_ID = 'eleven_turbo_v2_5';
// gemini-2.5-flash-preview-tts is stable and fast; 3.1 is still unreliable in v1beta
export const DEFAULT_GEMINI_TTS_MODEL_ID = 'gemini-2.5-flash-preview-tts';
export const DEFAULT_GEMINI_TTS_VOICE_NAME = 'Sulafat';
// Zephyr (Bright) — female voice, high-pitched, clear and sweet, ideal for educational narration
export const DEFAULT_GEMINI_TTS_READING_VOICE_NAME = 'Zephyr';
export const DEFAULT_TTS_OUTPUT_FORMAT = 'mp3_22050_32';
export const DEFAULT_TTS_OPTIMIZE_STREAMING_LATENCY = 4;
export const DEFAULT_TTS_VOLUME = 0.8;
export const MAX_TTS_TEXT_LENGTH = 4000;

// Versión de los prompts/voz de síntesis. Forma parte de la clave del caché de
// audio: incrementar este número invalida el audio cacheado cuando cambian los
// prompts o la voz, evitando servir audio obsoleto.
export const TTS_PROMPT_VERSION = 1;
