export const LIA_SPEECH_LANGUAGE_MAP: Record<string, string> = {
  es: 'es-ES',
  en: 'en-US',
  pt: 'pt-BR',
};

export function getLiaSpeechLanguage(language?: string): string {
  return LIA_SPEECH_LANGUAGE_MAP[language ?? 'es'] ?? 'es-ES';
}

export function cleanTextForLiaTTS(text: string): string {
  if (!text) {
    return text;
  }

  let cleaned = text;
  cleaned = cleaned.replace(/```[\w]*\n?[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
  cleaned = cleaned.replace(/([^*\n])\*([^*\n]+)\*([^*\n])/g, '$1$2$3');
  cleaned = cleaned.replace(/([^_\n])_([^_\n]+)_([^_\n])/g, '$1$2$3');
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  cleaned = cleaned.replace(/^>\s+/gm, '');
  cleaned = cleaned.replace(/^[-*]{3,}$/gm, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  return cleaned.trim();
}
