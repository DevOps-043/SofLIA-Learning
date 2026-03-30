import type { NanoBananaSchema, NanoBananaDomain, OutputFormat } from '../../../lib/nanobana/templates';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  generatedPrompt?: GeneratedPrompt | null;
  generatedNanoBanana?: {
    schema: NanoBananaSchema;
    jsonString: string;
    domain: NanoBananaDomain;
    outputFormat: OutputFormat;
  } | null;
}

export interface GeneratedPrompt {
  title: string;
  description: string;
  content: string;
  tags: string[];
  difficulty_level: string;
  use_cases: string[];
  tips: string[];
}

export interface AIChatAgentProps {
  assistantName?: string;
  assistantAvatar?: string;
  initialMessage?: string;
  promptPlaceholder?: string;
  context?: string;
}

export type LiaMode = 'normal' | 'prompt' | 'analysis' | 'nanobana';

export const MAX_CONTEXT_MESSAGES = 7;
