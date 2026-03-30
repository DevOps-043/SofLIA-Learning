import { NextRequest, NextResponse } from 'next/server'
import { AdminMaterialsService, UpdateMaterialData } from '@/features/admin/services/adminMaterials.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string, lessonId: string, materialId: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const resolvedParams = await params
    const { materialId, lessonId } = resolvedParams

    if (!materialId || !lessonId) {
      return NextResponse.json(
        { error: 'Material ID y Lesson ID son requeridos' },
        { status: 400 }
      )
    }

    const body = await request.json() as UpdateMaterialData

    const material = await AdminMaterialsService.updateMaterial(materialId, body)

    return NextResponse.json({
      success: true,
      material
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al actualizar material' 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string, lessonId: string, materialId: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const resolvedParams = await params
    const { materialId, lessonId } = resolvedParams

    if (!materialId || !lessonId) {
      return NextResponse.json(
        { error: 'Material ID y Lesson ID son requeridos' },
        { status: 400 }
      )
    }

    await AdminMaterialsService.deleteMaterial(materialId)

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al eliminar material' 
      },
      { status: 500 }
    )
  }
}

