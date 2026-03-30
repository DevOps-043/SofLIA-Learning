import { NextRequest, NextResponse } from 'next/server'
import { AdminMaterialsService, CreateMaterialData } from '@/features/admin/services/adminMaterials.service'
import { requireInstructor } from '@/lib/auth/requireAdmin'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string, lessonId: string }> }
) {
  try {
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const { id: courseId, lessonId } = await params
    const instructorId = auth.userId

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID es requerido' },
        { status: 400 }
      )
    }

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

    const materials = await AdminMaterialsService.getLessonMaterials(lessonId)

    return NextResponse.json({
      success: true,
      materials
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener materiales' 
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string, lessonId: string }> }
) {
  try {
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const { id: courseId, lessonId } = await params
    const instructorId = auth.userId
    const body = await request.json() as CreateMaterialData

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID es requerido' },
        { status: 400 }
      )
    }

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID es requerido' },
        { status: 400 }
      )
    }

    if (!body.material_title || !body.material_type) {
      return NextResponse.json(
        { error: 'material_title y material_type son requeridos' },
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

    const material = await AdminMaterialsService.createMaterial(lessonId, body, instructorId)

    return NextResponse.json({
      success: true,
      material
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al crear material' 
      },
      { status: 500 }
    )
  }
}

