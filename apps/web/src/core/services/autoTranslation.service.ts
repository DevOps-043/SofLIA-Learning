import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * Servicio de traducción automática usando OpenAI
 * Traduce contenido educativo de español a inglés y portugués
 */

import { SupportedLanguage } from '../i18n/i18n';
import { trackOpenAICall, calculateOpenAIMetadata } from '../../lib/openai/usage-monitor';
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker';

type TargetLanguage = SupportedLanguage; // 'es' | 'en' | 'pt'
type SourceLanguage = 'es' | 'en' | 'pt';

interface TranslationOptions {
  context?: string;
  preserveFormatting?: boolean;
  sourceLanguage?: SourceLanguage; // Idioma de origen (opcional, por defecto 'es')
}

export class AutoTranslationService {
  private static readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  private static readonly OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  private static readonly OPENAI_BASE_URL = 'https://api.openai.com/v1/chat/completions';

  /**
   * Verifica si el servicio está configurado correctamente
   */
  private static isConfigured(): boolean {
    const isConfigured = !!this.OPENAI_API_KEY;

    if (!isConfigured) {
      techDebtLogger.error('[AutoTranslationService] ❌ OPENAI_API_KEY no está configurada en las variables de entorno');
      techDebtLogger.error('[AutoTranslationService] Variables de entorno disponibles:', {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasOpenAIModel: !!process.env.OPENAI_MODEL,
        nodeEnv: process.env.NODE_ENV
      });
    } else {

    }
    return isConfigured;
  }

  /**
   * Traduce un texto individual de un idioma a otro
   * @param text Texto a traducir
   * @param targetLanguage Idioma destino (es, en, pt)
   * @param options Opciones incluyendo sourceLanguage (idioma de origen)
   */
  static async translateText(
    text: string,
    targetLanguage: TargetLanguage,
    options: TranslationOptions = {}
  ): Promise<string> {
    if (!text || text.trim().length === 0) {
      return text;
    }

    // Obtener idioma de origen (debe ser proporcionado explícitamente)
    const sourceLanguage = options.sourceLanguage;
    if (!sourceLanguage) {
      techDebtLogger.error(`[AutoTranslationService] ❌ sourceLanguage no proporcionado en options. Options:`, options);
      techDebtLogger.warn(`[AutoTranslationService] ⚠️ Asumiendo español por defecto, pero esto puede causar traducciones incorrectas`);
    }
    
    const finalSourceLanguage = sourceLanguage || 'es';
    
    if (finalSourceLanguage === targetLanguage) {
      return text;
    }

    if (!this.isConfigured()) {
      techDebtLogger.warn('[AutoTranslationService] ⚠️ OPENAI_API_KEY no configurada, retornando texto original sin traducir');
      return text;
    }

    const languageNames: Record<SourceLanguage | TargetLanguage, string> = {
      es: 'español',
      en: 'inglés',
      pt: 'portugués brasileño'
    };

    const sourceLangName = languageNames[finalSourceLanguage];
    const targetLangName = languageNames[targetLanguage];

    const contextPrompt = options.context 
      ? `\n\nContexto: ${options.context}`
      : '';

    const systemPrompt = `Eres un traductor profesional especializado en contenido educativo y tecnológico. 
Tu tarea es traducir texto del ${sourceLangName} al ${targetLangName} manteniendo:
- El tono profesional y preciso
- La terminología técnica correcta
- El formato y estructura original
- La claridad y precisión del contenido educativo

${options.preserveFormatting ? 'IMPORTANTE: Mantén todos los saltos de línea, numeración, listas y formato del texto original.' : ''}

Responde ÚNICAMENTE con la traducción, sin explicaciones ni comentarios adicionales.`;

    const userPrompt = `Traduce el siguiente texto del ${sourceLangName} al ${targetLangName}.${contextPrompt}

Texto original:
${text}

Traducción:`;

    try {
      
      const startTime = Date.now();
      const response = await fetchWithCircuitBreaker('openai-auto-translation', this.OPENAI_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: this.OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: 0.3, // Baja temperatura para traducciones más precisas
          max_tokens: Math.min(4000, Math.ceil(text.length * 2)), // Aproximadamente 2x el texto original
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = `OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`;
        techDebtLogger.error(`[AutoTranslationService] ❌ ${errorMessage}`);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;
      
      // ✅ Registrar uso de OpenAI para traducción
      if (data.usage) {
        await trackOpenAICall(calculateOpenAIMetadata(
          data.usage,
          this.OPENAI_MODEL,
          'auto-translation',
          undefined, // No tenemos userId en este contexto
          responseTime
        ));
      }
      
      const translatedText = data.choices[0]?.message?.content?.trim() || text;

      if (translatedText === text) {
        techDebtLogger.warn(`[AutoTranslationService] ⚠️ La traducción retornada es igual al texto original (posible error silencioso)`);
      } else {
      }
      
      return translatedText;
    } catch (error) {
      techDebtLogger.error(`[AutoTranslationService] ❌ Error traduciendo texto a ${targetLanguage}:`, error);
      if (error instanceof Error) {
        techDebtLogger.error(`[AutoTranslationService] Stack trace:`, error.stack);
      }
      // Retornar texto original en caso de error
      return text;
    }
  }

  /**
   * Traduce múltiples campos de un objeto
   */
  static async translateObject(
    obj: Record<string, unknown>,
    fields: string[],
    targetLanguage: TargetLanguage,
    options: TranslationOptions = {}
  ): Promise<Record<string, unknown>> {
    const translations: Record<string, unknown> = {};

    // Traducir cada campo en paralelo para mejor rendimiento
    const translationPromises = fields.map(async (field) => {
      const value = obj[field];
      
      // Solo traducir si el campo existe y tiene contenido
      if (value === null || value === undefined || value === '') {
        return { field, translated: value };
      }

      // Si es un array, traducir cada elemento
      if (Array.isArray(value)) {
        const translatedArray = await Promise.all(
          value.map(async (item: unknown) => {
            if (typeof item === 'string' && item.trim().length > 0) {
              return await this.translateText(item, targetLanguage, {
                ...options,
                sourceLanguage: options.sourceLanguage, // Pasar el idioma de origen
              });
            }
            return item;
          })
        );
        return { field, translated: translatedArray };
      }

      // Si es un string, traducirlo
      if (typeof value === 'string' && value.trim().length > 0) {
        const translated = await this.translateText(value, targetLanguage, {
          ...options,
          sourceLanguage: options.sourceLanguage, // Pasar el idioma de origen
        });
        return { field, translated };
      }

      // Para otros tipos, mantener el valor original
      return { field, translated: value };
    });

    const results = await Promise.all(translationPromises);
    
    results.forEach(({ field, translated }) => {
      translations[field] = translated;
    });

    return translations;
  }

  /**
   * Traduce una entidad completa (objeto con múltiples campos)
   * Útil para traducir cursos, módulos, lecciones, etc.
   */
  static async translateEntity<T extends Record<string, unknown>>(
    entity: T,
    fields: string[],
    targetLanguage: TargetLanguage,
    entityType?: string,
    options: TranslationOptions = {}
  ): Promise<Record<string, unknown>> {
    const context = entityType 
      ? `Este es un ${entityType} de una plataforma educativa sobre inteligencia artificial.`
      : options.context;

    const result = await this.translateObject(entity, fields, targetLanguage, {
      ...options,
      context,
      preserveFormatting: true, // Preservar formato para contenido educativo
    });

    return result;
  }

  /**
   * Traduce a múltiples idiomas simultáneamente
   */
  static async translateToMultipleLanguages(
    text: string,
    targetLanguages: TargetLanguage[],
    options: TranslationOptions = {}
  ): Promise<Record<TargetLanguage, string>> {
    const translations = await Promise.all(
      targetLanguages.map(async (lang) => {
        const translated = await this.translateText(text, lang, options);
        return { lang, translated };
      })
    );

    const result: Record<TargetLanguage, string> = {} as Record<TargetLanguage, string>;
    translations.forEach(({ lang, translated }) => {
      result[lang] = translated;
    });

    return result;
  }

  /**
   * Traduce un objeto a múltiples idiomas simultáneamente
   */
  static async translateObjectToMultipleLanguages(
    obj: Record<string, unknown>,
    fields: string[],
    targetLanguages: TargetLanguage[],
    options: TranslationOptions = {}
  ): Promise<Record<TargetLanguage, Record<string, unknown>>> {
    const translations = await Promise.all(
      targetLanguages.map(async (lang) => {
        const translated = await this.translateObject(obj, fields, lang, options);
        return { lang, translated };
      })
    );

    const result: Record<TargetLanguage, Record<string, unknown>> = {} as Record<TargetLanguage, Record<string, unknown>>;
    translations.forEach(({ lang, translated }) => {
      result[lang] = translated;
    });

    return result;
  }
}
