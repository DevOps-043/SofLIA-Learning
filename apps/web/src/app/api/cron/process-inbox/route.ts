import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// ============================================================
// Cliente admin (Service Role Key, sin cookies)
// ============================================================
function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
        throw new Error('[INBOX CRON] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }
    return createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    })
}

// ============================================================
// Helpers (idénticos a import/route.ts para consistencia)
// ============================================================
function extractVideoInfo(url: string): { provider: 'youtube' | 'vimeo' | 'custom'; id: string } {
    if (!url) return { provider: 'custom', id: '' }
    const ytMatch = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)
    if (ytMatch && ytMatch[2].length === 11) return { provider: 'youtube', id: ytMatch[2] }
    const vimeoMatch = url.match(/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:[a-zA-Z0-9_\-]+)?/)
    if (vimeoMatch && vimeoMatch[1]) return { provider: 'vimeo', id: vimeoMatch[1] }
    return { provider: 'custom', id: url }
}

function normalizeQuizData(data: any) {
    if (!data) return null
    const rawItems = Array.isArray(data.questions) ? data.questions : (Array.isArray(data.items) ? data.items : [])
    const normalizedQuestions = rawItems.map((q: any) => {
        const qType = (q.questionType || q.type || 'multiple_choice').toLowerCase()
        const options = Array.isArray(q.options)
            ? q.options.map((opt: any) => typeof opt === 'string' ? opt : String(opt))
            : []
        let correctAnswer = q.correctAnswer !== undefined ? q.correctAnswer : (q.correct_answer !== undefined ? q.correct_answer : '')
        if (typeof correctAnswer === 'number' && options[correctAnswer]) correctAnswer = options[correctAnswer]
        else if (typeof correctAnswer !== 'string') correctAnswer = String(correctAnswer)
        return {
            id: q.id || `q-${Math.random().toString(36).substr(2, 9)}`,
            question: q.question || q.questionText || '',
            questionType: qType,
            options,
            correctAnswer,
            explanation: q.explanation || '',
            points: Number(q.points) || 1,
        }
    })
    return { ...data, questions: normalizedQuestions, items: undefined, passing_score: Number(data.passing_score) || 80 }
}

// ============================================================
// Schemas Zod (mismo que import/route.ts)
// ============================================================
const ActivitySchema = z.object({
    title: z.string(),
    type: z.enum(['quiz', 'lia_script', 'puzzle', 'reflection']),
    data: z.record(z.any()),
})

const NewMaterialSchema = z.object({
    title: z.string(),
    url: z.string().optional(),
    type: z.enum(['link', 'download', 'pdf', 'document', 'quiz']),
    description: z.string().optional(),
    data: z.record(z.any()).optional(),
})

const ContentBlockSchema = z.object({
    title: z.string(),
    type: z.string(),
    content: z.string(),
    order: z.number(),
})

const NewLessonSchema = z.object({
    title: z.string(),
    order_index: z.number(),
    summary: z.string().optional(),
    transcription: z.string().optional(),
    video_url: z.string().optional(),
    duration: z.number().optional(),
    materials: z.array(NewMaterialSchema).optional().default([]),
    activities: z.array(ActivitySchema).optional().default([]),
    content_blocks: z.array(ContentBlockSchema).optional().default([]),
})

const NewModuleSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    order_index: z.number(),
    lessons: z.array(NewLessonSchema),
})

const CourseImportPayloadSchema = z.object({
    source: z.object({
        platform: z.string(),
        version: z.string(),
        artifact_id: z.string(),
    }),
    course: z.object({
        title: z.string(),
        description: z.string(),
        is_published: z.boolean().optional(),
        category: z.string().default('General'),
        level: z.string().default('beginner'),
        instructor_email: z.string().email().optional(),
        thumbnail_url: z.string().nullable().optional(),
        slug: z.string().optional(),
    }),
    modules: z.array(NewModuleSchema),
})

// ============================================================
// Lógica de procesamiento de un item del inbox
// ============================================================
async function processInboxItem(
    supabase: ReturnType<typeof createAdminClient>,
    item: { course_slug: string; payload: any }
) {
    const validation = CourseImportPayloadSchema.safeParse(item.payload)
    if (!validation.success) {
        throw new Error(`Payload inválido: ${JSON.stringify(validation.error.format())}`)
    }

    const { course: courseData, modules } = validation.data

    // Resolver instructor
    let instructorId: string | undefined
    if (courseData.instructor_email) {
        const { data: instructor } = await supabase
            .from('users')
            .select('id')
            .eq('email', courseData.instructor_email)
            .single()
        instructorId = instructor?.id
    }
    if (!instructorId) {
        const { data: anyAdmin } = await supabase.from('users').select('id').limit(1).single()
        if (anyAdmin) instructorId = anyAdmin.id
        else throw new Error('No se encontró ningún usuario instructor')
    }

    const slug = courseData.slug || item.course_slug

    // UPSERT curso (por slug)
    const { data: course, error: courseError } = await supabase
        .from('courses')
        .upsert(
            {
                title: courseData.title,
                description: courseData.description,
                category: courseData.category,
                level: courseData.level,
                instructor_id: instructorId,
                thumbnail_url: courseData.thumbnail_url,
                slug,
                price: 0,
                is_active: false,
            },
            { onConflict: 'slug' }
        )
        .select()
        .single()

    if (courseError) throw new Error(`Error en UPSERT de course: ${courseError.message}`)

    // UPSERT módulos y lecciones
    for (const mod of modules) {
        const moduleOrderIndex = mod.order_index + 1

        const { data: module, error: modError } = await supabase
            .from('course_modules')
            .upsert(
                {
                    course_id: course.id,
                    module_title: mod.title,
                    module_description: mod.description,
                    module_order_index: moduleOrderIndex,
                    is_published: false,
                    module_duration_minutes: 0,
                },
                { onConflict: 'course_id,module_order_index' }
            )
            .select()
            .single()

        if (modError) throw new Error(`Error en UPSERT de módulo "${mod.title}": ${modError.message}`)

        for (const lesson of mod.lessons) {
            const videoInfo = extractVideoInfo(lesson.video_url || '')
            const lessonOrderIndex = lesson.order_index + 1

            const { data: savedLesson, error: lessonError } = await supabase
                .from('course_lessons')
                .upsert(
                    {
                        module_id: module.module_id,
                        instructor_id: instructorId,
                        lesson_title: lesson.title,
                        lesson_order_index: lessonOrderIndex,
                        video_provider: videoInfo.provider,
                        video_provider_id: videoInfo.id,
                        duration_seconds: lesson.duration || 1,
                        transcript_content: lesson.transcription,
                        summary_content: lesson.summary,
                        is_published: false,
                    },
                    { onConflict: 'module_id,lesson_order_index' }
                )
                .select()
                .single()

            if (lessonError) throw new Error(`Error en UPSERT de lección "${lesson.title}": ${lessonError.message}`)

            const lessonId = savedLesson.lesson_id

            // Materiales: borrar y reinsertar
            await supabase.from('lesson_materials').delete().eq('lesson_id', lessonId)
            if (lesson.materials && lesson.materials.length > 0) {
                const materialsToInsert = lesson.materials.map((mat, idx) => {
                    let matType = 'link'
                    if (mat.type === 'download') matType = 'document'
                    if (mat.type === 'pdf') matType = 'pdf'
                    if (mat.type === 'quiz') matType = 'quiz'
                    return {
                        lesson_id: lessonId,
                        material_title: mat.title,
                        material_type: matType,
                        external_url: mat.url,
                        file_url: mat.type === 'download' ? mat.url : null,
                        material_order_index: idx + 1,
                        material_description: mat.description || null,
                        content_data: mat.type === 'quiz' ? normalizeQuizData(mat.data) : null,
                    }
                })
                const { error: matError } = await supabase.from('lesson_materials').insert(materialsToInsert)
                if (matError) throw new Error(`Error insertando materiales: ${matError.message}`)
            }

            // Actividades: borrar y reinsertar
            await supabase.from('lesson_activities').delete().eq('lesson_id', lessonId)
            if (lesson.activities && lesson.activities.length > 0) {
                const activitiesToInsert = lesson.activities.map((act, idx) => {
                    let actType = 'exercise'
                    if (act.type === 'quiz') actType = 'quiz'
                    if (act.type === 'lia_script') actType = 'ai_chat'
                    return {
                        lesson_id: lessonId,
                        activity_title: act.title,
                        activity_type: actType,
                        activity_content: act.type === 'quiz'
                            ? JSON.stringify(normalizeQuizData(act.data))
                            : JSON.stringify(act.data),
                        activity_order_index: idx + 1,
                        is_required: false,
                    }
                })
                const { error: actError } = await supabase.from('lesson_activities').insert(activitiesToInsert)
                if (actError) throw new Error(`Error insertando actividades: ${actError.message}`)
            }
        }
    }
}

// ============================================================
// GET /api/cron/process-inbox
// Llamado por el cron job de Netlify (Authorization: Bearer <CRON_SECRET>)
// ============================================================
export async function GET(request: Request) {
    // Autenticación por secret header
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Obtener ítems pendientes (máx 5 por ejecución)
    const { data: inboxItems, error: fetchError } = await supabase
        .from('courseengine_inbox')
        .select('course_slug, payload')
        .eq('status', 'pending')
        .limit(5)

    if (fetchError) {
        console.error('[INBOX CRON] Error leyendo inbox:', fetchError)
        return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!inboxItems || inboxItems.length === 0) {
        return NextResponse.json({ processed: 0, errors: 0, message: 'Sin ítems pendientes' })
    }

    console.log(`[INBOX CRON] Procesando ${inboxItems.length} ítem(s)...`)

    let processed = 0
    let errors = 0
    const details: { slug: string; status: string; error?: string }[] = []

    for (const item of inboxItems) {
        try {
            await processInboxItem(supabase, item)

            await supabase
                .from('courseengine_inbox')
                .update({ status: 'processed', error_message: null, updated_at: new Date().toISOString() })
                .eq('course_slug', item.course_slug)

            processed++
            details.push({ slug: item.course_slug, status: 'processed' })
            console.log(`[INBOX CRON] ✅ ${item.course_slug} procesado`)
        } catch (err: any) {
            console.error(`[INBOX CRON] ❌ Error en ${item.course_slug}:`, err.message)

            await supabase
                .from('courseengine_inbox')
                .update({ status: 'error', error_message: err.message, updated_at: new Date().toISOString() })
                .eq('course_slug', item.course_slug)

            errors++
            details.push({ slug: item.course_slug, status: 'error', error: err.message })
        }
    }

    console.log(`[INBOX CRON] Resultado: ${processed} procesados, ${errors} errores`)
    return NextResponse.json({ processed, errors, details })
}
