import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { LanguageDetectionService } from '../../../../core/services/languageDetection.service'
import { ContentTranslationService } from '../../../../core/services/contentTranslation.service'
import { SupportedLanguage } from '../../../../core/i18n/i18n'

export const dynamic = 'force-dynamic'

interface CourseLessonTranslationRow {
  lesson_id: string
  lesson_title: string
  lesson_description: string | null
}

interface TranslationLanguageRow {
  language_code: SupportedLanguage
}

type LessonTranslationStatus = 'ok' | 'translated' | 'needs_translation'

interface LessonTranslationAnalysis {
  lesson_id: string
  lesson_title: string
  lesson_description: string | null
  detectedLanguage: SupportedLanguage
  expectedTargetLanguages: SupportedLanguage[]
  translationsInDB: SupportedLanguage[]
  hasSpanishTranslation: boolean
  spanishTranslationTitle: string | null
  status: LessonTranslationStatus
}

/**
 * Endpoint para listar todas las lecciones de un curso y verificar sus traducciones
 * GET /api/test-translation/course-lessons?courseId=xxx
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

    const supabase = await createClient()

    // Obtener todas las lecciones del curso
    const { data: lessons, error: lessonsError } = await supabase
      .from('course_lessons')
      .select(`
        lesson_id,
        lesson_title,
        lesson_description,
        module_id,
        course_modules!inner (
          course_id
        )
      `)
      .eq('course_modules.course_id', courseId)
      .order('lesson_order_index', { ascending: true })

    if (lessonsError || !lessons) {
      return NextResponse.json(
        { error: 'Error al obtener lecciones', details: lessonsError },
        { status: 500 }
      )
    }

    // Analizar cada lección
    const lessonsAnalysis = await Promise.all(
      (lessons as CourseLessonTranslationRow[]).map(async (lesson) => {
        // Detectar idioma
        const textsToAnalyze: string[] = [lesson.lesson_title]
        if (lesson.lesson_description) textsToAnalyze.push(lesson.lesson_description)
        
        const detectedLanguage = await LanguageDetectionService.detectLanguageFromMultipleTexts(textsToAnalyze)
        
        // Verificar traducciones existentes
        const { data: translations } = await supabase
          .from('content_translations')
          .select('language_code, translations')
          .eq('entity_type', 'lesson')
          .eq('entity_id', lesson.lesson_id)

        const translationLanguages = (translations as TranslationLanguageRow[] | null)?.map((t) => t.language_code) || []
        
        // Probar carga de traducción a español
        const spanishTranslation = await ContentTranslationService.loadTranslations(
          'lesson',
          lesson.lesson_id,
          'es',
          supabase
        )

        const allLanguages: SupportedLanguage[] = ['es', 'en', 'pt']
        const expectedTargetLanguages = allLanguages.filter(lang => lang !== detectedLanguage)

        return {
          lesson_id: lesson.lesson_id,
          lesson_title: lesson.lesson_title,
          lesson_description: lesson.lesson_description?.substring(0, 100) || null,
          detectedLanguage: detectedLanguage,
          expectedTargetLanguages: expectedTargetLanguages,
          translationsInDB: translationLanguages,
          hasSpanishTranslation: Object.keys(spanishTranslation).length > 0,
          spanishTranslationTitle: spanishTranslation.lesson_title || null,
          status: detectedLanguage === 'es' 
            ? 'ok' // Lección en español, no necesita traducción a español
            : spanishTranslation.lesson_title 
            ? 'translated' // Lección en inglés/portugués y tiene traducción a español
            : 'needs_translation' // Lección en inglés/portugués pero NO tiene traducción a español
        }
      })
    )

    // Resumen
    const summary = {
      totalLessons: lessonsAnalysis.length,
      lessonsInSpanish: lessonsAnalysis.filter((l: LessonTranslationAnalysis) => l.detectedLanguage === 'es').length,
      lessonsInEnglish: lessonsAnalysis.filter((l: LessonTranslationAnalysis) => l.detectedLanguage === 'en').length,
      lessonsInPortuguese: lessonsAnalysis.filter((l: LessonTranslationAnalysis) => l.detectedLanguage === 'pt').length,
      lessonsNeedingTranslation: lessonsAnalysis.filter((l: LessonTranslationAnalysis) => l.status === 'needs_translation').length,
      lessonsTranslated: lessonsAnalysis.filter((l: LessonTranslationAnalysis) => l.status === 'translated').length,
      lessonsOK: lessonsAnalysis.filter((l: LessonTranslationAnalysis) => l.status === 'ok').length
    }

    return NextResponse.json({
      success: true,
      courseId: courseId,
      summary: summary,
      lessons: lessonsAnalysis,
      recommendations: lessonsAnalysis
        .filter((l: LessonTranslationAnalysis) => l.status === 'needs_translation')
        .map((l: LessonTranslationAnalysis) => ({
          lesson_id: l.lesson_id,
          lesson_title: l.lesson_title,
          detectedLanguage: l.detectedLanguage,
          action: `Ejecutar: /api/test-translation/lesson?lessonId=${l.lesson_id} para traducir esta lección`
        }))
    })
  } catch (error: unknown) {
    console.error('[TEST-COURSE-LESSONS] ❌ Error:', error)
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
