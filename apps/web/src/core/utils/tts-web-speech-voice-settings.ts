import type { SofLIAPersonalizationSettings } from '../types/soflia-personalization.types';
import type { WebSpeechVoiceSettings } from './tts-voice-settings.types';

export function getWebSpeechVoiceSettings(
  settings: SofLIAPersonalizationSettings | null | undefined
): WebSpeechVoiceSettings {
  let rate = 0.9;
  let pitch = 1.0;
  let volume = 0.8;

  if (!settings) {
    return { rate, pitch, volume };
  }

  const isFriendly = settings.is_friendly ?? false;
  const isEnthusiastic = settings.is_enthusiastic ?? false;

  if (isFriendly && isEnthusiastic) {
    rate = 1.0;
    pitch = 1.15;
    volume = 0.85;
  } else if (isFriendly) {
    rate = 0.85;
    pitch = 1.05;
  } else if (isEnthusiastic) {
    rate = 1.05;
    pitch = 1.2;
    volume = 0.85;
  }

  return { rate, pitch, volume };
}
