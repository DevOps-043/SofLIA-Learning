'use server'

import { revalidatePath } from 'next/cache'
import { SessionService } from '../../auth/services/session.service'
import {
    createAdminSupabase,
    createNewCourseFromPayload,
    updateExistingCourseFromPayload,
    buildCoursePreviewFromPayload,
    resolveInstructor,
} from '../../../lib/courseImport'
import { buildCourseDiff } from '../../../lib/courseDiff'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StagingInstructor {
    first_name: string | null
    last_name: string | null
    email: string
}

interface StagingCourseRef {
    title: string
    slug: string
    thumbnail_url?: string | null
    level: string
    category: string
    description?: string
    instructor?: StagingInstructor | null
}

interface CoursePayload {
    title?: string
    description?: string
    level?: string
    category?: string
    thumbnail_url?: string | null
    instructor_email?: string
    course?: CoursePayload
    [key: string]: unknown
}

interface StagingRow {
    id: string
    course_id: string | null
    source_slug: string
    is_update: boolean
    submitted_at: string
    updated_at: string | null
    status: string
    rejection_reason: string | null
    payload: CoursePayload
    course: StagingCourseRef | null
}

export interface AdminCourse {
    id: string                  // courses_staging.id — usado como ID en toda la UI de revisiones
    title: string
    description: string
    slug: string
    category: string
    level: string
    thumbnail_url?: string
    is_active: boolean
    created_at: string          // staging.submitted_at
    updated_at: string
    instructor_name?: string
    duration_total_minutes: number
    duration_hours?: number
    approval_status: 'pending' | 'approved' | 'rejected'
    is_update: boolean
    rejection_reason?: string
}

interface CurrentCourseLesson {
    lesson_id: string
    lesson_title: string
    lesson_order_index: number | null
    duration_seconds: number | null
    video_provider: string | null
    video_provider_id: string | null
    transcript_content: string | null
    summary_content: string | null
    materials: Array<{
        material_id: string
        material_title: string | null
        material_type: string | null
        external_url: string | null
        file_url: string | null
        content_data: unknown
    }>
    activities: Array<{
        activity_id: string
        activity_title: string | null
        activity_type: string | null
        activity_content: unknown
        activity_order_index: number | null
    }>
}

interface CurrentCourseModule {
    module_id: string
    module_title: string | null
    module_order_index: number | null
    is_published: boolean | null
    lessons: CurrentCourseLesson[]
}

interface CurrentCourseStructure {
    title: string
    description: string | null
    level: string | null
    category: string | null
    thumbnail_url: string | null
    slug: string | null
    instructor?: unknown
    modules: CurrentCourseModule[]
}

type CoursePreview = ReturnType<typeof buildCoursePreviewFromPayload>

interface CourseStagingDetails extends CoursePreview {
    original_course?: CurrentCourseStructure
    diff?: ReturnType<typeof buildCourseDiff>
}

// ─── Leer pendientes / rechazados ─────────────────────────────────────────────

export async function getPendingCourses(): Promise<AdminCourse[]> {
    const supabase = createAdminSupabase()

    const { data, error } = await supabase
        .from('courses_staging')
        .select(`
            id,
            course_id,
            source_slug,
            is_update,
            submitted_at,
            updated_at,
            status,
            rejection_reason,
            payload,
            course:courses!course_id (
                title,
                slug,
                thumbnail_url,
                level,
                category,
                instructor:users!fk_courses_instructor(first_name, last_name, email)
            )
        `)
        .in('status', ['pending', 'rejected'])
        .order('submitted_at', { ascending: false })

    if (error) {
        console.error('Error fetching staging courses:', error)
        throw new Error(error.message)
    }

    return (data ?? []).map((row: StagingRow) => {
        const coursePayload: CoursePayload = row.payload?.course ?? {}
        const existingCourse = row.course

        const title = coursePayload.title || existingCourse?.title || 'Sin título'
        const description = coursePayload.description || existingCourse?.description || ''
        const level = coursePayload.level || existingCourse?.level || 'beginner'
        const category = coursePayload.category || existingCourse?.category || 'General'
        const thumbnail_url = coursePayload.thumbnail_url ?? existingCourse?.thumbnail_url ?? undefined

        let instructor_name = 'Desconocido'
        if (existingCourse?.instructor) {
            const ins = existingCourse.instructor
            instructor_name = `${ins.first_name ?? ''} ${ins.last_name ?? ''}`.trim() || ins.email
        } else if (coursePayload.instructor_email) {
            instructor_name = coursePayload.instructor_email
        }

        return {
            id: row.id,
            title,
            description,
            slug: row.source_slug,
            category,
            level,
            thumbnail_url,
            is_active: false,
            created_at: row.submitted_at,
            updated_at: row.updated_at ?? row.submitted_at,
            instructor_name,
            duration_total_minutes: 0,
            duration_hours: 0,
            approval_status: row.status as 'pending' | 'approved' | 'rejected',
            is_update: row.is_update,
            rejection_reason: row.rejection_reason ?? undefined,
        }
    })
}

// ─── Obtener estructura actual del curso publicado (para comparación) ────────

async function getCurrentCourseStructure(
    supabase: ReturnType<typeof createAdminSupabase>,
    courseId: string
): Promise<CurrentCourseStructure | null> {
    const { data: course, error: courseError } = await supabase
        .from('courses')
        .select(`
            title, description, level, category, thumbnail_url, slug,
            instructor:users!fk_courses_instructor(first_name, last_name, email, display_name, profile_picture_url)
        `)
        .eq('id', courseId)
        .single()

    if (courseError || !course) return null

    const { data: modules } = await supabase
        .from('course_modules')
        .select('module_id, module_title, module_order_index, is_published')
        .eq('course_id', courseId)
        .order('module_order_index', { ascending: true })

    const modulesWithLessons = []
    for (const mod of (modules ?? [])) {
        const { data: lessons } = await supabase
            .from('course_lessons')
            .select(`
                lesson_id, lesson_title, lesson_order_index,
                duration_seconds, video_provider, video_provider_id,
                transcript_content, summary_content
            `)
            .eq('module_id', mod.module_id)
            .order('lesson_order_index', { ascending: true })

        const lessonsWithContent = []
        for (const lesson of (lessons ?? [])) {
            const { data: materials } = await supabase
                .from('lesson_materials')
                .select('material_id, material_title, material_type, external_url, file_url, content_data')
                .eq('lesson_id', lesson.lesson_id)
                .order('material_order_index', { ascending: true })

            const { data: activities } = await supabase
                .from('lesson_activities')
                .select('activity_id, activity_title, activity_type, activity_content, activity_order_index')
                .eq('lesson_id', lesson.lesson_id)
                .order('activity_order_index', { ascending: true })

            lessonsWithContent.push({
                ...lesson,
                materials: materials ?? [],
                activities: activities ?? [],
            })
        }

        modulesWithLessons.push({
            ...mod,
            lessons: lessonsWithContent,
        })
    }

    return {
        ...course,
        modules: modulesWithLessons,
    }
}

// ─── Detalle de un staging row (para la vista de revisión) ───────────────────

export async function getStagingDetails(stagingId: string): Promise<CourseStagingDetails> {
    const supabase = createAdminSupabase()

    const { data: staging, error } = await supabase
        .from('courses_staging')
        .select(`
            *,
            course:courses!course_id (
                title, slug, thumbnail_url, level, category,
                instructor:users!fk_courses_instructor(first_name, last_name, email, display_name, profile_picture_url)
            )
        `)
        .eq('id', stagingId)
        .single()

    if (error || !staging) {
        throw new Error(error?.message ?? 'Staging row no encontrado')
    }

    const preview = buildCoursePreviewFromPayload(staging)

    // If it's an update and the original course exists, build comparison
    if (staging.is_update && staging.course_id) {
        const originalCourse = await getCurrentCourseStructure(supabase, staging.course_id)
        if (originalCourse) {
            const diff = buildCourseDiff(originalCourse, preview)
            return {
                ...preview,
                original_course: originalCourse,
                diff,
            }
        }
    }

    return preview
}

// ─── Aprobar ─────────────────────────────────────────────────────────────────

export async function approveCourse(stagingId: string, _adminId: string): Promise<boolean> {
    const user = await SessionService.getCurrentUser()
    const effectiveAdminId = user?.id


    if (!effectiveAdminId) {
        console.error('[APPROVE_ERROR] No admin identified')
        return false
    }

    const supabase = createAdminSupabase()

    const { data: staging, error: stagingError } = await supabase
        .from('courses_staging')
        .select('*')
        .eq('id', stagingId)
        .single()

    if (stagingError || !staging) {
        console.error('[APPROVE_ERROR] Staging row not found:', stagingError)
        return false
    }

    try {
        const instructorId = await resolveInstructor(supabase, staging.payload?.course?.instructor_email)

        let courseId: string

        if (staging.is_update && staging.course_id) {
            await updateExistingCourseFromPayload(supabase, staging.course_id, staging.payload, instructorId, effectiveAdminId)
            courseId = staging.course_id
        } else {
            courseId = await createNewCourseFromPayload(supabase, staging.payload, instructorId, effectiveAdminId)
        }

        // Publicar módulos y lecciones
        await supabase.from('course_modules').update({ is_published: true }).eq('course_id', courseId)
        const { data: modules } = await supabase.from('course_modules').select('module_id').eq('course_id', courseId)
        if (modules && modules.length > 0) {
            const moduleIds = modules.map((m: { module_id: string }) => m.module_id)
            await supabase.from('course_lessons').update({ is_published: true }).in('module_id', moduleIds)
        }

        // Marcar staging como aprobado
        await supabase
            .from('courses_staging')
            .update({ status: 'approved', reviewed_by: effectiveAdminId, reviewed_at: new Date().toISOString() })
            .eq('id', stagingId)

        revalidatePath('/admin/courses/pending')
        return true
    } catch (err: unknown) {
        console.error('[APPROVE_ERROR]', err instanceof Error ? err.message : String(err))
        return false
    }
}

// ─── Rechazar ────────────────────────────────────────────────────────────────

export async function rejectCourse(stagingId: string, reason: string): Promise<boolean> {
    const user = await SessionService.getCurrentUser()
    const supabase = createAdminSupabase()

    const { error } = await supabase
        .from('courses_staging')
        .update({
            status: 'rejected',
            rejection_reason: reason,
            reviewed_by: user?.id ?? null,
            reviewed_at: new Date().toISOString(),
        })
        .eq('id', stagingId)

    if (error) {
        console.error('Error rejecting course:', error)
        return false
    }

    revalidatePath('/admin/courses/pending')
    return true
}

// ─── Eliminar staging row ─────────────────────────────────────────────────────

export async function deleteCourse(stagingId: string): Promise<boolean> {
    const supabase = createAdminSupabase()

    const { error } = await supabase
        .from('courses_staging')
        .delete()
        .eq('id', stagingId)

    if (error) {
        console.error('Error deleting staging course:', error)
        return false
    }

    revalidatePath('/admin/courses/pending')
    return true
}

// ─── Reconsiderar (rechazado → pendiente) ────────────────────────────────────

export async function reconsiderCourse(stagingId: string): Promise<boolean> {
    const supabase = createAdminSupabase()

    const { error } = await supabase
        .from('courses_staging')
        .update({ status: 'pending', rejection_reason: null, reviewed_by: null, reviewed_at: null })
        .eq('id', stagingId)

    if (error) {
        console.error('Error reconsidering course:', error)
        return false
    }

    revalidatePath('/admin/courses/pending')
    return true
}
