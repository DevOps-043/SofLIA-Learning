import { NextRequest, NextResponse } from 'next/server'
import { AdminMaterialsService, CreateMaterialData } from '@/features/admin/services/adminMaterials.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string, lessonId: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { lessonId } = await params

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID es requerido' },
        { status: 400 }
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
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { lessonId } = await params
    const body = await request.json() as CreateMaterialData
    const adminUserId = auth.userId

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID es requerido' },
        { status: 400 }
      )
    }

    if (!body.material_title || !body.material_type) {
      return NextResponse.json(
        { error: 'material_title y material_type son requeridos' },
        { status: 400 }
      )
    }

    const material = await AdminMaterialsService.createMaterial(lessonId, body, adminUserId)

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

