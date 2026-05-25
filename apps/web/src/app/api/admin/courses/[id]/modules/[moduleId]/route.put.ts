import { NextRequest, NextResponse } from 'next/server'

import { AdminModulesService } from '@/features/admin/services/adminModules.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'

import {
  updateModuleSchema,
  type UpdateModuleBody,
} from '../schema'

type RouteContext = { params: Promise<{ id: string; moduleId: string }> }

async function handlePut(
  _request: NextRequest,
  body: UpdateModuleBody,
  context: RouteContext,
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { moduleId } = await context.params
  if (!moduleId) {
    return apiError('MODULE_ID_REQUIRED', 'Module ID es requerido', 400)
  }

  try {
    const module = await AdminModulesService.updateModule(moduleId, body)
    return NextResponse.json({ success: true, module })
  } catch {
    return apiError('UPDATE_MODULE_FAILED', 'Error al actualizar módulo', 500)
  }
}

export const PUT = withZodBody(updateModuleSchema, handlePut)
