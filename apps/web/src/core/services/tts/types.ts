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
  /**
   * 'reading'              → full narrator prompt + audio tags (first chunk or single request)
   * 'reading_continuation' → minimal continuation prompt (subsequent chunks, fewer tokens)
   * 'chat'                 → SofLIA conversational prompt
   */
  context?: 'chat' | 'reading' | 'reading_continuation';
}

export interface WebSpeechRequestPayload extends WebSpeechVoiceSettings {
  lang: string;
}
