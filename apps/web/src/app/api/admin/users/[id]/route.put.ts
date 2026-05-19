import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { AdminUsersService } from '@/features/admin/services/adminUsers.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { UpdateUserSchema } from '@/lib/schemas/user.schema'

type UpdateUserBody = z.infer<typeof UpdateUserSchema>
type RouteContext = { params: Promise<{ id: string }> }

async function handlePut(
  request: NextRequest,
  body: UpdateUserBody,
  context: RouteContext,
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { id: userId } = await context.params
  const adminUserId = auth.userId
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  try {
    const updatedUser = await AdminUsersService.updateUser(
      userId,
      body,
      adminUserId,
      { ip, userAgent },
    )

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })
  } catch {
    return apiError('UPDATE_USER_FAILED', 'Error al actualizar usuario', 500)
  }
}

export const PUT = withZodBody(UpdateUserSchema, handlePut)
