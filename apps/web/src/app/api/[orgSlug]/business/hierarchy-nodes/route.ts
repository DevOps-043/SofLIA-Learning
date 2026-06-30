import { NextResponse } from 'next/server'
import { LearningPathDefaultsService } from '@/features/learning-paths/services/learning-path-defaults.server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ orgSlug: string }>
}

/**
 * GET /api/[orgSlug]/business/hierarchy-nodes
 * Returns the org's active hierarchy nodes for use in bulk assignment selectors.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({ success: false, error: 'No tienes una organización asignada' }, { status: 403 })
    }

    const hierarchyNodes = await LearningPathDefaultsService.listHierarchyNodeOptions(auth.organizationId)

    return NextResponse.json({ success: true, hierarchyNodes }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    logger.error('Error fetching hierarchy nodes for assignment:', error)
    return NextResponse.json({ success: false, hierarchyNodes: [] }, { status: 500 })
  }
}
