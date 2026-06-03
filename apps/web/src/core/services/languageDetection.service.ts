import { logger as techDebtLogger } from '@/lib/utils/logger'

import { calculateGeminiMetadata, trackAICall } from '../../lib/ai/usage-monitor'

type DetectableLanguage = 'es' | 'en' | 'pt'

export class LanguageDetectionService {
  static async detectLanguage(text: string): Promise<DetectableLanguage> {
    if (!text || text.trim().length === 0) {
      return 'es'
    }

    if (!process.env.GOOGLE_API_KEY && !process.env.GEMINI_API_KEY) {
      techDebtLogger.warn('[LanguageDetectionService] Gemini no configurado, usando deteccion basica.')
      return this.detectLanguageBasic(text)
    }

    if (text.trim().length < 50) {
      return this.detectLanguageBasic(text)
    }

    try {
      const systemPrompt = `Eres un detector de idiomas especializado.
Identifica el idioma del texto proporcionado.

Idiomas soportados:
- es para espanol
- en para ingles
- pt para portugues brasileno

Responde UNICAMENTE con el codigo del idioma: es, en o pt.`

      const userPrompt = `Cual es el idioma del siguiente texto?

Texto:
${text.substring(0, 1000)}${text.length > 1000 ? '...' : ''}`

      const { generateGeminiText, resolveGeminiModel } = await import('../../lib/gemini/client')
      const startTime = Date.now()
      const model = resolveGeminiModel(
        process.env.LANGUAGE_DETECTION_GEMINI_MODEL,
        'gemini-3.5-flash',
      )
      const result = await generateGeminiText({
        circuitBreakerName: 'gemini-language-detection',
        generationConfig: {
          maxOutputTokens: 10,
          temperature: 0.1,
        },
        model,
        prompt: userPrompt,
        systemInstruction: systemPrompt,
      })
      const responseTime = Date.now() - startTime

      if (result.usage) {
        await trackAICall(calculateGeminiMetadata(
          result.usage,
          result.model,
          'language-detection',
          undefined,
          responseTime,
        ))
      }

      const detectedLang = result.text.trim().toLowerCase()
      if (detectedLang === 'es' || detectedLang === 'en' || detectedLang === 'pt') {
        return detectedLang
      }

      techDebtLogger.warn(
        `[LanguageDetectionService] Idioma detectado no valido: "${detectedLang}", usando deteccion basica.`,
      )
      return this.detectLanguageBasic(text)
    } catch (error) {
      techDebtLogger.error('[LanguageDetectionService] Error detectando idioma con Gemini:', error)
      return this.detectLanguageBasic(text)
    }
  }

  private static detectLanguageBasic(text: string): DetectableLanguage {
    const lowerText = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()

    const spanishSignals = [
      /\b(hola|estas|espanol|gracias|puedes|ayudame|necesito)\b/i,
      /^(que|cual|cuando|donde|por que)\b/i,
    ]

    if (spanishSignals.some((pattern) => pattern.test(lowerText))) {
      return 'es'
    }

    const englishPatterns = [
      /\b(the|a|an|is|are|was|were|this|that|these|those|you|your|we|they|their|what|how|where|when|why|can|could|would|should|will)\b/i,
      /^(what|how|where|when|why|can|could|would|should|tell|show|give|help|i want|i need|i'm|i am)\b/i,
    ]

    const portuguesePatterns = [
      /\b(voce|voces|eu|nos|eles|elas|o|a|os|as|um|uma|uns|umas|que|qual|quando|onde|como|por|para|com|sem|de|do|da|dos|das|em|no|na|nos|nas)\b/i,
      /^(o que|qual|quando|onde|como|por que|voce|pode|pode me|me ajuda|preciso|quero|estou|sou|o que e|qual e)\b/i,
    ]

    const englishScore = englishPatterns.reduce((score, pattern) => {
      const matches = lowerText.match(pattern)
      return score + (matches ? matches.length : 0)
    }, 0)

    const portugueseScore = portuguesePatterns.reduce((score, pattern) => {
      const matches = lowerText.match(pattern)
      return score + (matches ? matches.length : 0)
    }, 0)

    if (englishScore > portugueseScore && englishScore >= 2) {
      return 'en'
    }

    if (portugueseScore > englishScore && portugueseScore >= 2) {
      return 'pt'
    }

    return 'es'
  }

  static async detectLanguageFromMultipleTexts(texts: string[]): Promise<DetectableLanguage> {
    if (!texts || texts.length === 0) {
      return 'es'
    }

    const validTexts = texts.filter((text) => text && text.trim().length > 0)
    if (validTexts.length === 0) {
      return 'es'
    }

    if (validTexts.length === 1) {
      return this.detectLanguage(validTexts[0])
    }

    const textsToCheck = validTexts.slice(0, 5)
    const detectedLanguages = await Promise.all(
      textsToCheck.map((text) => this.detectLanguage(text)),
    )

    const counts: Record<DetectableLanguage, number> = { en: 0, es: 0, pt: 0 }
    detectedLanguages.forEach((lang) => {
      counts[lang] += 1
    })

    return Object.entries(counts).reduce((a, b) =>
      counts[a[0] as DetectableLanguage] > counts[b[0] as DetectableLanguage] ? a : b,
    )[0] as DetectableLanguage
  }
}
