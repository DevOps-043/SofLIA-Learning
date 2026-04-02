import type { ElevenLabsVoiceSettings, WebSpeechVoiceSettings } from '../../../utils/tts-voice-settings';

export const OPEN_ONBOARDING_EVENT = 'open-onboarding';
export const ONBOARDING_STORAGE_KEY = 'has-seen-onboarding';
export const ONBOARDING_AUTO_OPEN_PATH = '/dashboard';

export const ONBOARDING_VOICE_SETTINGS: ElevenLabsVoiceSettings = {
  stability: 0.4,
  similarity_boost: 0.65,
  style: 0.3,
  use_speaker_boost: false,
};

export const ONBOARDING_WEB_SPEECH_SETTINGS: WebSpeechVoiceSettings & { lang: string } = {
  lang: 'es-ES',
  rate: 0.9,
  pitch: 1,
  volume: 1,
};
