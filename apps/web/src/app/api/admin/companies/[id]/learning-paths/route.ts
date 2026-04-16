import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'

const assignLearningPathSchema = z.object({
  learningPathId: z.string().uuid('LearningPathId invalido'),
})
const companyLearningPathParamsSchema = z.object({
  id: z.string().uuid('OrganizationId invalido'),
})
const assignmentIdSchema = z.string().uuid('AssignmentId invalido')

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = companyLearningPathParamsSchema.parse(await params)
    const assignments = await AdminLearningPathsService.listOrganizationAssignments(id)

    return NextResponse.json({ success: true, assignments })
  } catch (error) {
    logger.error('Error fetching organization learning path assignments:', error)
    const isValidationError = error instanceof z.ZodError
    return NextResponse.json(
      {
        success: false,
        error: isValidationError
          ? error.errors[0]?.message || 'OrganizationId invalido'
          : 'Error al obtener learning paths de la empresa',
      },
      { status: isValidationError ? 400 : 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = companyLearningPathParamsSchema.parse(await params)
    const body = assignLearningPathSchema.parse(await request.json())

    const assignment = await AdminLearningPathsService.assignToOrganization(
      id,
      body.learningPathId,
      auth.userId,
    )

    return NextResponse.json({ success: true, assignment }, { status: 201 })
  } catch (error) {
    logger.error('Error assigning learning path to organization:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al asignar learning path a la empresa',
      },
      { status: 400 },
    )
  }
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

    await AdminLearningPathsService.revokeFromOrganization(id, assignmentIdResult.data)
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error revoking learning path from organization:', error)
    const isValidationError = error instanceof z.ZodError
    return NextResponse.json(
      {
        success: false,
        error: isValidationError
          ? error.errors[0]?.message || 'OrganizationId invalido'
          : 'Error al revocar learning path de la empresa',
      },
      { status: isValidationError ? 400 : 500 },
    )
  }
}
