import { NextRequest, NextResponse } from 'next/server'
import { AutoTranslationService } from '../../../../core/services/autoTranslation.service'
import { ContentTranslationService } from '../../../../core/services/contentTranslation.service'
import { LanguageDetectionService } from '../../../../core/services/languageDetection.service'
import { createClient } from '../../../../lib/supabase/server'
import { SupportedLanguage } from '../../../../core/i18n/i18n'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * Endpoint de prueba específico para diagnosticar problemas con traducción a español
 * GET /api/test-translation/lesson-es?lessonId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lessonId = searchParams.get('lessonId') || 'f30ac395-a54c-4353-91ff-fecab7120f82'

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

    // Detectar idioma
    const textsToAnalyze: string[] = [lesson.lesson_title]
    if (lesson.lesson_description) textsToAnalyze.push(lesson.lesson_description)
    
    const detectedLanguage = await LanguageDetectionService.detectLanguageFromMultipleTexts(textsToAnalyze)

    if (detectedLanguage === 'es') {
      return NextResponse.json({
        success: true,
        message: 'La lección ya está en español, no necesita traducción',
        detectedLanguage: 'es'
      })
    }

    // Preparar datos para traducir
    const fieldsToTranslate: string[] = ['lesson_title']
    if (lesson.lesson_description) fieldsToTranslate.push('lesson_description')
    if (lesson.transcript_content) fieldsToTranslate.push('transcript_content')
    if (lesson.summary_content) fieldsToTranslate.push('summary_content')

    // PASO 1: Traducir usando AutoTranslationService

    let translations: Record<string, any> = {}
    
    try {
      translations = await AutoTranslationService.translateEntity(
        {
          lesson_title: lesson.lesson_title,
          lesson_description: lesson.lesson_description,
          transcript_content: lesson.transcript_content,
          summary_content: lesson.summary_content
        },
        fieldsToTranslate,
        'es',
        'lección',
        {
          context: 'Este es el contenido de una lección educativa sobre inteligencia artificial.',
          preserveFormatting: true,
          sourceLanguage: detectedLanguage,
        }
      )

    } catch (error) {
      console.error('[TEST-ES-TRANSLATION] ❌ Error en traducción:', error)
      return NextResponse.json({
        success: false,
        step: 'translation',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, { status: 500 })
    }

    // PASO 2: Verificar tamaño de datos
    const translationsJson = JSON.stringify(translations)
    const translationsSize = new Blob([translationsJson]).size


    // PASO 3: Intentar guardar directamente con Supabase para capturar el error

    let saved = false
    let saveError: any = null
    
    try {
      // Intentar guardar usando el servicio
      saved = await ContentTranslationService.saveTranslation(
        'lesson',
        lessonId,
        'es',
        translations,
        undefined,
        supabase
      )

    } catch (error) {
      saveError = error
      console.error('[TEST-ES-TRANSLATION] ❌ Excepción en saveTranslation:', error)
    }

    // Si falló, intentar guardar directamente para ver el error
    if (!saved && !saveError) {

      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        
        if (!supabaseUrl || !supabaseServiceKey) {
          saveError = {
            type: 'missing_env',
            message: 'Faltan variables de entorno',
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseServiceKey
          }
        } else {
          const directSupabase = createServiceClient(supabaseUrl, supabaseServiceKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          })

          const upsertData = {
            entity_type: 'lesson',
            entity_id: lessonId,
            language_code: 'es',
            translations: translations,
            created_by: null,
            updated_at: new Date().toISOString()
          }

          const { data: directData, error: directError } = await directSupabase
            .from('content_translations')
            .upsert(upsertData, {
              onConflict: 'entity_type,entity_id,language_code'
            })
            .select()

          if (directError) {
            saveError = {
              type: 'supabase_error',
              message: directError.message,
              details: directError.details,
              hint: directError.hint,
              code: directError.code
            }
            console.error('[TEST-ES-TRANSLATION] ❌ Error directo de Supabase:', directError)
          } else {
            saved = true

          }
        }
      } catch (directError) {
        saveError = {
          type: 'exception',
          message: directError instanceof Error ? directError.message : String(directError),
          stack: directError instanceof Error ? directError.stack : undefined
        }
        console.error('[TEST-ES-TRANSLATION] ❌ Excepción en guardado directo:', directError)
      }
    }

    // PASO 4: Verificar si se guardó
    const { data: savedTranslation, error: queryError } = await supabase
      .from('content_translations')
      .select('*')
      .eq('entity_type', 'lesson')
      .eq('entity_id', lessonId)
      .eq('language_code', 'es')
      .single()

    return NextResponse.json({
      success: saved,
      detectedLanguage,
      translationStep: {
        completed: true,
        translationKeys: Object.keys(translations),
        sampleTitle: translations.lesson_title?.substring(0, 100)
      },
      sizeCheck: {
        sizeBytes: translationsSize,
        sizeKB: (translationsSize / 1024).toFixed(2),
        sizeMB: (translationsSize / (1024 * 1024)).toFixed(2)
      },
      saveStep: {
        attempted: true,
        success: saved,
        foundInDB: !!savedTranslation
      },
      savedTranslation: savedTranslation || null,
      saveError: saveError || null,
      recommendation: saved 
        ? '✅ Traducción a español guardada exitosamente'
        : saveError
        ? `❌ Error al guardar: ${saveError.type || 'unknown'} - ${saveError.message || JSON.stringify(saveError)}`
        : '❌ Error al guardar traducción a español. Revisa los logs del servidor para más detalles.'
    })
  } catch (error) {
    console.error('[TEST-ES-TRANSLATION] ❌ Error en prueba:', error)
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

