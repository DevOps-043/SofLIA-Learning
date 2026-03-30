
declare const process: any;

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
    normalizeImportedActivityContent,
    normalizeImportedMaterialContent,
} from '@/lib/course-content'

// ✅ Cliente administrativo para API routes externas (sin cookies)
// Usa Service Role Key en vez de cookies de sesión del navegador
function createServiceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
        throw new Error('[IMPORT API] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    return createSupabaseClient(url, serviceKey)
}

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

/**
 * Normaliza la estructura de datos de un Quiz que viene de CourseForge
 * para que sea compatible con los componentes de SofLIA-Learning.
 * Maneja field names como 'questions' vs 'items', y mapea índices de respuesta correcta a texto.
 */
function normalizeQuizData(data: any) {
    if (!data) return null;

    // 1. Obtener lista de preguntas (soporta 'questions' o 'items')
    const rawItems = Array.isArray(data.questions) ? data.questions : (Array.isArray(data.items) ? data.items : []);

    // 2. Mapear preguntas al formato estándar
    const normalizedQuestions = rawItems.map((q: any) => {
        // Normalizar tipo de pregunta (MULTIPLE_CHOICE -> multiple_choice)
        let qType = (q.questionType || q.type || 'multiple_choice').toLowerCase();

        // Asegurar que las opciones sean un array de strings
        const options = Array.isArray(q.options)
            ? q.options.map((opt: any) => typeof opt === 'string' ? opt : String(opt))
            : [];

        // Manejar respuesta correcta (CourseForge a veces envía el índice como número)
        let correctAnswer = q.correctAnswer !== undefined ? q.correctAnswer : (q.correct_answer !== undefined ? q.correct_answer : '');
        if (typeof correctAnswer === 'number' && options[correctAnswer]) {
            correctAnswer = options[correctAnswer];
        } else if (typeof correctAnswer !== 'string') {
            correctAnswer = String(correctAnswer);
        }

        return {
            id: q.id || `q-${Math.random().toString(36).substr(2, 9)}`,
            question: q.question || q.questionText || '',
            questionType: qType,
            options: options,
            correctAnswer: correctAnswer,
            explanation: q.explanation || '',
            points: Number(q.points) || 1
        };
    });

    return {
        ...data,
        questions: normalizedQuestions,
        // Remover 'items' para evitar confusión y duplicidad
        items: undefined,
        passing_score: Number(data.passing_score) || 80
    };
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

// ✅ NEW: GET Endpoint for Health Check & Diagnostics
export async function GET(request: Request) {
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasCourseForgeKey = !!process.env.COURSEFORGE_API_KEY;

    return NextResponse.json({
        status: 'active',
        service: 'soflia-learning-import-api',
        timestamp: new Date().toISOString(),
        config: {
            auth_configured: hasCourseForgeKey,
            db_configured: hasServiceKey
        }
    }, { status: 200 });
}

export async function POST(request: Request) {

    try {
        // 1. Validar API Key
        const apiKey = request.headers.get('x-api-key')
        const validApiKey = process.env.COURSEFORGE_API_KEY

        const debugKey = apiKey ? `${apiKey.substring(0, 4)}...` : 'NONE';

        if (!validApiKey || apiKey !== validApiKey) {
            console.warn('[IMPORT API] ❌ Unauthorized - API key mismatch')
            return NextResponse.json(
                { error: 'Unauthorized: Invalid or missing API Key' },
                { status: 401 }
            )
        }

        // 2. Parsear y Validar Payload
        let body;
        try {
            body = await request.json()
        } catch (e) {
            console.error('[IMPORT API] JSON Parse Error:', e)
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

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
            console.error('[IMPORT API] Validation Error:', JSON.stringify(validation.error.format(), null, 2))
            return NextResponse.json(
                { error: 'Validation Error', details: validation.error.format() },
                { status: 400 }
            )
        }

        const { course: courseData, modules } = validation.data
        const supabase = createServiceClient()

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

        // 5. Upsert Transaccional (Secuencial simulada)

        // A. Upsert Curso (idempotente por slug — soporta re-publicaciones)
        const { data: newCourse, error: createError } = await supabase
            .from('courses')
            .upsert(
                {
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
                },
                { onConflict: 'slug' }
            )
            .select()
            .single()

        if (createError) {
            console.error('[IMPORT API] Error upserting course:', createError)
            return NextResponse.json({ error: 'Failed to upsert course', details: createError.message }, { status: 500 })
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
                        module_order_index: mod.order_index + 1, // DB constraint requires >= 1
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

                    // Crear Lección
                    const { data: newLesson, error: lessonError } = await supabase
                        .from('course_lessons')
                        .insert({
                            module_id: newModule.module_id,
                            instructor_id: instructorId,
                            lesson_title: lesson.title,
                            lesson_order_index: lesson.order_index + 1, // DB constraint requires >= 1
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
                            if (mat.type === 'reading') matType = 'reading'
                            if (mat.type === 'exercise') matType = 'exercise'

                            return {
                                lesson_id: newLesson.lesson_id,
                                material_title: mat.title,
                                material_type: matType,
                                external_url: mat.url, // Guardamos en external_url mayormente
                                file_url: mat.type === 'download' ? mat.url : null, // Si es descarga directa quizas file_url
                                material_order_index: idx + 1,
                                material_description: mat.description || null,
                                content_data:
                                    mat.type === 'quiz'
                                        ? normalizeQuizData(mat.data)
                                        : mat.type === 'reading' || mat.type === 'exercise'
                                            ? normalizeImportedMaterialContent(mat.data)
                                            : null,
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
                                activity_content: act.type === 'quiz'
                                    ? JSON.stringify(normalizeQuizData(act.data))
                                    : normalizeImportedActivityContent(act.type, act.data),
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
            console.error('[IMPORT API] Error inserting modules/lessons:', insertError)
            // Rollback manual
            await supabase.from('courses').delete().eq('id', newCourse.id)

            return NextResponse.json(
                { error: 'Partial processing failure. Rolled back.', details: insertError.message || String(insertError) },
                { status: 500 }
            )
        }

    } catch (error: any) {
        console.error('[IMPORT API] Unexpected error:', error)
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
    }
}
