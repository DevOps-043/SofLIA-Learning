import type { ElevenLabsVoiceSettings, WebSpeechVoiceSettings } from '../../utils/tts-voice-settings';

/**
 * Contexto de síntesis. Determina el tratamiento del texto y si el audio es
 * cacheable:
 *  - 'reading' / 'reading_continuation' → lectura de contenido del curso
 *    (reflexiones, resúmenes). Determinista y sin datos del usuario: se cachea y
 *    se comparte entre usuarios.
 *  - 'chat' / 'chat_continuation' → respuestas conversacionales de SofLIA.
 *    Pueden contener texto introducido por el usuario: NO se cachean nunca.
 */
export type TextToSpeechContext = 'chat' | 'chat_continuation' | 'reading' | 'reading_continuation';

/**
 * Payload de síntesis. La voz y el modelo NO son parte del contrato: los decide
 * el servidor a partir de la configuración, de modo que ningún cliente pueda
 * elegir voz/modelo arbitrarios y consumir cuota de pago con ellos.
 */
export interface TextToSpeechRequestPayload {
  text: string;
  /** Matices de entonación derivados de la personalización de SofLIA. */
  voiceSettings?: ElevenLabsVoiceSettings;
  speed?: number;
  context?: TextToSpeechContext;
}

export interface WebSpeechRequestPayload extends WebSpeechVoiceSettings {
  lang: string;
}
