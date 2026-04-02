import type { StyleConfig } from '../../../../features/business-panel/contexts/OrganizationStylesContext';

export interface OrganizationColors {
  primary?: string;
  accent?: string;
  cardBackground?: string;
  textColor?: string;
}

export interface EmbeddedLiaPanelProps {
  assistantName?: string;
  assistantAvatar?: string;
  initialMessage?: string | null;
  organizationColors?: OrganizationColors;
}

export interface EmbeddedLiaColors {
  primary: string;
  accent: string;
  cardBg: string;
  text: string;
}

export type EmbeddedLiaChatMode = 'context';

export interface EmbeddedLiaModeOption {
  id: EmbeddedLiaChatMode;
  name: string;
  description: string;
  color: string;
}

export interface EmbeddedLiaLinkToken {
  type: 'text' | 'link';
  content: string;
  href?: string;
}

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
  error: string;
}

export interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export interface BrowserSpeechWindow extends Window {
  webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  SpeechRecognition?: new () => BrowserSpeechRecognition;
}

export type EmbeddedLiaThemeStyles = Pick<
  StyleConfig,
  'accent_color' | 'secondary_button_color' | 'card_background' | 'text_color'
>;
