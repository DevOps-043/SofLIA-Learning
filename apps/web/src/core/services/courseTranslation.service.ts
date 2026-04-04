/**
 * Servicio helper para traducir entidades de cursos automáticamente
 * Integra AutoTranslationService con ContentTranslationService
 */

import { AutoTranslationService } from './autoTranslation.service';
import { ContentTranslationService } from './contentTranslation.service';
import { LanguageDetectionService } from './languageDetection.service';
import { SupportedLanguage } from '../i18n/i18n';
import { createClient } from '../../lib/supabase/server';

type EntityType = 'course' | 'module' | 'lesson' | 'activity' | 'material';

interface TranslationResult {
  success: boolean;
  languages: SupportedLanguage[];
  errors?: Record<SupportedLanguage, string>;
}

/**
 * Traduce un curso completo y guarda las traducciones en content_translations
 * @param supabaseClient - Cliente de Supabase opcional (si no se proporciona, se crea uno nuevo)
 */
export async function translateCourseOnCreate(
  courseId: string,
  courseData: {
    title: string;
    description?: string | null;
    learning_objectives?: string[] | null;
  },
  userId?: string,
  supabaseClient?: Awaited<ReturnType<typeof createClient>>
): Promise<TranslationResult> {
  // Verificar configuración de OpenAI ANTES de continuar
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!openaiKey) {
    console.error('[CourseTranslation] ❌ OPENAI_API_KEY no está configurada. No se puede traducir.');
    return {
      success: false,
      languages: [],
      errors: { 
        es: 'OPENAI_API_KEY no está configurada en las variables de entorno', 
        en: 'OPENAI_API_KEY no está configurada en las variables de entorno', 
        pt: 'OPENAI_API_KEY no está configurada en las variables de entorno' 
      }
    };
  }

  // Usar el cliente proporcionado o crear uno nuevo

  const supabase = supabaseClient || await createClient();
  
  if (!supabase) {
    console.error('[CourseTranslation] ❌ No se pudo crear o obtener cliente de Supabase');
    return {
      success: false,
      languages: [],
      errors: { es: 'Error al crear cliente de Supabase', en: 'Error al crear cliente de Supabase', pt: 'Error al crear cliente de Supabase' }
    };
  }

  // PASO 1: Detectar el idioma del contenido

  const textsToAnalyze: string[] = [courseData.title];
  if (courseData.description) textsToAnalyze.push(courseData.description);
  
  const detectedLanguage = await LanguageDetectionService.detectLanguageFromMultipleTexts(textsToAnalyze);

  // PASO 2: Determinar idiomas destino (los otros dos)
  const allLanguages: SupportedLanguage[] = ['es', 'en', 'pt'];
  const targetLanguages = allLanguages.filter(lang => lang !== detectedLanguage) as SupportedLanguage[];

  const errors: Record<SupportedLanguage, string> = {} as Record<SupportedLanguage, string>;
  let successCount = 0;

  // Campos a traducir
  const fieldsToTranslate: string[] = ['title'];
  if (courseData.description) fieldsToTranslate.push('description');
  if (courseData.learning_objectives && Array.isArray(courseData.learning_objectives)) {
    fieldsToTranslate.push('learning_objectives');
  }

  // PASO 3: Traducir a cada idioma destino
  for (const lang of targetLanguages) {
    try {
      const translations = await AutoTranslationService.translateEntity(
        courseData,
        fieldsToTranslate,
        lang,
        'curso',
        {
          context: 'Este es un curso de una plataforma educativa sobre inteligencia artificial aplicada.',
          preserveFormatting: true,
          sourceLanguage: detectedLanguage, // Pasar el idioma de origen detectado
        }
      );
      
      // Guardar traducción usando el cliente del servidor
      const saved = await ContentTranslationService.saveTranslation(
        'course',
        courseId,
        lang,
        translations,
        userId,
        supabase
      );

      if (saved) {
        successCount++;

      } else {
        errors[lang] = 'Error al guardar traducción en la base de datos';
        console.error(`[CourseTranslation] ❌ Error al guardar traducción del curso ${courseId} a ${lang}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors[lang] = errorMessage;
      console.error(`[CourseTranslation] ❌ Error traduciendo curso ${courseId} a ${lang}:`, error);
      console.error(`[CourseTranslation] Stack trace:`, error instanceof Error ? error.stack : 'No stack trace');
    }
  }

  return {
    success: successCount > 0,
    languages: targetLanguages.filter(lang => !errors[lang]),
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}

/**
 * Traduce un módulo y guarda las traducciones
 */
export async function translateModuleOnCreate(
  moduleId: string,
  moduleData: {
    module_title: string;
    module_description?: string | null;
  },
  userId?: string
): Promise<TranslationResult> {
  // Detectar idioma del contenido
  const textsToAnalyze: string[] = [moduleData.module_title];
  if (moduleData.module_description) textsToAnalyze.push(moduleData.module_description);
  
  const detectedLanguage = await LanguageDetectionService.detectLanguageFromMultipleTexts(textsToAnalyze);

  // Determinar idiomas destino (los otros dos)
  const allLanguages: SupportedLanguage[] = ['es', 'en', 'pt'];
  const targetLanguages = allLanguages.filter(lang => lang !== detectedLanguage) as SupportedLanguage[];
  
  const errors: Record<SupportedLanguage, string> = {} as Record<SupportedLanguage, string>;
  let successCount = 0;

  // Crear cliente de Supabase del servidor
  const supabase = await createClient();

  const fieldsToTranslate: string[] = ['module_title'];
  if (moduleData.module_description) fieldsToTranslate.push('module_description');

  for (const lang of targetLanguages) {
    try {
      const translations = await AutoTranslationService.translateEntity(
        moduleData,
        fieldsToTranslate,
        lang,
        'módulo',
        {
          context: 'Este es un módulo de un curso educativo sobre inteligencia artificial.',
          preserveFormatting: true,
          sourceLanguage: detectedLanguage, // Pasar el idioma de origen detectado
        }
      );

      const saved = await ContentTranslationService.saveTranslation(
        'module',
        moduleId,
        lang,
        translations,
        userId,
        supabase
      );

      if (saved) {
        successCount++;

      } else {
        errors[lang] = 'Error al guardar traducción';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors[lang] = errorMessage;
      console.error(`[CourseTranslation] Error traduciendo módulo ${moduleId} a ${lang}:`, error);
    }
  }

  return {
    success: successCount > 0,
    languages: targetLanguages.filter(lang => !errors[lang]),
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}

/**
 * Traduce una lección y guarda las traducciones
 */
export async function translateLessonOnCreate(
  lessonId: string,
  lessonData: {
    lesson_title: string;
    lesson_description?: string | null;
    transcript_content?: string | null;
    summary_content?: string | null;
  },
  userId?: string
): Promise<TranslationResult> {
  // Detectar idioma del contenido (usar título y descripción, no transcripción/resumen que pueden ser muy largos)
  const textsToAnalyze: string[] = [lessonData.lesson_title];
  if (lessonData.lesson_description) textsToAnalyze.push(lessonData.lesson_description);
  // Si no hay descripción, usar una muestra del transcript o summary
  if (textsToAnalyze.length === 1 && lessonData.transcript_content) {
    textsToAnalyze.push(lessonData.transcript_content.substring(0, 200));
  } else if (textsToAnalyze.length === 1 && lessonData.summary_content) {
    textsToAnalyze.push(lessonData.summary_content.substring(0, 200));
  }
  
  const detectedLanguage = await LanguageDetectionService.detectLanguageFromMultipleTexts(textsToAnalyze);

  // Determinar idiomas destino (los otros dos)
  const allLanguages: SupportedLanguage[] = ['es', 'en', 'pt'];
  const targetLanguages = allLanguages.filter(lang => lang !== detectedLanguage) as SupportedLanguage[];
  
  const errors: Record<SupportedLanguage, string> = {} as Record<SupportedLanguage, string>;
  let successCount = 0;

  // Crear cliente de Supabase del servidor
  const supabase = await createClient();

  const fieldsToTranslate: string[] = ['lesson_title'];
  if (lessonData.lesson_description) fieldsToTranslate.push('lesson_description');
  if (lessonData.transcript_content) fieldsToTranslate.push('transcript_content');
  if (lessonData.summary_content) fieldsToTranslate.push('summary_content');

  for (const lang of targetLanguages) {
    try {
      const translations = await AutoTranslationService.translateEntity(
        lessonData,
        fieldsToTranslate,
        lang,
        'lección',
        {
          context: 'Este es el contenido de una lección educativa sobre inteligencia artificial. La transcripción es el texto completo del video y el resumen es una síntesis de los conceptos clave.',
          preserveFormatting: true,
          sourceLanguage: detectedLanguage, // Pasar el idioma de origen detectado
        }
      );

      const saved = await ContentTranslationService.saveTranslation(
        'lesson',
        lessonId,
        lang,
        translations,
        userId,
        supabase
      );

      if (saved) {
        successCount++;

      } else {
        const errorMsg = `Error al guardar traducción a ${lang}. Revisa los logs del servidor para más detalles.`;
        errors[lang] = errorMsg;
        console.error(`[CourseTranslation] ❌ ${errorMsg}`, {
          lessonId,
          language: lang,
          translationKeys: Object.keys(translations),
          translationCount: Object.keys(translations).length
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors[lang] = errorMessage;
      console.error(`[CourseTranslation] Error traduciendo lección ${lessonId} a ${lang}:`, error);
    }
  }

  return {
    success: successCount > 0,
    languages: targetLanguages.filter(lang => !errors[lang]),
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}

/**
 * Traduce una actividad y guarda las traducciones
 */
export async function translateActivityOnCreate(
  activityId: string,
  activityData: {
    activity_title: string;
    activity_description?: string | null;
    activity_content?: string | null;
    ai_prompts?: string | null;
  },
  userId?: string
): Promise<TranslationResult> {
  // Detectar idioma del contenido
  const textsToAnalyze: string[] = [activityData.activity_title];
  if (activityData.activity_description) textsToAnalyze.push(activityData.activity_description);
  if (activityData.activity_content) {
    textsToAnalyze.push(activityData.activity_content.substring(0, 200)); // Muestra del contenido
  }
  
  const detectedLanguage = await LanguageDetectionService.detectLanguageFromMultipleTexts(textsToAnalyze);

  // Determinar idiomas destino (los otros dos)
  const allLanguages: SupportedLanguage[] = ['es', 'en', 'pt'];
  const targetLanguages = allLanguages.filter(lang => lang !== detectedLanguage) as SupportedLanguage[];
  
  const errors: Record<SupportedLanguage, string> = {} as Record<SupportedLanguage, string>;
  let successCount = 0;

  // Crear cliente de Supabase del servidor
  const supabase = await createClient();

  const fieldsToTranslate: string[] = ['activity_title'];
  if (activityData.activity_description) fieldsToTranslate.push('activity_description');
  if (activityData.activity_content) fieldsToTranslate.push('activity_content');
  if (activityData.ai_prompts) fieldsToTranslate.push('ai_prompts');

  for (const lang of targetLanguages) {
    try {
      const translations = await AutoTranslationService.translateEntity(
        activityData,
        fieldsToTranslate,
        lang,
        'actividad',
        {
          context: 'Esta es una actividad práctica de un curso educativo. El contenido incluye instrucciones paso a paso y prompts para interactuar con un asistente de IA.',
          preserveFormatting: true,
          sourceLanguage: detectedLanguage, // Pasar el idioma de origen detectado
        }
      );

      const saved = await ContentTranslationService.saveTranslation(
        'activity',
        activityId,
        lang,
        translations,
        userId,
        supabase
      );

      if (saved) {
        successCount++;

      } else {
        errors[lang] = 'Error al guardar traducción';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors[lang] = errorMessage;
      console.error(`[CourseTranslation] Error traduciendo actividad ${activityId} a ${lang}:`, error);
    }
  }

  return {
    success: successCount > 0,
    languages: targetLanguages.filter(lang => !errors[lang]),
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}

/**
 * Traduce un material y guarda las traducciones
 */
export async function translateMaterialOnCreate(
  materialId: string,
  materialData: {
    material_title: string;
    material_description?: string | null;
    content_data?: Record<string, unknown>;
  },
  userId?: string
): Promise<TranslationResult> {
  // Detectar idioma del contenido
  const textsToAnalyze: string[] = [materialData.material_title];
  if (materialData.material_description) textsToAnalyze.push(materialData.material_description);
  
  const detectedLanguage = await LanguageDetectionService.detectLanguageFromMultipleTexts(textsToAnalyze);

  // Determinar idiomas destino (los otros dos)
  const allLanguages: SupportedLanguage[] = ['es', 'en', 'pt'];
  const targetLanguages = allLanguages.filter(lang => lang !== detectedLanguage) as SupportedLanguage[];
  
  const errors: Record<SupportedLanguage, string> = {} as Record<SupportedLanguage, string>;
  let successCount = 0;

  // Crear cliente de Supabase del servidor
  const supabase = await createClient();

  const fieldsToTranslate: string[] = ['material_title'];
  if (materialData.material_description) fieldsToTranslate.push('material_description');
  
  // Para content_data, solo traducir si es un objeto con campos de texto
  // Por ahora, solo traducimos título y descripción
  // content_data puede ser complejo (quiz, ejercicios, etc.) y requiere manejo especial

  for (const lang of targetLanguages) {
    try {
      const translations = await AutoTranslationService.translateEntity(
        materialData,
        fieldsToTranslate,
        lang,
        'material',
        {
          context: 'Este es un material educativo complementario de un curso sobre inteligencia artificial.',
          preserveFormatting: true,
          sourceLanguage: detectedLanguage, // Pasar el idioma de origen detectado
        }
      );

      const saved = await ContentTranslationService.saveTranslation(
        'material',
        materialId,
        lang,
        translations,
        userId,
        supabase
      );

      if (saved) {
        successCount++;

      } else {
        errors[lang] = 'Error al guardar traducción';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors[lang] = errorMessage;
      console.error(`[CourseTranslation] Error traduciendo material ${materialId} a ${lang}:`, error);
    }
  }

  return {
    success: successCount > 0,
    languages: targetLanguages.filter(lang => !errors[lang]),
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}

