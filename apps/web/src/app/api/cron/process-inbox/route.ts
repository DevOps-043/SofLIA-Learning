import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminSupabase, resolveInstructor } from '@/lib/courseImport'

// ============================================================
// Schema de validación del payload
// ============================================================
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
    modules: z.array(z.any()),
})

// ============================================================
// Lógica de staging: registra en courses_staging sin tocar courses
// ============================================================
async function processInboxItem(
    supabase: ReturnType<typeof createAdminSupabase>,
    item: { course_slug: string; payload: any }
) {
    const validation = CourseImportPayloadSchema.safeParse(item.payload)
    if (!validation.success) {
        throw new Error(`Payload inválido: ${JSON.stringify(validation.error.format())}`)
    }

    const { course: courseData, source } = validation.data
    const slug = courseData.slug || item.course_slug

    // Resolver instructor (para validación, no se necesita guardar aquí)
    await resolveInstructor(supabase, courseData.instructor_email)

    // ¿El curso ya existe en producción? → determina is_update
    const { data: existingCourse } = await supabase
        .from('courses')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

    const isUpdate = !!existingCourse

    // ¿Ya hay un staging row pendiente para este slug? → UPDATE en vez de INSERT
    const { data: existingStagingRow } = await supabase
        .from('courses_staging')
        .select('id')
        .eq('source_slug', slug)
        .eq('status', 'pending')
        .maybeSingle()

    if (existingStagingRow) {
        const { error } = await supabase
            .from('courses_staging')
            .update({
                payload: item.payload,
                artifact_id: source.artifact_id,
                is_update: isUpdate,
                course_id: existingCourse?.id ?? null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', existingStagingRow.id)

        if (error) throw new Error(`Error actualizando staging row: ${error.message}`)
    } else {
        const { error } = await supabase
            .from('courses_staging')
            .insert({
                course_id: existingCourse?.id ?? null,
                source_slug: slug,
                artifact_id: source.artifact_id,
                payload: item.payload,
                is_update: isUpdate,
                status: 'pending',
            })

        if (error) throw new Error(`Error insertando staging row: ${error.message}`)
    }
}

// ============================================================
// GET /api/cron/process-inbox
// Llamado por el cron job de Netlify (Authorization: Bearer <CRON_SECRET>)
// ============================================================
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminSupabase()

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

    return NextResponse.json({ processed, errors, details })
}
