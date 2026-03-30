import { NextRequest, NextResponse } from 'next/server'
import { AdminModulesService, CreateModuleData } from '@/features/admin/services/adminModules.service'
import { requireInstructor } from '@/lib/auth/requireAdmin'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const { id: courseId } = await params
    const instructorId = auth.userId

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID es requerido' },
        { status: 400 }
      )
    }

    // ✅ Verificar que el curso pertenezca al instructor
    const supabase = await createClient()
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, instructor_id')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el instructor_id del curso coincida con el instructor autenticado
    if (course.instructor_id !== instructorId) {
      return NextResponse.json(
        { error: 'No tienes permiso para acceder a este curso' },
        { status: 403 }
      )
    }

    const modules = await AdminModulesService.getCourseModules(courseId)

    return NextResponse.json({
      success: true,
      modules
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener módulos' 
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const { id: courseId } = await params
    const instructorId = auth.userId
    const body = await request.json() as CreateModuleData

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID es requerido' },
        { status: 400 }
      )
    }

    if (!body.module_title) {
      return NextResponse.json(
        { error: 'module_title es requerido' },
        { status: 400 }
      )
    }

    // ✅ Verificar que el curso pertenezca al instructor
    const supabase = await createClient()
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, instructor_id')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el instructor_id del curso coincida con el instructor autenticado
    if (course.instructor_id !== instructorId) {
      return NextResponse.json(
        { error: 'No tienes permiso para modificar este curso' },
        { status: 403 }
      )
    }

    const module = await AdminModulesService.createModule(courseId, body, instructorId)

    return NextResponse.json({
      success: true,
      module
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al crear módulo' 
      },
      { status: 500 }
    )
  }
}
