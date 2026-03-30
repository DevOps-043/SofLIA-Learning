import { NextRequest, NextResponse } from 'next/server'
import { AdminLessonsService, CreateLessonData } from '@/features/admin/services/adminLessons.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { moduleId } = await params

    if (!moduleId) {
      return NextResponse.json(
        { error: 'Module ID es requerido' },
        { status: 400 }
      )
    }

    const lessons = await AdminLessonsService.getModuleLessons(moduleId)

    return NextResponse.json({
      success: true,
      lessons
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener lecciones' 
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string }> }
) {
  try {
    // ✅ Verificar autenticación y autorización de administrador
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { moduleId, id: courseId } = await params

    if (!moduleId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Module ID es requerido' 
        },
        { status: 400 }
      )
    }

    if (!courseId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Course ID es requerido' 
        },
        { status: 400 }
      )
    }

    // Parsear el body con manejo de errores
    let body: CreateLessonData
    try {
      body = await request.json() as CreateLessonData
    } catch (parseError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Error al parsear el cuerpo de la petición. Verifique que el formato JSON sea válido.' 
        },
        { status: 400 }
      )
    }

    // Validaciones de campos requeridos
    if (!body.lesson_title || body.lesson_title.trim() === '') {
      return NextResponse.json(
        { 
          success: false,
          error: 'El título de la lección es requerido' 
        },
        { status: 400 }
      )
    }

    if (!body.video_provider_id || body.video_provider_id.trim() === '') {
      return NextResponse.json(
        { 
          success: false,
          error: 'El ID del proveedor de video es requerido' 
        },
        { status: 400 }
      )
    }

    if (!body.instructor_id || body.instructor_id.trim() === '') {
      return NextResponse.json(
        { 
          success: false,
          error: 'El ID del instructor es requerido' 
        },
        { status: 400 }
      )
    }

    // Validar que duration_seconds sea mayor a 0
    if (!body.duration_seconds || body.duration_seconds <= 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'La duración debe ser mayor a 0 segundos',
          details: 'El campo duration_seconds debe tener un valor positivo'
        },
        { status: 400 }
      )
    }

    // Validar que video_provider sea válido
    const validProviders = ['youtube', 'vimeo', 'direct', 'custom']
    if (!body.video_provider || !validProviders.includes(body.video_provider)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Proveedor de video inválido',
          details: `El proveedor debe ser uno de: ${validProviders.join(', ')}`
        },
        { status: 400 }
      )
    }

    // Crear la lección
    const adminUserId = auth.userId
    const lesson = await AdminLessonsService.createLesson(moduleId, body, adminUserId)

    return NextResponse.json({
      success: true,
      lesson
    })
  } catch (error) {
    // Manejo de errores más descriptivo
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    const isSupabaseError = error && typeof error === 'object' && 'code' in error
    
    // Si es un error de Supabase, extraer información útil
    if (isSupabaseError) {
      const supabaseError = error as { code?: string; message?: string; details?: string }
      return NextResponse.json(
        { 
          success: false,
          error: 'Error al crear lección en la base de datos',
          details: supabaseError.message || errorMessage,
          code: supabaseError.code
        },
        { status: 500 }
      )
    }

    // Error genérico
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage || 'Error al crear lección'
      },
      { status: 500 }
    )
  }
}

