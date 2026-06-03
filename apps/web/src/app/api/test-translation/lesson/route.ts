import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { translateLessonOnCreate } from '../../../../core/services/courseTranslation.service'
import { LanguageDetectionService } from '../../../../core/services/languageDetection.service'
import { ContentTranslationService } from '../../../../core/services/contentTranslation.service'
import { createClient } from '../../../../lib/supabase/server'
import { SupportedLanguage } from '../../../../core/i18n/i18n'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';

export const dynamic = 'force-dynamic'

interface TranslationLoadTestResult {
  success: boolean
  hasTranslations?: boolean
  translationKeys?: string[]
  sampleTranslation?: string
  error?: string
}

interface ContentTranslationRow {
  language_code: string
}

/**
 * Endpoint de prueba para verificar traducción de lecciones específicas
 * GET /api/test-translation/lesson?lessonId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lessonId = searchParams.get('lessonId')

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Se requiere lessonId como parámetro' },
        { status: 400 }
      )
    }

    // Obtener datos de la lección
    const supabase = await createClient()
    const { data: lesson, error: lessonError } = await supabase
      .from('course_lessons')
      .select('lesson_id, lesson_title, lesson_description, transcript_content, summary_content')
      .eq('lesson_id', lessonId)
      .single()

    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: 'Lección no encontrada', details: lessonError },
        { status: 404 }
      )
    }

    // PASO 1: Detectar idioma del contenido

    const textsToAnalyze: string[] = [lesson.lesson_title]
    if (lesson.lesson_description) textsToAnalyze.push(lesson.lesson_description)
    if (lesson.transcript_content) {
      textsToAnalyze.push(lesson.transcript_content.substring(0, 200)) // Muestra del transcript
    }
    if (lesson.summary_content) {
      textsToAnalyze.push(lesson.summary_content.substring(0, 200)) // Muestra del summary
    }
    
    const detectedLanguage = await LanguageDetectionService.detectLanguageFromMultipleTexts(textsToAnalyze)

    // PASO 2: Verificar traducciones existentes
    const { data: existingTranslations, error: translationsError } = await supabase
      .from('content_translations')
      .select(SELECT_COLUMNS.content_translations)
      .eq('entity_type', 'lesson')
      .eq('entity_id', lessonId)


    // PASO 3: Traducir la lección (si no está traducida o necesita actualización)

    const translationResult = await translateLessonOnCreate(
      lessonId,
      {
        lesson_title: lesson.lesson_title,
        lesson_description: lesson.lesson_description,
        transcript_content: lesson.transcript_content,
        summary_content: lesson.summary_content
      },
      undefined // userId opcional
    )

    // PASO 4: Verificar traducciones después de traducir
    const { data: translationsAfter, error: translationsAfterError } = await supabase
      .from('content_translations')
      .select(SELECT_COLUMNS.content_translations)
      .eq('entity_type', 'lesson')
      .eq('entity_id', lessonId)


    // PASO 5: Probar carga de traducciones para cada idioma

    const translationLoadTests: Record<string, TranslationLoadTestResult> = {}
    
    for (const lang of ['es', 'en', 'pt'] as SupportedLanguage[]) {
      try {
        const loadedTranslations = await ContentTranslationService.loadTranslations(
          'lesson',
          lessonId,
          lang,
          supabase
        )
        translationLoadTests[lang] = {
          success: true,
          hasTranslations: Object.keys(loadedTranslations).length > 0,
          translationKeys: Object.keys(loadedTranslations),
          sampleTranslation: loadedTranslations.lesson_title || loadedTranslations.lesson_description || 'N/A'
        }

      } catch (error) {
        translationLoadTests[lang] = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        }
      }
    }

    // Determinar idiomas esperados
    const allLanguages: SupportedLanguage[] = ['es', 'en', 'pt']
    const expectedTargetLanguages = allLanguages.filter(lang => lang !== detectedLanguage)

    return NextResponse.json({
      success: true,
      lesson: {
        id: lesson.lesson_id,
        title: lesson.lesson_title,
        description: lesson.lesson_description?.substring(0, 100) || null,
        hasTranscript: !!lesson.transcript_content,
        hasSummary: !!lesson.summary_content
      },
      detectedLanguage: detectedLanguage,
      translationResult: translationResult,
      translationsBefore: existingTranslations || [],
      translationsAfter: translationsAfter || [],
      translationLoadTests: translationLoadTests,
      summary: {
        originalLanguage: detectedLanguage,
        expectedTargetLanguages: expectedTargetLanguages,
        actualTranslationsInDB: (translationsAfter as ContentTranslationRow[] | null)?.map((translation) => translation.language_code) || [],
        allTranslationsLoaded: Object.values(translationLoadTests).every((translationTest) => translationTest.success),
        hasSpanishTranslation: translationLoadTests.es?.hasTranslations || false,
        recommendation: detectedLanguage === 'en' 
          ? (translationLoadTests.es?.hasTranslations 
              ? '✅ La lección en inglés tiene traducción a español. Debería mostrarse correctamente cuando el usuario está en español.'
              : '⚠️ La lección en inglés NO tiene traducción a español. Necesita traducirse.')
          : detectedLanguage === 'pt'
          ? (translationLoadTests.es?.hasTranslations 
              ? '✅ La lección en portugués tiene traducción a español. Debería mostrarse correctamente cuando el usuario está en español.'
              : '⚠️ La lección en portugués NO tiene traducción a español. Necesita traducirse.')
          : 'ℹ️ La lección está en español. No necesita traducción a español.'
      },
      environment: {
        hasGeminiKey: !!(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY),
        geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash'
      }
    })
  } catch (error) {
    techDebtLogger.error('[TEST-LESSON-TRANSLATION] ❌ Error en prueba:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
