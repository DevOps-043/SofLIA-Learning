/**
 * TTS Voice Settings Utilities
 * 
 * Utilidades para calcular parámetros de voz según la personalización de tono de LIA
 * Aplica ajustes de voz para tonos amigable y entusiasta
 */

import type { SofLIAPersonalizationSettings } from '../types/soflia-personalization.types';

/**
 * Parámetros de voz para ElevenLabs API
 */
export interface ElevenLabsVoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

/**
 * Parámetros de voz para Web Speech API
 */
export interface WebSpeechVoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
}

/**
 * Calcula los parámetros de voz para ElevenLabs según la personalización de tono
 * 
 * @param settings - Configuración de personalización de LIA
 * @returns Parámetros de voz optimizados para ElevenLabs
 */
export function getElevenLabsVoiceSettings(
  settings: SofLIAPersonalizationSettings | null | undefined
): ElevenLabsVoiceSettings {
  // Valores por defecto (neutral)
  let stability = 0.4;
  let similarity_boost = 0.65;
  let style = 0.3;
  let use_speaker_boost = false;

  if (!settings) {
    return { stability, similarity_boost, style, use_speaker_boost };
  }

  const isFriendly = settings.is_friendly ?? false;
  const isEnthusiastic = settings.is_enthusiastic ?? false;

  // Si ambos están activos, combinamos los efectos
  if (isFriendly && isEnthusiastic) {
    // Tono amigable y entusiasta: más expresivo y energético
    stability = 0.35; // Menos estable = más variación en el tono
    similarity_boost = 0.7; // Mayor similitud con la voz original
    style = 0.5; // Más estilo = más expresivo
    use_speaker_boost = true; // Boost para más energía
  } else if (isFriendly) {
    // Solo amigable: tono cálido y cercano
    stability = 0.45; // Más estable = tono más consistente y cálido
    similarity_boost = 0.7; // Mayor similitud
    style = 0.4; // Estilo moderado
    use_speaker_boost = false;
  } else if (isEnthusiastic) {
    // Solo entusiasta: tono energético y dinámico
    stability = 0.3; // Menos estable = más variación y energía
    similarity_boost = 0.65;
    style = 0.6; // Más estilo = más dinámico
    use_speaker_boost = true; // Boost para energía
  }
  // Si ninguno está activo, usamos los valores por defecto (neutral)

  return {
    stability,
    similarity_boost,
    style,
    use_speaker_boost,
  };
}

/**
 * Calcula los parámetros de voz para Web Speech API según la personalización de tono
 * 
 * @param settings - Configuración de personalización de LIA
 * @returns Parámetros de voz optimizados para Web Speech API
 */
export function getWebSpeechVoiceSettings(
  settings: SofLIAPersonalizationSettings | null | undefined
): WebSpeechVoiceSettings {
  // Valores por defecto (neutral)
  let rate = 0.9; // Velocidad de habla (0.1 - 10)
  let pitch = 1.0; // Tono de voz (0 - 2)
  let volume = 0.8; // Volumen (0 - 1)

  if (!settings) {
    return { rate, pitch, volume };
  }

  const isFriendly = settings.is_friendly ?? false;
  const isEnthusiastic = settings.is_enthusiastic ?? false;

  // Si ambos están activos, combinamos los efectos
  if (isFriendly && isEnthusiastic) {
    // Tono amigable y entusiasta: más expresivo y energético
    rate = 1.0; // Más rápido = más energético
    pitch = 1.15; // Pitch más alto = más entusiasta y amigable
    volume = 0.85; // Volumen ligeramente más alto
  } else if (isFriendly) {
    // Solo amigable: tono cálido y cercano
    rate = 0.85; // Más lento = más cálido y relajado
    pitch = 1.05; // Pitch ligeramente más alto = más amigable
    volume = 0.8; // Volumen normal
  } else if (isEnthusiastic) {
    // Solo entusiasta: tono energético y dinámico
    rate = 1.05; // Más rápido = más energético
    pitch = 1.2; // Pitch más alto = más entusiasta
    volume = 0.85; // Volumen ligeramente más alto
  }
  // Si ninguno está activo, usamos los valores por defecto (neutral)

  return {
    rate,
    pitch,
    volume,
  };
}










