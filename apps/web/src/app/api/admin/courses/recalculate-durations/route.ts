import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

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

        for (const module of modules) {
            // Get all lessons for this module
            const { data: lessons } = await supabase
                .from('course_lessons')
                .select('lesson_id, duration_seconds')
                .eq('module_id', module.module_id)

            const lessonsList = lessons || []
            const lessonIds = lessonsList.map((l: any) => l.lesson_id)

            // Sum video duration (seconds -> minutes)
            const totalVideoSeconds = lessonsList.reduce((sum: number, lesson: any) =>
                sum + (lesson.duration_seconds || 0), 0)
            const videoMinutes = Math.round(totalVideoSeconds / 60)

            let materialsMinutes = 0
            let activitiesMinutes = 0

            if (lessonIds.length > 0) {
                // Sum materials estimated time
                const { data: materials } = await supabase
                    .from('lesson_materials')
                    .select('estimated_time_minutes')
                    .in('lesson_id', lessonIds)

                materialsMinutes = (materials || []).reduce((sum: number, m: any) =>
                    sum + (m.estimated_time_minutes || 0), 0)

                // Sum activities estimated time
                const { data: activities } = await supabase
                    .from('lesson_activities')
                    .select('estimated_time_minutes')
                    .in('lesson_id', lessonIds)

                activitiesMinutes = (activities || []).reduce((sum: number, a: any) =>
                    sum + (a.estimated_time_minutes || 0), 0)
            }

            // Total = videos + materials + activities
            const totalMinutes = videoMinutes + materialsMinutes + activitiesMinutes

            // Update module duration
            const { error: updateError } = await supabase
                .from('course_modules')
                .update({
                    module_duration_minutes: totalMinutes,
                    updated_at: new Date().toISOString()
                })
                .eq('module_id', module.module_id)

            if (!updateError) {
                updatedCount++
                results.push({
                    moduleId: module.module_id,
                    newDuration: totalMinutes
                })
            }
        }

        // Also update course total duration
        const courseIds = [...new Set(modules.map(m => m.course_id))]

        for (const cId of courseIds) {
            const { data: courseModules } = await supabase
                .from('course_modules')
                .select('module_duration_minutes')
                .eq('course_id', cId)

            const totalCourseDuration = (courseModules || []).reduce((sum: number, m: any) =>
                sum + (m.module_duration_minutes || 0), 0)

            await supabase
                .from('courses')
                .update({
                    duration_total_minutes: totalCourseDuration,
                    updated_at: new Date().toISOString()
                })
                .eq('id', cId)
        }

        return NextResponse.json({
            success: true,
            message: `Se recalcularon ${updatedCount} módulos exitosamente`,
            updated: updatedCount,
            results
        })

    } catch (error) {
        console.error('Error recalculating durations:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 })
    }
}
