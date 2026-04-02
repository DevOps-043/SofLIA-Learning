const CONTEXTUAL_VOICE_GUIDE_SPEECH_LANGUAGE_MAP: Record<string, string> = {
  es: 'es-ES',
  en: 'en-US',
  pt: 'pt-BR',
}

export function getContextualVoiceGuideSpeechLanguage(language: string): string {
  return CONTEXTUAL_VOICE_GUIDE_SPEECH_LANGUAGE_MAP[language] ?? 'es-ES'
}

export function cleanContextualVoiceGuideSpeechText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim()
}
