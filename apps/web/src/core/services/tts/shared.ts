export const TTS_API_PATH = '/api/tts';

// Identidad sonora ÚNICA de SofLIA: la misma voz locuta el chat y las lecturas
// (reflexiones), para que el usuario perciba un solo personaje en toda la
// plataforma. El valor por defecto es deliberadamente el de producción: si la
// variable de entorno falta, la voz —y por tanto la clave del caché de audio— no
// cambia, y el audio ya pregenerado sigue siendo válido.
export const DEFAULT_ELEVENLABS_VOICE_ID = 'imFXYz8XIletRKLZZQaA';
export const DEFAULT_ELEVENLABS_MODEL_ID = 'eleven_turbo_v2_5';
// El chat prioriza tiempo-a-primer-audio. Las lecturas conservan Turbo para no
// alterar sus activos cacheados ni su identidad sonora de larga duración.
export const DEFAULT_ELEVENLABS_REALTIME_MODEL_ID = 'eleven_flash_v2_5';

export const DEFAULT_TTS_OUTPUT_FORMAT = 'mp3_22050_32';
export const DEFAULT_TTS_VOLUME = 0.8;
export const MAX_TTS_TEXT_LENGTH = 4000;
export const DEFAULT_TTS_SYNTHESIS_TIMEOUT_MS = 20_000;

/**
 * Idiomas que se declaran a ElevenLabs en `language_code`.
 *
 * Sin este parámetro, Flash/Turbo v2.5 AUTODETECTAN el idioma en cada petición.
 * El chat trocea la respuesta en fragmentos de 8–40 caracteres para arrancar
 * rápido, y en trozos tan cortos —sobre todo si contienen nombres de producto en
 * inglés— la detección falla y la frase se locuta con fonética equivocada.
 * Declararlo explícitamente elimina esa clase de fallo por completo.
 */
export const TTS_LANGUAGES = ['es', 'en', 'pt'] as const;
export type TTSLanguage = (typeof TTS_LANGUAGES)[number];
export const DEFAULT_TTS_LANGUAGE: TTSLanguage = 'es';

/**
 * Rango de `speed` admitido por ElevenLabs dentro de `voice_settings`. Fuera de
 * él la API responde 400, así que la validación de entrada usa estos límites en
 * lugar de un rango inventado.
 */
export const MIN_TTS_SPEED = 0.7;
export const MAX_TTS_SPEED = 1.2;

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
