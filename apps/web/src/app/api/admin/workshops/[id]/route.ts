import { NextRequest, NextResponse } from 'next/server'
import { AdminWorkshopsService } from '@/features/admin/services/adminWorkshops.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { UpdateWorkshopSchema } from '@/lib/schemas/workshop.schema'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { id: workshopId } = await params
    const supabase = await createClient()

    const { data: workshop, error } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        category,
        level,
        duration_total_minutes,
        instructor_id,
        is_active,
        thumbnail_url,
        slug,
        price,
        average_rating,
        student_count,
        review_count,
        learning_objectives,
        approval_status,
        approved_by,
        approved_at,
        rejection_reason,
        created_at,
        updated_at
      `)
      .eq('id', workshopId)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Workshop not found' },
        { status: 404 }
      )
    }

    // Obtener información del instructor
    let instructorName = null
    if (workshop.instructor_id) {
      const { data: instructor } = await supabase
        .from('users')
        .select('display_name, first_name, last_name, username')
        .eq('id', workshop.instructor_id)
        .single()
      
      if (instructor) {
        instructorName = instructor.display_name || 
          `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() ||
          instructor.username ||
          'Instructor'
      }
    }

    return NextResponse.json({
      success: true,
      workshop: {
        ...workshop,
        instructor_name: instructorName
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { id: workshopId } = await params
    
    // ✅ SEGURIDAD: Validar datos de entrada con Zod
    const body = await request.json()
    const workshopData = UpdateWorkshopSchema.parse(body)
    
    // ✅ SEGURIDAD: Usar ID real del administrador autenticado
    const adminUserId = auth.userId
    
    // Obtener información de la request para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const updatedWorkshop = await AdminWorkshopsService.updateWorkshop(
      workshopId, 
      workshopData, 
      adminUserId,
      { ip, userAgent }
    )

    return NextResponse.json({
      success: true,
      workshop: updatedWorkshop
    })
  } catch (error) {
    // ✅ SEGURIDAD: Manejo específico de errores de validación
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors)
      return NextResponse.json({
        success: false,
        message: 'Datos inválidos',
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }, { status: 400 })
    }
    
    console.error('Error in PUT /api/admin/workshops/[id]:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al actualizar taller',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { id: workshopId } = await params
    
    // ✅ SEGURIDAD: Usar ID real del administrador autenticado
    const adminUserId = auth.userId
    
    // Obtener información de la request para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await AdminWorkshopsService.deleteWorkshop(workshopId, adminUserId, { ip, userAgent })

    return NextResponse.json({
      success: true,
      message: 'Taller eliminado correctamente'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar taller' },
      { status: 500 }
    )
  }
}
