import { NextRequest, NextResponse } from 'next/server'

import { AdminModulesService } from '@/features/admin/services/adminModules.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'

import { createModuleSchema, type CreateModuleBody } from './schema'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { id: courseId } = await context.params
  if (!courseId) {
    return apiError('COURSE_ID_REQUIRED', 'Course ID es requerido', 400)
  }

  try {
    const modules = await AdminModulesService.getCourseModules(courseId)
    return NextResponse.json({ success: true, modules })
  } catch {
    return apiError('LIST_MODULES_FAILED', 'Error al obtener módulos', 500)
  }
}

async function handlePost(
  _request: NextRequest,
  body: CreateModuleBody,
  context: RouteContext,
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { id: courseId } = await context.params
  if (!courseId) {
    return apiError('COURSE_ID_REQUIRED', 'Course ID es requerido', 400)
  }

  try {
    const module = await AdminModulesService.createModule(
      courseId,
      body,
      auth.userId,
    )
    return NextResponse.json({ success: true, module })
  } catch {
    return apiError('CREATE_MODULE_FAILED', 'Error al crear módulo', 500)
  }
}

export const POST = withZodBody(createModuleSchema, handlePost)
