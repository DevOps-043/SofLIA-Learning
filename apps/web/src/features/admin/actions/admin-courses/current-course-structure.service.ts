import type { createAdminSupabase } from '../../../../lib/courseImport'
import type { CurrentCourseStructure } from './current-course.types'

type AdminSupabaseClient = ReturnType<typeof createAdminSupabase>

async function fetchLessonContent(supabase: AdminSupabaseClient, lessonId: string) {
    const [{ data: materials }, { data: activities }] = await Promise.all([
        supabase
            .from('lesson_materials')
            .select('material_id, material_title, material_type, external_url, file_url, content_data')
            .eq('lesson_id', lessonId)
            .order('material_order_index', { ascending: true }),
        supabase
            .from('lesson_activities')
            .select('activity_id, activity_title, activity_type, activity_content, activity_order_index')
            .eq('lesson_id', lessonId)
            .order('activity_order_index', { ascending: true }),
    ])

    return { materials: materials ?? [], activities: activities ?? [] }
}

async function fetchLessonsWithContent(supabase: AdminSupabaseClient, moduleId: string) {
    const { data: lessons } = await supabase
        .from('course_lessons')
        .select(`
            lesson_id, lesson_title, lesson_order_index,
            duration_seconds, video_provider, video_provider_id,
            transcript_content, summary_content
        `)
        .eq('module_id', moduleId)
        .order('lesson_order_index', { ascending: true })

    return Promise.all(
        (lessons ?? []).map(async (lesson) => ({
            ...lesson,
            ...(await fetchLessonContent(supabase, lesson.lesson_id)),
        })),
    )
}

export async function getCurrentCourseStructure(
    supabase: AdminSupabaseClient,
    courseId: string,
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

    const modulesWithLessons = await Promise.all(
        (modules ?? []).map(async (mod) => ({
            ...mod,
            lessons: await fetchLessonsWithContent(supabase, mod.module_id),
        })),
    )

    return { ...course, modules: modulesWithLessons }
}
