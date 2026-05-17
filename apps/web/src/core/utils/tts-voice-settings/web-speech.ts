import type { SofLIAPersonalizationSettings } from '../../types/soflia-personalization.types'
import type { WebSpeechVoiceSettings } from './types'

const DEFAULT_WEB_SPEECH_SETTINGS: WebSpeechVoiceSettings = {
  rate: 0.9,
  pitch: 1.0,
  volume: 0.8,
}

export function getWebSpeechVoiceSettings(
  settings: SofLIAPersonalizationSettings | null | undefined,
): WebSpeechVoiceSettings {
  if (!settings) {
    return { ...DEFAULT_WEB_SPEECH_SETTINGS }
  }

  const isFriendly = settings.is_friendly ?? false
  const isEnthusiastic = settings.is_enthusiastic ?? false

  if (isFriendly && isEnthusiastic) {
    return { rate: 1.0, pitch: 1.15, volume: 0.85 }
  }

  if (isFriendly) {
    return { rate: 0.85, pitch: 1.05, volume: 0.8 }
  }

  if (isEnthusiastic) {
    return { rate: 1.05, pitch: 1.2, volume: 0.85 }
  }

  return { ...DEFAULT_WEB_SPEECH_SETTINGS }
}
