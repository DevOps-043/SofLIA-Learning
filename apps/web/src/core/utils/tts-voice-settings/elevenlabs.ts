import type { SofLIAPersonalizationSettings } from '../../types/soflia-personalization.types'
import type { ElevenLabsVoiceSettings } from './types'

const DEFAULT_ELEVENLABS_SETTINGS: ElevenLabsVoiceSettings = {
  stability: 0.4,
  similarity_boost: 0.65,
  style: 0.3,
  use_speaker_boost: false,
}

export function getElevenLabsVoiceSettings(
  settings: SofLIAPersonalizationSettings | null | undefined,
): ElevenLabsVoiceSettings {
  if (!settings) {
    return { ...DEFAULT_ELEVENLABS_SETTINGS }
  }

  const isFriendly = settings.is_friendly ?? false
  const isEnthusiastic = settings.is_enthusiastic ?? false

  if (isFriendly && isEnthusiastic) {
    return {
      stability: 0.35,
      similarity_boost: 0.7,
      style: 0.5,
      use_speaker_boost: true,
    }
  }

  if (isFriendly) {
    return {
      stability: 0.45,
      similarity_boost: 0.7,
      style: 0.4,
      use_speaker_boost: false,
    }
  }

  if (isEnthusiastic) {
    return {
      stability: 0.3,
      similarity_boost: 0.65,
      style: 0.6,
      use_speaker_boost: true,
    }
  }

  return { ...DEFAULT_ELEVENLABS_SETTINGS }
}
