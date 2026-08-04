/**
 * Ajustes de voz de ElevenLabs.
 *
 * `style` y `use_speaker_boost` son OPCIONALES a propósito: los modelos que usa
 * la plataforma (`eleven_flash_v2_5` en el chat y `eleven_turbo_v2_5` en las
 * lecturas) declaran `can_use_style: false` y `can_use_speaker_boost: false` en
 * `GET /v1/models`, así que enviarlos no surte ningún efecto. Solo
 * `eleven_multilingual_v2` los soporta. Omitirlos evita que el código aparente
 * configurar algo que el proveedor ignora.
 */
export interface ElevenLabsVoiceSettings {
  stability: number
  similarity_boost: number
  style?: number
  use_speaker_boost?: boolean
  /**
   * Velocidad de locución. ElevenLabs la valida DENTRO de `voice_settings` y
   * solo acepta el rango 0.7–1.2; fuera de ese rango responde 400.
   */
  speed?: number
}

export interface WebSpeechVoiceSettings {
  rate: number
  pitch: number
  volume: number
}
