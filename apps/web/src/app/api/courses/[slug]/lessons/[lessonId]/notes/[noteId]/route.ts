import { NextRequest, NextResponse } from 'next/server'
import { NoteService } from '@/features/courses/services/note.service'
import { CourseService } from '@/features/courses/services/course.service'
import { SessionService } from '@/features/auth/services/session.service'
import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * PUT /api/courses/[slug]/lessons/[lessonId]/notes/[noteId]
 * Actualiza una nota existente
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string; noteId: string }> }
) {
  try {
    const { slug, lessonId, noteId } = await params

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
    let { note_title, note_content, note_tags } = body

    // 🤖 GENERACIÓN DE TÍTULO POR IA: Si el título está vacío, generarlo automáticamente
    if (note_title !== undefined && (typeof note_title !== 'string' || note_title.trim().length === 0)) {
      try {
        let contentForAi = note_content;
        
        // Si no hay contenido en el body, intentar obtenerlo de la nota existente
        if (!contentForAi) {
          const notes = await NoteService.getNotesByLesson(currentUser.id, lessonId);
          const existingNote = notes.find(n => n.note_id === noteId);
          contentForAi = existingNote?.note_content;
        }
        
        const googleApiKey = process.env.GOOGLE_API_KEY;
        const geminiModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";
        
        if (googleApiKey && contentForAi) {
          const genAI = new GoogleGenerativeAI(googleApiKey);
          const model = genAI.getGenerativeModel({ model: geminiModel });
          
          const prompt = `Eres un asistente experto en educación que genera títulos cortos, profesionales y descriptivos para notas de estudio.
          
          Contenido de la nota: "${contentForAi.replace(/<[^>]*>?/gm, '').substring(0, 1500)}"
          
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
          }
        }
      } catch (aiError) {
        // console.error('Error generando título por IA (PUT):', aiError);
      }
    }

    const note = await NoteService.updateNote(currentUser.id, noteId, {
      note_title: note_title?.trim(),
      note_content: note_content?.trim(),
      note_tags
    })

    return NextResponse.json(note)
  } catch (error) {
    // console.error('Error in notes PUT API:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/courses/[slug]/lessons/[lessonId]/notes/[noteId]
 * Elimina una nota
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string; noteId: string }> }
) {
  try {
    const { slug, noteId } = await params

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

    await NoteService.deleteNote(currentUser.id, noteId)

    return NextResponse.json({ success: true })
  } catch (error) {
    // console.error('Error in notes DELETE API:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

