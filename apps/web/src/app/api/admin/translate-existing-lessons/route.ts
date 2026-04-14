import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  translateActivityOnCreate,
  translateLessonOnCreate,
  translateMaterialOnCreate,
} from '@/core/services/courseTranslation.service'
import { LanguageDetectionService } from '@/core/services/languageDetection.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import type { SupportedLanguage } from '@/core/i18n/i18n'

const ALL_LANGUAGES: SupportedLanguage[] = ['es', 'en', 'pt']

type EntityType = 'lesson' | 'activity' | 'material'

type EntityStatus = 'translated' | 'pending' | 'failed'

interface EntityProgress {
  entityType: EntityType
  entityId: string
  title: string
  courseId: string
  status: EntityStatus
  missingLanguages: SupportedLanguage[]
  translatedLanguages: SupportedLanguage[]
  error?: string
}

interface CourseReport {
  courseId: string
  totalEntities: number
  translated: number
  pending: number
  failed: number
}

async function getExistingLanguages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entityType: EntityType,
  entityId: string,
): Promise<SupportedLanguage[]> {
  const { data } = await supabase
    .from('content_translations')
    .select('language_code')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)

  return (data || [])
    .map((item) => item.language_code)
    .filter((language): language is SupportedLanguage =>
      language === 'es' || language === 'en' || language === 'pt',
    )
}

function ensureCourseReport(
  reports: Map<string, CourseReport>,
  courseId: string,
): CourseReport {
  const existing = reports.get(courseId)
  if (existing) {
    return existing
  }

  const created: CourseReport = {
    courseId,
    totalEntities: 0,
    translated: 0,
    pending: 0,
    failed: 0,
  }
  reports.set(courseId, created)
  return created
}

function updateReport(report: CourseReport, status: EntityStatus) {
  report.totalEntities += 1
  if (status === 'translated') {
    report.translated += 1
    return
  }

  if (status === 'pending') {
    report.pending += 1
    return
  }

  report.failed += 1
}

async function computeMissingLanguages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entityType: EntityType,
  entityId: string,
  textsToDetect: string[],
): Promise<{ missingLanguages: SupportedLanguage[]; sourceLanguage: SupportedLanguage }> {
  const sourceLanguage = await LanguageDetectionService.detectLanguageFromMultipleTexts(
    textsToDetect.filter((text) => text.trim().length > 0),
  )

  const targetLanguages = ALL_LANGUAGES.filter((lang) => lang !== sourceLanguage)
  const existingLanguages = await getExistingLanguages(supabase, entityType, entityId)

  return {
    sourceLanguage,
    missingLanguages: targetLanguages.filter((lang) => !existingLanguages.includes(lang)),
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) {
      return auth
    }

    const body = await request.json().catch(() => ({}))
    const { lessonIds, courseId, includeActivities = true, includeMaterials = true } = body as {
      lessonIds?: string[]
      courseId?: string
      includeActivities?: boolean
      includeMaterials?: boolean
    }

    const supabase = await createClient()

    let lessonsQuery = supabase
      .from('course_lessons')
      .select(
        'lesson_id, lesson_title, lesson_description, transcript_content, summary_content, module_id, course_modules!inner(course_id)',
      )

    if (Array.isArray(lessonIds) && lessonIds.length > 0) {
      lessonsQuery = lessonsQuery.in('lesson_id', lessonIds)
    }

    if (courseId) {
      lessonsQuery = lessonsQuery.eq('course_modules.course_id', courseId)
    }

    const { data: lessons, error: lessonsError } = await lessonsQuery

    if (lessonsError) {
      return NextResponse.json(
        { error: 'Error al obtener lecciones', details: lessonsError.message },
        { status: 500 },
      )
    }

    if (!lessons || lessons.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No se encontraron lecciones para procesar',
        summary: {
          totalEntities: 0,
          translated: 0,
          pending: 0,
          failed: 0,
        },
        reportByCourse: [],
        details: [],
      })
    }

    const courseReports = new Map<string, CourseReport>()
    const details: EntityProgress[] = []

    for (const lesson of lessons as Array<{
      lesson_id: string
      lesson_title: string
      lesson_description: string | null
      transcript_content: string | null
      summary_content: string | null
      course_modules: { course_id: string }
    }>) {
      const lessonCourseId = lesson.course_modules.course_id
      const report = ensureCourseReport(courseReports, lessonCourseId)

      try {
        const { missingLanguages } = await computeMissingLanguages(
          supabase,
          'lesson',
          lesson.lesson_id,
          [lesson.lesson_title, lesson.lesson_description || ''],
        )

        if (missingLanguages.length === 0) {
          details.push({
            entityType: 'lesson',
            entityId: lesson.lesson_id,
            title: lesson.lesson_title,
            courseId: lessonCourseId,
            status: 'translated',
            missingLanguages: [],
            translatedLanguages: [],
          })
          updateReport(report, 'translated')
        } else {
          const translationResult = await translateLessonOnCreate(
            lesson.lesson_id,
            {
              lesson_title: lesson.lesson_title,
              lesson_description: lesson.lesson_description,
              transcript_content: lesson.transcript_content,
              summary_content: lesson.summary_content,
            },
            auth.userId,
          )

          const translatedLanguages = translationResult.languages || []
          const remainingMissing = missingLanguages.filter(
            (lang) => !translatedLanguages.includes(lang),
          )

          const status: EntityStatus =
            remainingMissing.length === 0
              ? 'translated'
              : translatedLanguages.length > 0
                ? 'pending'
                : 'failed'

          details.push({
            entityType: 'lesson',
            entityId: lesson.lesson_id,
            title: lesson.lesson_title,
            courseId: lessonCourseId,
            status,
            missingLanguages: remainingMissing,
            translatedLanguages,
            error:
              status === 'failed'
                ? Object.values(translationResult.errors || {}).join(', ') ||
                  'Error desconocido'
                : undefined,
          })
          updateReport(report, status)
        }
      } catch (error) {
        details.push({
          entityType: 'lesson',
          entityId: lesson.lesson_id,
          title: lesson.lesson_title,
          courseId: lessonCourseId,
          status: 'failed',
          missingLanguages: ALL_LANGUAGES,
          translatedLanguages: [],
          error: error instanceof Error ? error.message : String(error),
        })
        updateReport(report, 'failed')
      }

      if (includeActivities) {
        const { data: activities } = await supabase
          .from('lesson_activities')
          .select('activity_id, activity_title, activity_description, activity_content, ai_prompts')
          .eq('lesson_id', lesson.lesson_id)

        for (const activity of (activities || []) as Array<{
          activity_id: string
          activity_title: string
          activity_description: string | null
          activity_content: string
          ai_prompts: string | null
        }>) {
          const reportForActivity = ensureCourseReport(courseReports, lessonCourseId)
          try {
            const { missingLanguages } = await computeMissingLanguages(
              supabase,
              'activity',
              activity.activity_id,
              [activity.activity_title, activity.activity_description || ''],
            )

            if (missingLanguages.length === 0) {
              details.push({
                entityType: 'activity',
                entityId: activity.activity_id,
                title: activity.activity_title,
                courseId: lessonCourseId,
                status: 'translated',
                missingLanguages: [],
                translatedLanguages: [],
              })
              updateReport(reportForActivity, 'translated')
              continue
            }

            const translationResult = await translateActivityOnCreate(
              activity.activity_id,
              {
                activity_title: activity.activity_title,
                activity_description: activity.activity_description,
                activity_content: activity.activity_content,
                ai_prompts: activity.ai_prompts,
              },
              auth.userId,
            )

            const translatedLanguages = translationResult.languages || []
            const remainingMissing = missingLanguages.filter(
              (lang) => !translatedLanguages.includes(lang),
            )
            const status: EntityStatus =
              remainingMissing.length === 0
                ? 'translated'
                : translatedLanguages.length > 0
                  ? 'pending'
                  : 'failed'

            details.push({
              entityType: 'activity',
              entityId: activity.activity_id,
              title: activity.activity_title,
              courseId: lessonCourseId,
              status,
              missingLanguages: remainingMissing,
              translatedLanguages,
              error:
                status === 'failed'
                  ? Object.values(translationResult.errors || {}).join(', ') ||
                    'Error desconocido'
                  : undefined,
            })
            updateReport(reportForActivity, status)
          } catch (error) {
            details.push({
              entityType: 'activity',
              entityId: activity.activity_id,
              title: activity.activity_title,
              courseId: lessonCourseId,
              status: 'failed',
              missingLanguages: ALL_LANGUAGES,
              translatedLanguages: [],
              error: error instanceof Error ? error.message : String(error),
            })
            updateReport(reportForActivity, 'failed')
          }
        }
      }

      if (includeMaterials) {
        const { data: materials } = await supabase
          .from('lesson_materials')
          .select('material_id, material_title, material_description, content_data')
          .eq('lesson_id', lesson.lesson_id)

        for (const material of (materials || []) as Array<{
          material_id: string
          material_title: string
          material_description: string | null
          content_data: unknown
        }>) {
          const reportForMaterial = ensureCourseReport(courseReports, lessonCourseId)
          try {
            const { missingLanguages } = await computeMissingLanguages(
              supabase,
              'material',
              material.material_id,
              [material.material_title, material.material_description || ''],
            )

            if (missingLanguages.length === 0) {
              details.push({
                entityType: 'material',
                entityId: material.material_id,
                title: material.material_title,
                courseId: lessonCourseId,
                status: 'translated',
                missingLanguages: [],
                translatedLanguages: [],
              })
              updateReport(reportForMaterial, 'translated')
              continue
            }

            const translationResult = await translateMaterialOnCreate(
              material.material_id,
              {
                material_title: material.material_title,
                material_description: material.material_description,
                content_data:
                  material.content_data && typeof material.content_data === 'object'
                    ? (material.content_data as Record<string, unknown>)
                    : undefined,
              },
              auth.userId,
            )

            const translatedLanguages = translationResult.languages || []
            const remainingMissing = missingLanguages.filter(
              (lang) => !translatedLanguages.includes(lang),
            )
            const status: EntityStatus =
              remainingMissing.length === 0
                ? 'translated'
                : translatedLanguages.length > 0
                  ? 'pending'
                  : 'failed'

            details.push({
              entityType: 'material',
              entityId: material.material_id,
              title: material.material_title,
              courseId: lessonCourseId,
              status,
              missingLanguages: remainingMissing,
              translatedLanguages,
              error:
                status === 'failed'
                  ? Object.values(translationResult.errors || {}).join(', ') ||
                    'Error desconocido'
                  : undefined,
            })
            updateReport(reportForMaterial, status)
          } catch (error) {
            details.push({
              entityType: 'material',
              entityId: material.material_id,
              title: material.material_title,
              courseId: lessonCourseId,
              status: 'failed',
              missingLanguages: ALL_LANGUAGES,
              translatedLanguages: [],
              error: error instanceof Error ? error.message : String(error),
            })
            updateReport(reportForMaterial, 'failed')
          }
        }
      }
    }

    const reportByCourse = Array.from(courseReports.values())
    const summary = reportByCourse.reduce(
      (acc, item) => {
        acc.totalEntities += item.totalEntities
        acc.translated += item.translated
        acc.pending += item.pending
        acc.failed += item.failed
        return acc
      },
      { totalEntities: 0, translated: 0, pending: 0, failed: 0 },
    )

    return NextResponse.json({
      success: true,
      message: `Procesadas ${summary.totalEntities} entidades de contenido`,
      summary,
      reportByCourse,
      details,
    })
  } catch (error) {
    console.error('[translate-existing-lessons] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
