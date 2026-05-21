import type { ElevenLabsVoiceSettings, WebSpeechVoiceSettings } from '../../utils/tts-voice-settings';

export type TextToSpeechProvider = 'elevenlabs' | 'gemini';

export interface TextToSpeechRequestPayload {
  text: string;
  voiceId?: string;
  modelId?: string;
  voiceSettings?: ElevenLabsVoiceSettings;
  speed?: number;
  optimizeStreamingLatency?: number;
  outputFormat?: string;
}

export interface WebSpeechRequestPayload extends WebSpeechVoiceSettings {
  lang: string;
}
