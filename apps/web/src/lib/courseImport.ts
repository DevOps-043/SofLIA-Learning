/**
 * courseImport.ts
 * Lógica compartida para aplicar un payload de CourseEngine
 * a las tablas courses / course_modules / course_lessons /
 * lesson_materials / lesson_activities.
 *
 * Usada por:
 *  - /api/cron/process-inbox (cron de inbox → staging)
 *  - adminCourses.actions.ts (approve: staging → cursos reales)
 */

import { createClient } from '@supabase/supabase-js'
import {
    normalizeImportedActivityContent,
    normalizeImportedMaterialContent,
} from './course-content'

interface QuizQuestionLike {
    id?: string
    question?: string
    questionText?: string
    questionType?: string
    type?: string
    options?: unknown
    correctAnswer?: string | number
    correct_answer?: string | number
    explanation?: string
    points?: number | string
}

interface QuizSourceData extends Record<string, unknown> {
    questions?: QuizQuestionLike[]
    items?: QuizQuestionLike[]
    passing_score?: number | string
}

interface CourseEngineMaterial {
    title: string
    type: string
    url?: string | null
    description?: string | null
    data?: unknown
}

interface CourseEngineActivity {
    title: string
    type: string
    data?: unknown
}

interface CourseEngineLesson {
    order_index: number
    title: string
    video_url?: string | null
    duration?: number | null
    transcription?: string | null
    summary?: string | null
    materials?: CourseEngineMaterial[]
    activities?: CourseEngineActivity[]
}

interface CourseEngineModule {
    order_index: number
    title: string
    description?: string | null
    lessons?: CourseEngineLesson[]
}

interface CourseEngineCourseData {
    title: string
    description?: string | null
    category?: string | null
    level?: string | null
    thumbnail_url?: string | null
    slug?: string
    price?: number | null
    instructor_email?: string | null
}

interface CourseEnginePayload {
    course: CourseEngineCourseData
    modules?: CourseEngineModule[]
}

interface StagingCoursePreview {
    id: string
    status?: string
    is_update?: boolean
    payload?: Partial<CourseEnginePayload> | null
    course?: {
        instructor?: {
            first_name?: string
            last_name?: string
            email?: string
            display_name?: string
        } | null
    } | null
}

// ─── Admin client (service role, sin cookies) ────────────────────────────────

export function createAdminSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('[courseImport] Missing SUPABASE env vars')
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function extractVideoInfo(url: string): { provider: 'youtube' | 'vimeo' | 'custom'; id: string } {
    if (!url) return { provider: 'custom', id: '' }
    const ytMatch = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)
    if (ytMatch && ytMatch[2].length === 11) return { provider: 'youtube', id: ytMatch[2] }
    const vimeoMatch = url.match(/(?:www\.|player\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|video\/|)(\d+)/)
    if (vimeoMatch?.[1]) return { provider: 'vimeo', id: vimeoMatch[1] }
    return { provider: 'custom', id: url }
}

export function normalizeQuizData(data?: QuizSourceData | null) {
    if (!data) return null
    const rawItems = Array.isArray(data.questions) ? data.questions : (Array.isArray(data.items) ? data.items : [])
    const questions = rawItems.map((q) => {
        const options = Array.isArray(q.options) ? q.options.map(String) : []
        let correctAnswer = q.correctAnswer ?? q.correct_answer ?? ''
        if (typeof correctAnswer === 'number' && options[correctAnswer]) correctAnswer = options[correctAnswer]
        else if (typeof correctAnswer !== 'string') correctAnswer = String(correctAnswer)
        return {
            id: q.id || `q-${Math.random().toString(36).substr(2, 9)}`,
            question: q.question || q.questionText || '',
            questionType: (q.questionType || q.type || 'multiple_choice').toLowerCase(),
            options,
            correctAnswer,
            explanation: q.explanation || '',
            points: Number(q.points) || 1,
        }
    })
    return { ...data, questions, items: undefined, passing_score: Number(data.passing_score) || 80 }
}

export async function resolveInstructor(
    supabase: ReturnType<typeof createAdminSupabase>,
    email?: string
): Promise<string> {
    if (email) {
        const { data } = await supabase.from('users').select('id').eq('email', email).single()
        if (data?.id) return data.id
    }
    const { data } = await supabase.from('users').select('id').limit(1).single()
    if (!data?.id) throw new Error('[courseImport] No users found in database')
    return data.id
}

// ─── Core: apply modules + lessons from payload to an existing course ────────

export async function applyPayloadToCourse(
    supabase: ReturnType<typeof createAdminSupabase>,
    courseId: string,
    instructorId: string,
    payload: CourseEnginePayload
): Promise<void> {
    const modules = payload.modules ?? []

    const validModuleIds: string[] = []
    const validLessonIds: string[] = []

    for (const mod of modules) {
        const moduleOrderIndex = mod.order_index;

        const { data: newModule, error: modError } = await supabase
            .from('course_modules')
            .upsert(
                {
                    course_id: courseId,
                    module_title: mod.title,
                    module_description: mod.description ?? null,
                    module_order_index: moduleOrderIndex,
                    is_published: false,
                    module_duration_minutes: 0,
                },
                { onConflict: 'course_id,module_order_index' }
            )
            .select()
            .single()

        if (modError) throw new Error(`Module upsert failed (order ${moduleOrderIndex}): ${modError.message}`)
        
        validModuleIds.push(newModule.module_id)

        for (const lesson of (mod.lessons ?? [])) {
            const lessonOrderIndex = lesson.order_index;
            const videoInfo = extractVideoInfo(lesson.video_url ?? '')

            const { data: newLesson, error: lessonError } = await supabase
                .from('course_lessons')
                .upsert(
                    {
                        module_id: newModule.module_id,
                        instructor_id: instructorId,
                        lesson_title: lesson.title,
                        lesson_order_index: lessonOrderIndex,
                        video_provider: videoInfo.provider,
                        video_provider_id: videoInfo.id || null,
                        duration_seconds: lesson.duration || 60,
                        transcript_content: lesson.transcription ?? null,
                        summary_content: lesson.summary ?? null,
                        is_published: false,
                    },
                    { onConflict: 'module_id,lesson_order_index' }
                )
                .select()
                .single()

            if (lessonError) throw new Error(`Lesson upsert failed (order ${lessonOrderIndex}): ${lessonError.message}`)

            const lessonId = newLesson.lesson_id
            validLessonIds.push(lessonId)

            // Materials: delete + reinsert
            await supabase.from('lesson_materials').delete().eq('lesson_id', lessonId)
            const materials = lesson.materials ?? []
            if (materials.length > 0) {
                const rows = materials.map((mat, idx: number) => ({
                    lesson_id: lessonId,
                    material_title: mat.title,
                    material_type:
                        mat.type === 'download'
                            ? 'document'
                            : mat.type === 'quiz'
                                ? 'quiz'
                                : mat.type === 'reading' || mat.type === 'exercise'
                                    ? mat.type
                                    : 'link',
                    external_url: mat.url ?? null,
                    file_url: mat.type === 'download' ? mat.url : null,
                    material_order_index: idx + 1,
                    material_description: mat.description ?? null,
                    content_data:
                        mat.type === 'quiz'
                            ? normalizeQuizData(mat.data)
                            : mat.type === 'reading' || mat.type === 'exercise'
                                ? normalizeImportedMaterialContent(mat.data)
                                : null,
                }))
                const { error } = await supabase.from('lesson_materials').insert(rows)
                if (error) throw new Error(`Materials insert failed: ${error.message}`)
            }

            // Activities: delete + reinsert
            await supabase.from('lesson_activities').delete().eq('lesson_id', lessonId)
            const activities = lesson.activities ?? []
            if (activities.length > 0) {
                const rows = activities.map((act, idx: number) => ({
                    lesson_id: lessonId,
                    activity_title: act.title,
                    activity_type: act.type === 'lia_script' ? 'ai_chat' : act.type,
                    activity_content:
                        act.type === 'quiz'
                            ? JSON.stringify(normalizeQuizData(act.data))
                            : normalizeImportedActivityContent(act.type, act.data),
                    activity_order_index: idx + 1,
                    is_required: false,
                }))
                const { error } = await supabase.from('lesson_activities').insert(rows)
                if (error) throw new Error(`Activities insert failed: ${error.message}`)
            }
        }
    }

    // --- Cleanup phase ---
    // Remove lessons that belong to this course but are no longer in the payload
    if (validModuleIds.length > 0) {
        let lessonDeleteQuery = supabase.from('course_lessons').delete().in('module_id', validModuleIds);
        if (validLessonIds.length > 0) {
            lessonDeleteQuery = lessonDeleteQuery.not('lesson_id', 'in', `(${validLessonIds.join(',')})`);
        }
        const { error: cleanupLessonError } = await lessonDeleteQuery;
        if (cleanupLessonError) console.error(`Failed to cleanup obsolete lessons: ${cleanupLessonError.message}`);
    }

    // Remove modules that belong to this course but are no longer in the payload
    let moduleDeleteQuery = supabase.from('course_modules').delete().eq('course_id', courseId);
    if (validModuleIds.length > 0) {
        moduleDeleteQuery = moduleDeleteQuery.not('module_id', 'in', `(${validModuleIds.join(',')})`);
    }
    const { error: cleanupModuleError } = await moduleDeleteQuery;
    if (cleanupModuleError) console.error(`Failed to cleanup obsolete modules: ${cleanupModuleError.message}`);
}

// ─── Create brand-new course from payload (used when approving a new course) ─

export async function createNewCourseFromPayload(
    supabase: ReturnType<typeof createAdminSupabase>,
    payload: CourseEnginePayload,
    instructorId: string,
    adminId: string
): Promise<string> {
    const { course: courseData } = payload

    const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
            title: courseData.title,
            description: courseData.description || courseData.title,
            category: courseData.category || 'General',
            level: courseData.level || 'beginner',
            instructor_id: instructorId,
            thumbnail_url: courseData.thumbnail_url ?? null,
            slug: courseData.slug,
            price: courseData.price || 0,
            is_active: true,
            approval_status: 'approved',
            approved_by: adminId,
            approved_at: new Date().toISOString(),
            learning_objectives: [],
        })
        .select()
        .single()

    if (courseError) throw new Error(`Course insert failed: ${courseError.message}`)

    await applyPayloadToCourse(supabase, course.id, instructorId, payload)
    return course.id
}

// ─── Update existing course from payload (used when approving an update) ─────

export async function updateExistingCourseFromPayload(
    supabase: ReturnType<typeof createAdminSupabase>,
    courseId: string,
    payload: CourseEnginePayload,
    instructorId: string,
    adminId: string
): Promise<void> {
    const { course: courseData } = payload

    const { error: courseError } = await supabase
        .from('courses')
        .update({
            title: courseData.title,
            description: courseData.description || courseData.title,
            category: courseData.category || 'General',
            level: courseData.level || 'beginner',
            instructor_id: instructorId,
            thumbnail_url: courseData.thumbnail_url ?? null,
            price: courseData.price || 0,
            is_active: true,
            approval_status: 'approved',
            approved_by: adminId,
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', courseId)

    if (courseError) throw new Error(`Course update failed: ${courseError.message}`)

    await applyPayloadToCourse(supabase, courseId, instructorId, payload)
}

// ─── Build course-like object from payload for the detail review UI ───────────

export function buildCoursePreviewFromPayload(staging: StagingCoursePreview) {
    const payload = staging.payload ?? {}
    const courseData = payload.course ?? {}
    const modules = payload.modules ?? []

    return {
        id: staging.id,                         // stagingId — used by approve/reject actions
        approval_status: staging.status,
        is_update: staging.is_update,
        thumbnail_url: courseData.thumbnail_url ?? null,
        title: courseData.title ?? 'Sin título',
        description: courseData.description || courseData.title || '',
        level: courseData.level || 'beginner',
        category: courseData.category || 'General',
        duration_total_minutes: 0,
        instructor: staging.course?.instructor ?? {
            first_name: '',
            last_name: '',
            email: courseData.instructor_email ?? '',
            display_name: courseData.instructor_email ?? 'Instructor',
        },
        modules: modules.map((mod, modIdx: number) => ({
            module_id: `staging-mod-${modIdx}`,
            module_title: mod.title,
            module_order_index: mod.order_index,
            is_published: false,
            lessons: (mod.lessons ?? []).map((lesson, lesIdx: number) => {
                const videoInfo = extractVideoInfo(lesson.video_url ?? '')
                return {
                    lesson_id: `staging-les-${modIdx}-${lesIdx}`,
                    lesson_title: lesson.title,
                    lesson_order_index: lesson.order_index,
                    duration_seconds: lesson.duration || 60,
                    video_provider: videoInfo.provider,
                    video_provider_id: videoInfo.id || null,
                    transcript_content: lesson.transcription ?? null,
                    summary_content: lesson.summary ?? null,
                    materials: (lesson.materials ?? []).map((mat, matIdx: number) => ({
                        material_id: `staging-mat-${modIdx}-${lesIdx}-${matIdx}`,
                        material_title: mat.title,
                        material_type:
                            mat.type === 'download'
                                ? 'document'
                                : mat.type,
                        external_url: mat.url ?? null,
                        file_url: mat.type === 'download' ? mat.url : null,
                        content_data:
                            mat.type === 'quiz'
                                ? normalizeQuizData(mat.data)
                                : normalizeImportedMaterialContent(mat.data),
                    })),
                    activities: (lesson.activities ?? []).map((act, actIdx: number) => ({
                        activity_id: `staging-act-${modIdx}-${lesIdx}-${actIdx}`,
                        activity_title: act.title,
                        activity_type: act.type === 'lia_script' ? 'ai_chat' : act.type,
                        activity_content:
                            act.type === 'quiz'
                                ? JSON.stringify(normalizeQuizData(act.data))
                                : normalizeImportedActivityContent(act.type, act.data),
                        activity_order_index: actIdx + 1,
                    })),
                }
            }),
        })),
    }
}
