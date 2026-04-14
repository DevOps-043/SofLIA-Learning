import { NextResponse } from 'next/server'

import { requireBusiness } from '@/lib/auth/requireBusiness'
import { logger } from '@/lib/utils/logger'
import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'

export async function GET() {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 },
      )
    }

    const assignments = await AdminLearningPathsService.listOrganizationAssignments(
      auth.organizationId,
    )

    return NextResponse.json({
      success: true,
      learningPaths: assignments
        .filter((assignment) => assignment.status === 'active')
        .map((assignment) => assignment.learning_path)
        .filter(Boolean),
    })
  } catch (error) {
    logger.error('Error fetching business learning paths:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener learning paths' },
      { status: 500 },
    )
  }
}
