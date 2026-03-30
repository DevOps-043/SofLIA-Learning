import { NextRequest, NextResponse } from 'next/server'
import { AdminModulesService, UpdateModuleData } from '@/features/admin/services/adminModules.service'
import { requireInstructor } from '@/lib/auth/requireAdmin'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string }> }
) {
  try {
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const { id: courseId, moduleId } = await params
    const instructorId = auth.userId

    if (!moduleId) {
      return NextResponse.json(
        { error: 'Module ID es requerido' },
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

    const module = await AdminModulesService.getModuleById(moduleId)

    if (!module) {
      return NextResponse.json(
        { error: 'Módulo no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      module
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener módulo' 
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string }> }
) {
  try {
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const { id: courseId, moduleId } = await params
    const instructorId = auth.userId
    const body = await request.json() as UpdateModuleData

    if (!moduleId) {
      return NextResponse.json(
        { error: 'Module ID es requerido' },
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

    const module = await AdminModulesService.updateModule(moduleId, body)

    return NextResponse.json({
      success: true,
      module
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al actualizar módulo' 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string }> }
) {
  try {
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const { id: courseId, moduleId } = await params
    const instructorId = auth.userId

    if (!moduleId) {
      return NextResponse.json(
        { error: 'Module ID es requerido' },
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

    await AdminModulesService.deleteModule(moduleId)

    return NextResponse.json({
      success: true,
      message: 'Módulo eliminado correctamente'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al eliminar módulo' 
      },
      { status: 500 }
    )
  }
}
