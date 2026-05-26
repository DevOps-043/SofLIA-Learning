import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { translateCourseOnCreate } from '../../../core/services/courseTranslation.service'
import { LanguageDetectionService } from '../../../core/services/languageDetection.service'
import { ContentTranslationService } from '../../../core/services/contentTranslation.service'
import { createClient } from '../../../lib/supabase/server'
import { SupportedLanguage } from '../../../core/i18n/i18n'
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
 * Endpoint de prueba para verificar que el sistema de traducción funciona
 * GET /api/test-translation?courseId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json(
        { error: 'Se requiere courseId como parámetro' },
        { status: 400 }
      )
    }

    // Obtener datos del curso
    const supabase = await createClient()
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, description, learning_objectives')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado', details: courseError },
        { status: 404 }
      )
    }

    // Verificar variables de entorno


    // Verificar permisos del cliente de Supabase

    const { data: testInsert, error: testError } = await supabase
      .from('content_translations')
      .insert({
        entity_type: 'course',
        entity_id: course.id,
        language_code: 'en',
        translations: { test: 'test' }
      })
      .select()

    // Si el test falla, limpiar el registro de prueba
    if (!testError && testInsert) {
      await supabase
        .from('content_translations')
        .delete()
        .eq('entity_type', 'course')
        .eq('entity_id', course.id)
        .eq('language_code', 'en')
    }

    // Intentar traducir
    const result = await translateCourseOnCreate(
      course.id,
      {
        title: course.title,
        description: course.description,
        learning_objectives: course.learning_objectives
      },
      undefined, // userId opcional
      supabase
    )


    // PASO 1: Detectar idioma del contenido original

    const textsToAnalyze: string[] = [course.title]
    if (course.description) textsToAnalyze.push(course.description)
    
    const detectedLanguage = await LanguageDetectionService.detectLanguageFromMultipleTexts(textsToAnalyze)

    // PASO 2: Verificar traducciones guardadas
    const { data: translations, error: translationsError } = await supabase
      .from('content_translations')
      .select(SELECT_COLUMNS.content_translations)
      .eq('entity_type', 'course')
      .eq('entity_id', courseId)

    // PASO 3: Probar carga de traducciones para cada idioma

    const translationTests: Record<string, TranslationLoadTestResult> = {}
    
    for (const lang of ['es', 'en', 'pt'] as SupportedLanguage[]) {
      try {
        const loadedTranslations = await ContentTranslationService.loadTranslations(
          'course',
          courseId,
          lang,
          supabase
        )
        translationTests[lang] = {
          success: true,
          hasTranslations: Object.keys(loadedTranslations).length > 0,
          translationKeys: Object.keys(loadedTranslations),
          sampleTranslation: loadedTranslations.title || loadedTranslations.description || 'N/A'
        }

      } catch (error) {
        translationTests[lang] = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        description: course.description?.substring(0, 100) || null
      },
      detectedLanguage: detectedLanguage,
      translationResult: result,
      translationsInDB: translations || [],
      translationLoadTests: translationTests,
      summary: {
        originalLanguage: detectedLanguage,
        expectedTargetLanguages: detectedLanguage === 'es' ? ['en', 'pt'] : detectedLanguage === 'en' ? ['es', 'pt'] : ['es', 'en'],
        actualTranslationsInDB: (translations as ContentTranslationRow[] | null)?.map((translation) => translation.language_code) || [],
        allTranslationsLoaded: Object.values(translationTests).every((translationTest) => translationTest.success)
      },
      environment: {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        openAIModel: process.env.OPENAI_MODEL || 'gpt-4o-mini'
      }
    })
  } catch (error) {
    techDebtLogger.error('[TEST-TRANSLATION] ❌ Error en prueba:', error)
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
