import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { translateLessonOnCreate } from '@/core/services/courseTranslation.service'
import { LanguageDetectionService } from '@/core/services/languageDetection.service'
import { ContentTranslationService } from '@/core/services/contentTranslation.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

/**
 * POST /api/admin/translate-existing-lessons
 * Traduce lecciones existentes que aún no tienen traducciones
 * 
 * Body opcional:
 * - lessonIds: string[] - IDs específicos de lecciones a traducir (si no se proporciona, traduce todas)
 * - courseId: string - ID del curso para traducir solo lecciones de ese curso
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario es admin
    const { adminUserId } = await requireAdmin()
    
    const body = await request.json().catch(() => ({}))
    const { lessonIds, courseId } = body

    const supabase = await createClient()

    // Construir query para obtener lecciones
    let query = supabase
      .from('course_lessons')
      .select('lesson_id, lesson_title, lesson_description, transcript_content, summary_content, module_id')

    if (lessonIds && Array.isArray(lessonIds) && lessonIds.length > 0) {
      // Traducir lecciones específicas
      query = query.in('lesson_id', lessonIds)
    } else if (courseId) {
      // Traducir lecciones de un curso específico
      query = query
        .select('lesson_id, lesson_title, lesson_description, transcript_content, summary_content, module_id, course_modules!inner(course_id)')
        .eq('course_modules.course_id', courseId)
    }

    const { data: lessons, error: lessonsError } = await query

    if (lessonsError) {
      return NextResponse.json(
        { error: 'Error al obtener lecciones', details: lessonsError.message },
        { status: 500 }
      )
    }

    if (!lessons || lessons.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No se encontraron lecciones para traducir',
        translated: 0,
        failed: 0
      })
    }

    const results = {
      translated: 0,
      failed: 0,
      skipped: 0,
      details: [] as Array<{
        lessonId: string
        lessonTitle: string
        status: 'translated' | 'failed' | 'skipped'
        error?: string
        languages?: string[]
      }>
    }

    // Procesar cada lección
    for (const lesson of lessons) {
      try {
        const lessonId = lesson.lesson_id
        const lessonTitle = lesson.lesson_title

        // Verificar si ya tiene traducciones
        const { data: existingTranslations } = await supabase
          .from('content_translations')
          .select('language_code')
          .eq('entity_type', 'lesson')
          .eq('entity_id', lessonId)

        const existingLanguages = existingTranslations?.map(t => t.language_code) || []
        
        // Detectar idioma del contenido
        const textsToAnalyze: string[] = [lesson.lesson_title]
        if (lesson.lesson_description) textsToAnalyze.push(lesson.lesson_description)
        
        const detectedLanguage = await LanguageDetectionService.detectLanguageFromMultipleTexts(textsToAnalyze)
        const allLanguages: string[] = ['es', 'en', 'pt']
        const targetLanguages = allLanguages.filter(lang => lang !== detectedLanguage)

        // Verificar si ya tiene todas las traducciones necesarias
        const missingLanguages = targetLanguages.filter(lang => !existingLanguages.includes(lang))
        
        if (missingLanguages.length === 0) {
          results.skipped++
          results.details.push({
            lessonId,
            lessonTitle,
            status: 'skipped',
            languages: existingLanguages
          })

          continue
        }


        // Traducir la lección
        const translationResult = await translateLessonOnCreate(
          lessonId,
          {
            lesson_title: lesson.lesson_title,
            lesson_description: lesson.lesson_description,
            transcript_content: lesson.transcript_content,
            summary_content: lesson.summary_content
          },
          adminUserId
        )

        if (translationResult.success && translationResult.languages.length > 0) {
          results.translated++
          results.details.push({
            lessonId,
            lessonTitle,
            status: 'translated',
            languages: translationResult.languages
          })
        } else {
          results.failed++
          results.details.push({
            lessonId,
            lessonTitle,
            status: 'failed',
            error: Object.values(translationResult.errors || {}).join(', ') || 'Error desconocido',
            languages: translationResult.languages
          })
          console.error(`[translate-existing-lessons] ❌ Error traduciendo lección ${lessonId}:`, translationResult.errors)
        }
      } catch (error) {
        results.failed++
        results.details.push({
          lessonId: lesson.lesson_id,
          lessonTitle: lesson.lesson_title,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error)
        })
        console.error(`[translate-existing-lessons] ❌ Excepción traduciendo lección ${lesson.lesson_id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Procesadas ${lessons.length} lecciones`,
      ...results
    })
  } catch (error) {
    console.error('[translate-existing-lessons] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

