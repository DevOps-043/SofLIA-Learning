import { NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { requireAdmin } from '@/lib/auth/requireAdmin'

import { logger } from '@/lib/utils/logger'

import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'

const assignUserLearningPathSchema = z.object({
  userId: z.string().uuid('UserId invalido'),
  learningPathId: z.string().uuid('LearningPathId invalido'),
})

const companyLearningPathParamsSchema = z.object({
  id: z.string().uuid('OrganizationId invalido'),
})

const assignmentIdSchema = z.string().uuid('AssignmentId invalido')

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = companyLearningPathParamsSchema.parse(await params)
    const assignmentId = request.nextUrl.searchParams.get('assignmentId')

    const assignmentIdResult = assignmentIdSchema.safeParse(assignmentId)
    if (!assignmentIdResult.success) {
      return NextResponse.json(
        { success: false, error: assignmentIdResult.error.errors[0]?.message || 'AssignmentId invalido' },
        { status: 400 },
      )
    }

    const cleanup = await AdminLearningPathsService.revokeFromUserWithCourseCleanup(
      id,
      assignmentIdResult.data,
    )
    return NextResponse.json({ success: true, ...cleanup })
  } catch (error) {
    logger.error('Error revoking user learning path assignment:', error)
    const isValidationError = error instanceof z.ZodError
    return NextResponse.json(
      {
        success: false,
        error: isValidationError
          ? error.errors[0]?.message || 'OrganizationId invalido'
          : 'Error al revocar la asignacion individual del learning path',
      },
      { status: isValidationError ? 400 : 500 },
    )
  }
}
