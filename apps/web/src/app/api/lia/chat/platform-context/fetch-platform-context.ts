import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'
import type { ResolvedOrganizationContext } from '../organization-context.service'
import { applyAssignedCoursesContext } from './assigned-courses'
import type { PlatformContext } from './context.types'
import {
  applyResolvedOrganizationContext,
  loadLatestUserOrganizationContext,
} from './organization-context'
import { applyPlatformCounts } from './platform-counts'
import { applyUserLearningContext } from './user-learning-context'

export async function fetchPlatformContext(params: {
  userId?: string
  organizationContext?: ResolvedOrganizationContext | null
}): Promise<PlatformContext> {
  const { userId, organizationContext } = params
  const context: PlatformContext = {}

  try {
    const supabase = await createClient()
    const effectiveOrganizationContext =
      organizationContext || (userId ? await loadLatestUserOrganizationContext(userId) : null)
    const organizationId = effectiveOrganizationContext?.organizationId ?? null

    applyResolvedOrganizationContext(context, effectiveOrganizationContext)
    await applyPlatformCounts(supabase, context)

    if (userId) {
      await applyUserLearningContext(supabase, context, userId, organizationId)
    }

    await applyAssignedCoursesContext(supabase, context, userId, organizationId)
  } catch (error) {
    techDebtLogger.error('⚠️ Error fetching platform context:', error)
  }

  return context
}
