import { logger as techDebtLogger } from '@/lib/utils/logger'
import { AutoTranslationService } from '../autoTranslation.service';
import { ContentTranslationService } from '../contentTranslation.service';
import { LanguageDetectionService } from '../languageDetection.service';
import { createClient } from '../../../lib/supabase/server';
import { createFailedTranslationResult, getTargetLanguages } from './translation-utils';
import type { TranslationEntityConfig, TranslationResult } from './types';
import type { SupportedLanguage } from '../../i18n/i18n';

export async function translateAndSaveEntity({
  entityId,
  entityType,
  entityLabel,
  data,
  fields,
  textsToAnalyze,
  context,
  userId,
  supabaseClient,
  requireOpenAiKey,
}: TranslationEntityConfig): Promise<TranslationResult> {
  if (requireOpenAiKey && !process.env.OPENAI_API_KEY) {
    techDebtLogger.error('[CourseTranslation] OPENAI_API_KEY no esta configurada.');
    return createFailedTranslationResult('OPENAI_API_KEY no esta configurada en las variables de entorno');
  }

  const supabase = supabaseClient || await createClient();

  if (!supabase) {
    techDebtLogger.error('[CourseTranslation] No se pudo crear u obtener cliente de Supabase');
    return createFailedTranslationResult('Error al crear cliente de Supabase');
  }

  const detectedLanguage = await LanguageDetectionService.detectLanguageFromMultipleTexts(textsToAnalyze);
  const targetLanguages = getTargetLanguages(detectedLanguage);
  const errors: Partial<Record<SupportedLanguage, string>> = {};
  const translatedLanguages: SupportedLanguage[] = [];

  for (const language of targetLanguages) {
    try {
      const translations = await AutoTranslationService.translateEntity(
        data,
        fields,
        language,
        entityLabel,
        { context, preserveFormatting: true, sourceLanguage: detectedLanguage }
      );

      const saved = await ContentTranslationService.saveTranslation(
        entityType,
        entityId,
        language,
        translations,
        userId,
        supabase
      );

      if (saved) {
        translatedLanguages.push(language);
      } else {
        errors[language] = `Error al guardar traduccion a ${language}`;
        techDebtLogger.error(`[CourseTranslation] Error al guardar ${entityType} ${entityId} a ${language}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors[language] = errorMessage;
      techDebtLogger.error(`[CourseTranslation] Error traduciendo ${entityType} ${entityId} a ${language}:`, error);
    }
  }

  return {
    success: translatedLanguages.length > 0,
    languages: translatedLanguages,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}
