import { NextRequest, NextResponse } from 'next/server'

import { NoteService } from '@/features/courses/services/note.service'

import { CourseService } from '@/features/courses/services/course.service'

import { SessionService } from '@/features/auth/services/session.service'

import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * POST /api/courses/[slug]/lessons/[lessonId]/notes
 * Crea una nueva nota
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
  try {
    const { slug, lessonId } = await params
    // Obtener usuario autenticado usando el sistema de sesiones personalizado
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar que el curso existe (opcional, para validación)
    const course = await CourseService.getCourseBySlug(slug, currentUser.id)
    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    let { note_title, note_content, note_tags, source_type } = body

    // Validaciones
    if (!note_content || typeof note_content !== 'string' || note_content.trim().length === 0) {
      return NextResponse.json(
        { error: 'El contenido de la nota es requerido y no puede estar vacío' },
        { status: 400 }
      )
    }

    // 🤖 GENERACIÓN DE TÍTULO POR IA: Si el título está vacío, generarlo automáticamente
    if (!note_title || typeof note_title !== 'string' || note_title.trim().length === 0) {
      try {
        const googleApiKey = process.env.GOOGLE_API_KEY;
        const geminiModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";
        
        if (googleApiKey) {
          const genAI = new GoogleGenerativeAI(googleApiKey);
          const model = genAI.getGenerativeModel({ model: geminiModel });
          
          const prompt = `Eres un asistente experto en educación que genera títulos cortos, profesionales y descriptivos para notas de estudio.
          
          Contenido de la nota: "${note_content.replace(/<[^>]*>?/gm, '').substring(0, 1500)}"
          
          Instrucciones:
          1. El título debe ser muy corto (máximo 5 palabras).
          2. Debe capturar la esencia principal del contenido.
          3. Evita palabras genéricas como "Nota sobre" o "Resumen de".
          4. Responde ÚNICAMENTE con el texto del título, sin comillas, sin puntos finales y sin explicaciones.
          5. Idioma: Español.`;
          
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const generatedTitle = response.text().trim().replace(/^["']|["']$/g, '').replace(/\.$/, '');
          
          if (generatedTitle && generatedTitle.length > 0 && !generatedTitle.toLowerCase().includes("error")) {
            note_title = generatedTitle;
          } else {
            note_title = "Nota de estudio";
          }
        } else {
          note_title = "Nota de estudio";
        }
      } catch (aiError) {
        note_title = "Nota de estudio";
      }
    }

    // Validar que note_tags sea un array si se proporciona
    if (note_tags !== undefined && (!Array.isArray(note_tags) || note_tags.some(tag => typeof tag !== 'string'))) {
      return NextResponse.json(
        { error: 'Las etiquetas deben ser un array de strings' },
        { status: 400 }
      )
    }

    const note = await NoteService.createNote(currentUser.id, lessonId, {
      note_title: note_title.trim(),
      note_content: note_content.trim(),
      note_tags: note_tags && Array.isArray(note_tags) ? note_tags.filter(tag => tag.trim().length > 0) : [],
      source_type: source_type || 'manual'
    })
    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
        details: error instanceof Error ? error.stack : 'Sin detalles adicionales'
      },
      { status: 500 }
    )
  }
}
