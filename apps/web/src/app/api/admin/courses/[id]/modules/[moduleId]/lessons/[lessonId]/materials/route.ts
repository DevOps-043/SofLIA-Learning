import { NextRequest, NextResponse } from 'next/server'

import { AdminMaterialsService } from '@/features/admin/services/adminMaterials.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'

import {
  createMaterialSchema,
  type CreateMaterialBody,
} from './schema'

type RouteContext = {
  params: Promise<{ id: string; moduleId: string; lessonId: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { lessonId } = await context.params
  if (!lessonId) {
    return apiError('LESSON_ID_REQUIRED', 'Lesson ID es requerido', 400)
  }

  try {
    const materials = await AdminMaterialsService.getLessonMaterials(lessonId)
    return NextResponse.json({ success: true, materials })
  } catch {
    return apiError('LIST_MATERIALS_FAILED', 'Error al obtener materiales', 500)
  }
}

async function handlePost(
  _request: NextRequest,
  body: CreateMaterialBody,
  context: RouteContext,
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { lessonId } = await context.params
  if (!lessonId) {
    return apiError('LESSON_ID_REQUIRED', 'Lesson ID es requerido', 400)
  }

  try {
    const material = await AdminMaterialsService.createMaterial(
      lessonId,
      body,
      auth.userId,
    )
    return NextResponse.json({ success: true, material })
  } catch {
    return apiError('CREATE_MATERIAL_FAILED', 'Error al crear material', 500)
  }
}

export const POST = withZodBody(createMaterialSchema, handlePost)
