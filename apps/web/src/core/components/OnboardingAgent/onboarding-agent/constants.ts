import type { ElevenLabsVoiceSettings, WebSpeechVoiceSettings } from '../../../utils/tts-voice-settings';

export const OPEN_ONBOARDING_EVENT = 'open-onboarding';
export const ONBOARDING_STORAGE_KEY = 'has-seen-onboarding';
export const ONBOARDING_AUTO_OPEN_PATH = '/dashboard';

// `style` y `use_speaker_boost` quedan fuera: los modelos v2.5 que locutan el
// onboarding los ignoran. Estabilidad algo más alta que la anterior (0.4) para
// que el guion suene consistente entre reproducciones.
export const ONBOARDING_VOICE_SETTINGS: ElevenLabsVoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.75,
};

export const ONBOARDING_WEB_SPEECH_SETTINGS: WebSpeechVoiceSettings & { lang: string } = {
  lang: 'es-ES',
  rate: 0.9,
  pitch: 1,
  volume: 1,
};
