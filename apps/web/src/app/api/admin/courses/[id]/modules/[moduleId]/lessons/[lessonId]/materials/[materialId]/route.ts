import { NextRequest, NextResponse } from 'next/server'

import { AdminMaterialsService } from '@/features/admin/services/adminMaterials.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'

import {
  updateMaterialSchema,
  type UpdateMaterialBody,
} from '../schema'

type RouteContext = {
  params: Promise<{
    id: string
    moduleId: string
    lessonId: string
    materialId: string
  }>
}

async function handlePut(
  _request: NextRequest,
  body: UpdateMaterialBody,
  context: RouteContext,
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { materialId, lessonId } = await context.params
  if (!materialId || !lessonId) {
    return apiError(
      'MATERIAL_ID_REQUIRED',
      'Material ID y Lesson ID son requeridos',
      400,
    )
  }

  try {
    const material = await AdminMaterialsService.updateMaterial(materialId, body)
    return NextResponse.json({ success: true, material })
  } catch {
    return apiError('UPDATE_MATERIAL_FAILED', 'Error al actualizar material', 500)
  }
}

export const PUT = withZodBody(updateMaterialSchema, handlePut)

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { materialId, lessonId } = await context.params
  if (!materialId || !lessonId) {
    return apiError(
      'MATERIAL_ID_REQUIRED',
      'Material ID y Lesson ID son requeridos',
      400,
    )
  }

  try {
    await AdminMaterialsService.deleteMaterial(materialId)
    return NextResponse.json({ success: true })
  } catch {
    return apiError('DELETE_MATERIAL_FAILED', 'Error al eliminar material', 500)
  }
}
