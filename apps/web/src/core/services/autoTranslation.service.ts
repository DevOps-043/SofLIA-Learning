import { logger as techDebtLogger } from '@/lib/utils/logger'

import type { SupportedLanguage } from '../i18n/i18n'
import { calculateAiUsageMetadata, trackAICall } from '../../lib/ai/usage-monitor'
import { buildTranslationSystemPrompt } from './ai-small-prompts'
import {
  generateAiText,
  isAiPurposeAvailable,
} from '../../lib/ai/providers/ai-text-gateway.server'

type TargetLanguage = SupportedLanguage
type SourceLanguage = 'es' | 'en' | 'pt'

interface TranslationOptions {
  context?: string
  preserveFormatting?: boolean
  sourceLanguage?: SourceLanguage
}

export class AutoTranslationService {
  /**
   * Comprueba la credencial del proveedor CONFIGURADO para la traducción, no la
   * de Gemini: si el propósito se cambia a un modelo de OpenAI desde el panel,
   * la clave que debe existir es la de OpenAI.
   */
  private static async isConfigured(): Promise<boolean> {
    const isConfigured = await isAiPurposeAvailable('auto_translation')

    if (!isConfigured) {
      techDebtLogger.error(
        '[AutoTranslationService] El proveedor de IA configurado para la traducción no tiene credenciales.',
        { nodeEnv: process.env.NODE_ENV },
      )
    }

    return isConfigured
  }

  static async translateText(
    text: string,
    targetLanguage: TargetLanguage,
    options: TranslationOptions = {},
  ): Promise<string> {
    if (!text || text.trim().length === 0) {
      return text
    }

    const sourceLanguage = options.sourceLanguage
    if (!sourceLanguage) {
      techDebtLogger.error('[AutoTranslationService] sourceLanguage no proporcionado en options.', options)
      techDebtLogger.warn('[AutoTranslationService] Asumiendo espanol por defecto.')
    }

    const finalSourceLanguage = sourceLanguage || 'es'

    if (finalSourceLanguage === targetLanguage) {
      return text
    }

    if (!(await this.isConfigured())) {
      techDebtLogger.warn(
        '[AutoTranslationService] Proveedor de IA no configurado, retornando texto original.',
      )
      return text
    }

    const languageNames: Record<SourceLanguage | TargetLanguage, string> = {
      en: 'ingles',
      es: 'espanol',
      pt: 'portugues brasileno',
    }

    const sourceLangName = languageNames[finalSourceLanguage]
    const targetLangName = languageNames[targetLanguage]
    const contextPrompt = options.context ? `\n\nContexto: ${options.context}` : ''


    const userPrompt = `Traduce el siguiente texto del ${sourceLangName} al ${targetLangName}.${contextPrompt}

Texto original:
${text}

Traduccion:`

    try {
      const startTime = Date.now()
      const result = await generateAiText({
        circuitBreakerName: 'gemini-auto-translation',
        // No administrable: el presupuesto se dimensiona por longitud del texto
        // a traducir; fijarlo desde el panel truncaría traducciones largas.
        maxOutputTokens: Math.min(4000, Math.ceil(text.length * 2)),
        prompt: userPrompt,
        purpose: 'auto_translation',
        systemInstruction: (profile) =>
          buildTranslationSystemPrompt(profile, {
            preserveFormatting: Boolean(options.preserveFormatting),
            sourceLangName,
            targetLangName,
          }),
      })
      const responseTime = Date.now() - startTime

      if (result.usage) {
        await trackAICall(calculateAiUsageMetadata(
          result.usage,
          result.model,
          'auto-translation',
          undefined,
          responseTime,
        ))
      }

      const translatedText = result.text.trim() || text
      if (translatedText === text) {
        techDebtLogger.warn('[AutoTranslationService] La traduccion retornada es igual al texto original.')
      }

      return translatedText
    } catch (error) {
      techDebtLogger.error(`[AutoTranslationService] Error traduciendo texto a ${targetLanguage}:`, error)
      if (error instanceof Error) {
        techDebtLogger.error('[AutoTranslationService] Stack trace:', error.stack)
      }
      return text
    }
  }

  static async translateObject(
    obj: Record<string, unknown>,
    fields: string[],
    targetLanguage: TargetLanguage,
    options: TranslationOptions = {},
  ): Promise<Record<string, unknown>> {
    const translations: Record<string, unknown> = {}

    const translationPromises = fields.map(async (field) => {
      const value = obj[field]

      if (value === null || value === undefined || value === '') {
        return { field, translated: value }
      }

      if (Array.isArray(value)) {
        const translatedArray = await Promise.all(
          value.map(async (item: unknown) => {
            if (typeof item === 'string' && item.trim().length > 0) {
              return this.translateText(item, targetLanguage, options)
            }
            return item
          }),
        )
        return { field, translated: translatedArray }
      }

      if (typeof value === 'string' && value.trim().length > 0) {
        const translated = await this.translateText(value, targetLanguage, options)
        return { field, translated }
      }

      return { field, translated: value }
    })

    const results = await Promise.all(translationPromises)
    results.forEach(({ field, translated }) => {
      translations[field] = translated
    })

    return translations
  }

  static async translateEntity<T extends Record<string, unknown>>(
    entity: T,
    fields: string[],
    targetLanguage: TargetLanguage,
    entityType?: string,
    options: TranslationOptions = {},
  ): Promise<Record<string, unknown>> {
    const context = entityType
      ? `Este es un ${entityType} de una plataforma educativa sobre inteligencia artificial.`
      : options.context

    return this.translateObject(entity, fields, targetLanguage, {
      ...options,
      context,
      preserveFormatting: true,
    })
  }

  static async translateToMultipleLanguages(
    text: string,
    targetLanguages: TargetLanguage[],
    options: TranslationOptions = {},
  ): Promise<Record<TargetLanguage, string>> {
    const translations = await Promise.all(
      targetLanguages.map(async (lang) => ({
        lang,
        translated: await this.translateText(text, lang, options),
      })),
    )

    const result = {} as Record<TargetLanguage, string>
    translations.forEach(({ lang, translated }) => {
      result[lang] = translated
    })

    return result
  }

  static async translateObjectToMultipleLanguages(
    obj: Record<string, unknown>,
    fields: string[],
    targetLanguages: TargetLanguage[],
    options: TranslationOptions = {},
  ): Promise<Record<TargetLanguage, Record<string, unknown>>> {
    const translations = await Promise.all(
      targetLanguages.map(async (lang) => ({
        lang,
        translated: await this.translateObject(obj, fields, lang, options),
      })),
    )

    const result = {} as Record<TargetLanguage, Record<string, unknown>>
    translations.forEach(({ lang, translated }) => {
      result[lang] = translated
    })

    return result
  }
}
