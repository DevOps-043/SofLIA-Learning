import type { SofLIAPersonalizationSettings } from '../types/soflia-personalization.types';
import type { ElevenLabsVoiceSettings } from './tts-voice-settings.types';

export function getElevenLabsVoiceSettings(
  settings: SofLIAPersonalizationSettings | null | undefined
): ElevenLabsVoiceSettings {
  let stability = 0.4;
  let similarity_boost = 0.65;
  let style = 0.3;
  let use_speaker_boost = false;

  if (!settings) {
    return { stability, similarity_boost, style, use_speaker_boost };
  }

  const isFriendly = settings.is_friendly ?? false;
  const isEnthusiastic = settings.is_enthusiastic ?? false;

  if (isFriendly && isEnthusiastic) {
    stability = 0.35;
    similarity_boost = 0.7;
    style = 0.5;
    use_speaker_boost = true;
  } else if (isFriendly) {
    stability = 0.45;
    similarity_boost = 0.7;
    style = 0.4;
  } else if (isEnthusiastic) {
    stability = 0.3;
    style = 0.6;
    use_speaker_boost = true;
  }

  return {
    stability,
    similarity_boost,
    style,
    use_speaker_boost,
  };
}
