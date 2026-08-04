import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'
import type { ResolvedOrganizationContext } from '../organization-context.service'
import { applyAssignedCoursesContext } from './assigned-courses'
import type { PlatformContext } from './context.types'
import { applyResolvedOrganizationContext } from './organization-context'
import { applyPlatformCounts } from './platform-counts'
import { applyUserLearningContext } from './user-learning-context'

/**
 * El tenant lo resuelve SIEMPRE quien llama (`resolveActiveOrganizationContext`),
 * que es el único punto con la información necesaria: la ruta activa, la
 * organización pedida y el rol de plataforma. Aquí no se adivina ninguna
 * organización de respaldo: un `organizationContext` nulo significa "sin
 * empresa", no "usa cualquiera de las suyas".
 */
export async function fetchPlatformContext(params: {
  userId?: string
  organizationContext?: ResolvedOrganizationContext | null
}): Promise<PlatformContext> {
  const { userId, organizationContext } = params
  const context: PlatformContext = {}

  try {
    const supabase = await createClient()
    const organizationId = organizationContext?.organizationId ?? null

    applyResolvedOrganizationContext(context, organizationContext)
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
