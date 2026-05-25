import type { Dispatch, SetStateAction } from "react";

export interface BrowserSpeechRecognitionAlternative {
  transcript: string;
}

export interface BrowserSpeechRecognitionResult {
  0: BrowserSpeechRecognitionAlternative;
  length: number;
}

export interface BrowserSpeechRecognitionEvent {
  results: ArrayLike<BrowserSpeechRecognitionResult>;
}

export interface BrowserSpeechRecognitionErrorEvent {
  error?: string;
}

export interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

export interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: new () => BrowserSpeechRecognition;
  webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
}

export interface BrowserSpeechRecognitionMessages {
  notAllowed: string;
  notSupported: string;
  startError: string;
}

export interface UseBrowserSpeechRecognitionParams {
  disabled?: boolean;
  lang: string;
  messages?: BrowserSpeechRecognitionMessages;
  onTranscript: (transcript: string) => void | Promise<void>;
}

export interface UseBrowserSpeechRecognitionResult {
  isListening: boolean;
  setVoiceError: Dispatch<SetStateAction<string | null>>;
  toggleListening: () => Promise<void>;
  voiceError: string | null;
}
