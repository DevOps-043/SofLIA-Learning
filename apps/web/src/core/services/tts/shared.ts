export const TTS_API_PATH = '/api/tts';

// Identidad sonora ÚNICA de SofLIA: la misma voz locuta el chat y las lecturas
// (reflexiones), para que el usuario perciba un solo personaje en toda la
// plataforma. El valor por defecto es deliberadamente el de producción: si la
// variable de entorno falta, la voz —y por tanto la clave del caché de audio— no
// cambia, y el audio ya pregenerado sigue siendo válido.
export const DEFAULT_ELEVENLABS_VOICE_ID = 'imFXYz8XIletRKLZZQaA';
export const DEFAULT_ELEVENLABS_MODEL_ID = 'eleven_turbo_v2_5';

export const DEFAULT_TTS_OUTPUT_FORMAT = 'mp3_22050_32';
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
