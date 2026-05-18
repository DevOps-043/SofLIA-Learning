import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

interface CourseModuleRow {
  module_id: string
  course_id: string
  module_duration_minutes?: number | null
}

interface CourseLessonDurationRow {
  lesson_id: string
  duration_seconds: number | null
}

interface EstimatedTimeRow {
  estimated_time_minutes: number | null
}

/**
 * POST /api/admin/courses/recalculate-durations
 * Recalcula las duraciones de todos los módulos de un curso o de todos los cursos
 * incluyendo videos + materiales + actividades
 */
export async function POST(request: NextRequest) {
  // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

    try {
        const body = await request.json().catch(() => ({}))
        const { courseId } = body // Optional: if not provided, recalculate all

        const supabase = await createClient()

        // Get all modules to recalculate
        let modulesQuery = supabase
            .from('course_modules')
            .select('module_id, course_id')
            .order('module_order_index', { ascending: true })

        if (courseId) {
            modulesQuery = modulesQuery.eq('course_id', courseId)
        }

        const { data: modules, error: modulesError } = await modulesQuery

        if (modulesError) {
            return NextResponse.json({
                success: false,
                error: 'Error al obtener módulos: ' + modulesError.message
            }, { status: 500 })
        }

        if (!modules || modules.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No hay módulos para recalcular',
                updated: 0
            })
        }

        let updatedCount = 0
        const results: Array<{ moduleId: string; newDuration: number }> = []

        // Batch fetch all lessons for all modules at once
        const moduleIds = modules.map(m => m.module_id)
        const { data: allLessons } = await supabase
            .from('course_lessons')
            .select('lesson_id, module_id, duration_seconds')
            .in('module_id', moduleIds)

        const lessonsByModule = new Map<string, CourseLessonDurationRow[]>()
        for (const lesson of (allLessons || []) as (CourseLessonDurationRow & { module_id: string })[]) {
            const existing = lessonsByModule.get(lesson.module_id) || []
            existing.push(lesson)
            lessonsByModule.set(lesson.module_id, existing)
        }

        // Batch fetch all materials and activities for all lessons
        const allLessonIds = (allLessons || []).map((l: { lesson_id: string }) => l.lesson_id)

        const [materialsResult, activitiesResult] = allLessonIds.length > 0
          ? await Promise.all([
              supabase
                .from('lesson_materials')
                .select('lesson_id, estimated_time_minutes')
                .in('lesson_id', allLessonIds),
              supabase
                .from('lesson_activities')
                .select('lesson_id, estimated_time_minutes')
                .in('lesson_id', allLessonIds),
            ])
          : [{ data: [] }, { data: [] }]

        // Build maps: lessonId -> total minutes
        const materialsByLesson = new Map<string, number>()
        for (const m of (materialsResult.data || []) as { lesson_id: string; estimated_time_minutes: number | null }[]) {
            materialsByLesson.set(m.lesson_id, (materialsByLesson.get(m.lesson_id) || 0) + (m.estimated_time_minutes || 0))
        }
        const activitiesByLesson = new Map<string, number>()
        for (const a of (activitiesResult.data || []) as { lesson_id: string; estimated_time_minutes: number | null }[]) {
            activitiesByLesson.set(a.lesson_id, (activitiesByLesson.get(a.lesson_id) || 0) + (a.estimated_time_minutes || 0))
        }

        // Calculate and update each module
        const moduleUpdates = modules.map((module) => {
            const lessonsList = lessonsByModule.get(module.module_id) || []

            const totalVideoSeconds = lessonsList.reduce((sum, lesson) =>
                sum + (lesson.duration_seconds || 0), 0)
            const videoMinutes = Math.round(totalVideoSeconds / 60)

            let materialsMinutes = 0
            let activitiesMinutes = 0
            for (const lesson of lessonsList) {
                materialsMinutes += materialsByLesson.get(lesson.lesson_id) || 0
                activitiesMinutes += activitiesByLesson.get(lesson.lesson_id) || 0
            }

            const totalMinutes = videoMinutes + materialsMinutes + activitiesMinutes
            return { moduleId: module.module_id, courseId: module.course_id, totalMinutes }
        })

        // Batch update all modules in parallel
        const updateResults = await Promise.all(
            moduleUpdates.map(({ moduleId, totalMinutes }) =>
                supabase
                    .from('course_modules')
                    .update({ module_duration_minutes: totalMinutes, updated_at: new Date().toISOString() })
                    .eq('module_id', moduleId)
                    .then(({ error }) => ({ moduleId, totalMinutes, error }))
            )
        )

        for (const res of updateResults) {
            if (!res.error) {
                updatedCount++
                results.push({ moduleId: res.moduleId, newDuration: res.totalMinutes })
            }
        }

        // Update course total durations — aggregate from computed values
        const courseIds = [...new Set((modules as CourseModuleRow[]).map(m => m.course_id))]
        const durationByCourse = new Map<string, number>()
        for (const { courseId, totalMinutes } of moduleUpdates) {
            durationByCourse.set(courseId, (durationByCourse.get(courseId) || 0) + totalMinutes)
        }

        await Promise.all(
            courseIds.map((cId) =>
                supabase
                    .from('courses')
                    .update({
                        duration_total_minutes: durationByCourse.get(cId) || 0,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', cId)
            )
        )

        return NextResponse.json({
            success: true,
            message: `Se recalcularon ${updatedCount} módulos exitosamente`,
            updated: updatedCount,
            results
        })

    } catch (error) {
        techDebtLogger.error('Error recalculating durations:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 })
    }
}
