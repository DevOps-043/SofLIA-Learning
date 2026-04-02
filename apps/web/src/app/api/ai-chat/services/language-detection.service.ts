/**
 * Language Detection Service
 * Detects and normalizes the language of user messages for multilingual support.
 */

export const SUPPORTED_LANGUAGES = ['es', 'en', 'pt'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_CONFIG: Record<SupportedLanguage, { instruction: string; fallback: string }> = {
  es: {
    instruction: 'Responde siempre en español de manera natural, cercana y profesional. Usa un tono amigable y motivador.',
    fallback:
      'Estoy aquí para ayudarte con nuestros cursos, talleres y herramientas de IA. Cuéntame qué necesitas y te guiaré paso a paso.',
  },
  en: {
    instruction: 'Always respond in English using a natural, friendly and professional tone.',
    fallback:
      'I am here to help you with our courses, workshops and AI tools. Let me know what you need and I will guide you step by step.',
  },
  pt: {
    instruction: 'Responda sempre em português com um tom natural, amigável e profissional.',
    fallback:
      'Estou aqui para ajudar você com nossos cursos, workshops e ferramentas de IA. Diga o que precisa e eu vou guiá-lo passo a passo.',
  },
};

export function normalizeLanguage(lang?: string): SupportedLanguage {
  if (!lang) return 'es';
  const lower = lang.toLowerCase();
  return SUPPORTED_LANGUAGES.includes(lower as SupportedLanguage) ? (lower as SupportedLanguage) : 'es';
}

/**
 * Detects the language of the user's message based on common keyword patterns.
 */
export function detectMessageLanguage(message: string): SupportedLanguage {
  const lowerMessage = message.toLowerCase().trim();

  const englishPatterns = [
    /^(what|how|where|when|why|can|could|would|should|tell|show|give|help|i want|i need|i'm|i am|what can|what is|what are|how do|how can|how does)/i,
    /\b(the|a|an|is|are|was|were|this|that|these|those|you|your|we|they|their)\b/i,
    /\b(what|how|where|when|why|can|could|would|should|will|would|might)\b/i,
  ];

  const portuguesePatterns = [
    /^(o que|qual|quando|onde|como|por que|você|pode|pode me|me ajuda|preciso|quero|estou|sou|o que é|qual é)/i,
    /\b(você|vocês|eu|nós|eles|elas|o|a|os|as|um|uma|uns|umas)\b/i,
    /\b(que|qual|quando|onde|como|por|para|com|sem|de|do|da|dos|das|em|no|na|nos|nas)\b/i,
  ];

  const englishScore = englishPatterns.reduce((score, p) => score + (p.test(lowerMessage) ? 1 : 0), 0);
  const portugueseScore = portuguesePatterns.reduce((score, p) => score + (p.test(lowerMessage) ? 1 : 0), 0);

  if (englishScore >= 2 || /^(what|how|where|when|why|can|could|would|should)/i.test(lowerMessage)) {
    return 'en';
  }

  if (portugueseScore >= 2 || /^(o que|qual|quando|onde|como|você|pode)/i.test(lowerMessage)) {
    return 'pt';
  }

  return 'es';
}
