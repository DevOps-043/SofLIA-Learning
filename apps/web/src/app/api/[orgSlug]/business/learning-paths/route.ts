import { NextResponse } from 'next/server'

import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'
import { LearningPathDefaultsService } from '@/features/learning-paths/services/learning-path-defaults.server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ orgSlug: string }>
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 },
      )
    }

    const [learningPaths, userAssignments, defaultRules, hierarchyNodes] = await Promise.all([
      AdminLearningPathsService.listLearningPaths(),
      AdminLearningPathsService.listUserAssignments(auth.organizationId),
      LearningPathDefaultsService.listDefaultRules(auth.organizationId),
      LearningPathDefaultsService.listHierarchyNodeOptions(auth.organizationId),
    ])

    return NextResponse.json({
      success: true,
      learningPaths: learningPaths.filter((path) => path.is_active),
      assignments: userAssignments.filter(
        (assignment) =>
          assignment.status === 'assigned' && assignment.learning_path?.is_active !== false,
      ),
      defaultRules: defaultRules.filter(
        (rule) => rule.status === 'active' && rule.learning_path?.is_active !== false,
      ),
      hierarchyNodes,
    })
  } catch (error) {
    logger.error('Error fetching business learning paths:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener rutas de aprendizaje' },
      { status: 500 },
    )
  }
}
