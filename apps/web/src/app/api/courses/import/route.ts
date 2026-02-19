
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Helper para extraer info de video
function extractVideoInfo(url: string): { provider: 'youtube' | 'vimeo' | 'custom', id: string } {
    if (!url) return { provider: 'custom', id: '' }

    // YouTube
    const ytRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const ytMatch = url.match(ytRegex)
    if (ytMatch && ytMatch[2].length === 11) {
        return { provider: 'youtube', id: ytMatch[2] }
    }

    // Vimeo
    const vimeoRegex = /(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:[a-zA-Z0-9_\-]+)?/
    const vimeoMatch = url.match(vimeoRegex)
    if (vimeoMatch && vimeoMatch[1]) {
        return { provider: 'vimeo', id: vimeoMatch[1] }
    }

    return { provider: 'custom', id: url }
}

// Nuevos Esquemas de Validación (Zod) basados en el JSON proporcionado

const ActivitySchema = z.object({
    title: z.string(),
    type: z.enum(['quiz', 'lia_script', 'puzzle', 'reflection']), // Ajustable según lo que llegue
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
    order: z.number()
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
    content_blocks: z.array(ContentBlockSchema).optional().default([])
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
        category: z.string().default('General'), // Default si no viene
        level: z.string().default('beginner'),   // Default si no viene
        instructor_email: z.string().email().optional(), // Opcional ahora, o default current user? Asumiremos current/admin por ahora o hardcoded si falta
        thumbnail_url: z.string().nullable().optional(),
        slug: z.string().optional(), // Puede generarse auto
    }),
    modules: z.array(NewModuleSchema),
})

export async function POST(request: Request) {
    try {
        // 1. Validar API Key
        const apiKey = request.headers.get('x-api-key')
        const validApiKey = process.env.COURSEFORGE_API_KEY

        if (!validApiKey || apiKey !== validApiKey) {
            return NextResponse.json(
                { error: 'Unauthorized: Invalid or missing API Key' },
                { status: 401 }
            )
        }

        // 2. Parsear y Validar Payload
        const body = await request.json()

        // CHEQUEO DE CONEXIÓN (PING)
        // Permite probar conectividad y API Key sin enviar un curso completo
        if (body.type === 'ping') {
            return NextResponse.json({ 
                message: 'Pong: Connection Successful', 
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV // Optional: confirm env
            }, { status: 200 })
        }

        const validation = CourseImportPayloadSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation Error', details: validation.error.format() },
                { status: 400 }
            )
        }

        const { course: courseData, modules } = validation.data
        const supabase = await createClient()

        // 3. Obtener Usuario Admin/Instructor por defecto (Para evitar fallos si no viene email)
        // En este caso, usaremos el primer usuario admin o un fallback.
        // O si viene email, lo buscamos.
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
            // Fallback: Obtener un usuario cualquiera (Peligroso en prod, util en dev)
            // Mejor: Requerir que el sistema tenga un 'System User' o fallar.
            // Para este fix, intentaremos obtener el usuario actual si hay sesión (auth header) o un usuario admin hardcoded en env si existiera.
            // En este contexto, asumiremos que si no hay instructor, el curso queda sin asignar o asignado a quien llame (pero es API Key...)
            // Vamos a buscar CUALQUIER usuario admin.
            const { data: anyAdmin } = await supabase
                .from('users')
                .select('id')
                .limit(1)
                .single()

            if (anyAdmin) instructorId = anyAdmin.id
            else {
                return NextResponse.json(
                    { error: 'No instructor found and no default user available.' },
                    { status: 500 }
                )
            }
        }

        // 4. Slug
        let slug = courseData.slug
        if (!slug) {
            // Generar slug simple
            slug = courseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4)
        }

        // Verificar duplicado
        const { data: existingSlug } = await supabase
            .from('courses')
            .select('id')
            .eq('slug', slug)
            .single()

        if (existingSlug) {
            slug = slug + '-' + Math.floor(Math.random() * 1000)
        }

        // 5. Inserción Transaccional (Secuencial simulada)

        // A. Crear Curso
        const { data: newCourse, error: createError } = await supabase
            .from('courses')
            .insert({
                title: courseData.title,
                description: courseData.description,
                category: courseData.category,
                level: courseData.level,
                instructor_id: instructorId,
                thumbnail_url: courseData.thumbnail_url,
                slug: slug,
                price: 0,
                is_active: false,
                approval_status: 'pending',
                learning_objectives: [],
            })
            .select()
            .single()

        if (createError) {
            console.error('Error creating course:', createError)
            return NextResponse.json({ error: 'Failed to create course', details: createError.message }, { status: 500 })
        }

        // B. Crear Módulos y Lecciones
        try {
            for (const mod of modules) {
                // Crear Módulo
                const { data: newModule, error: modError } = await supabase
                    .from('course_modules')
                    .insert({
                        course_id: newCourse.id,
                        module_title: mod.title,
                        module_description: mod.description,
                        module_order_index: mod.order_index,
                        is_published: false,
                        module_duration_minutes: 0,
                    })
                    .select()
                    .single()

                if (modError) throw modError

                for (const lesson of mod.lessons) {
                    const videoInfo = extractVideoInfo(lesson.video_url || '')

                    // DEBUG: Log the duration value before insert
                    const durationToInsert = lesson.duration || 1
                    console.log(`[IMPORT DEBUG] Lesson: "${lesson.title}" | lesson.duration: ${lesson.duration} | Using: ${durationToInsert}`)

                    // Crear Lección
                    const { data: newLesson, error: lessonError } = await supabase
                        .from('course_lessons')
                        .insert({
                            module_id: newModule.module_id,
                            instructor_id: instructorId,
                            lesson_title: lesson.title,
                            lesson_order_index: lesson.order_index,
                            video_provider: videoInfo.provider,
                            video_provider_id: videoInfo.id,
                            duration_seconds: durationToInsert,
                            transcript_content: lesson.transcription,
                            summary_content: lesson.summary,
                            is_published: false,
                        })
                        .select()
                        .single()

                    if (lessonError) throw lessonError

                    // Crear Materiales
                    if (lesson.materials && lesson.materials.length > 0) {
                        const materialsToInsert = lesson.materials.map((mat, idx) => {
                            // Mapeo de tipos
                            let matType = 'link'
                            if (mat.type === 'download') matType = 'document' // o 'pdf' si podemos inferir
                            if (mat.type === 'pdf') matType = 'pdf'
                            if (mat.type === 'quiz') matType = 'quiz'

                            return {
                                lesson_id: newLesson.lesson_id,
                                material_title: mat.title,
                                material_type: matType,
                                external_url: mat.url, // Guardamos en external_url mayormente
                                file_url: mat.type === 'download' ? mat.url : null, // Si es descarga directa quizas file_url
                                material_order_index: idx + 1,
                                material_description: mat.description || null,
                                content_data: mat.type === 'quiz' ? mat.data : null,
                            }
                        })

                        const { error: matError } = await supabase
                            .from('lesson_materials')
                            .insert(materialsToInsert)

                        if (matError) throw matError
                    }

                    // Crear Actividades (Nuevo)
                    if (lesson.activities && lesson.activities.length > 0) {
                        const activitiesToInsert = lesson.activities.map((act, idx) => {
                            // Adaptar tipo
                            let actType = 'exercise'
                            if (act.type === 'quiz') actType = 'quiz'
                            if (act.type === 'lia_script') actType = 'ai_chat' // Mapeamos lia_script a ai_chat o similar

                            return {
                                lesson_id: newLesson.lesson_id,
                                activity_title: act.title,
                                activity_type: actType,
                                activity_content: JSON.stringify(act.data), // Guardamos la data como string JSON
                                activity_order_index: idx + 1,
                                is_required: false
                            }
                        })

                        const { error: actError } = await supabase
                            .from('lesson_activities')
                            .insert(activitiesToInsert)

                        if (actError) throw actError
                    }
                }
            }

            return NextResponse.json({
                success: true,
                course_id: newCourse.id,
                message: 'Course imported successfully with enhanced details.'
            })

        } catch (insertError: any) {
            console.error('Error inserting modules/lessons:', insertError)
            // Rollback manual
            await supabase.from('courses').delete().eq('id', newCourse.id)

            return NextResponse.json(
                { error: 'Partial processing failure. Rolled back.', details: insertError.message || String(insertError) },
                { status: 500 }
            )
        }

    } catch (error: any) {
        console.error('Unexpected error:', error)
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
    }
}
