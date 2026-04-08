/**
 * Plan Resolution Service
 *
 * Resolves which study plan to use for a given chat interaction.
 * Handles the ambiguity of users with multiple plans by requiring an explicit
 * activePlanId when more than one plan exists — preventing silent fallbacks.
 */

import { logger } from '@/lib/utils/logger'
import {
  listUserStudyPlans,
  type ListedStudyPlan,
} from '@/features/study-planner/services/study-planner-plans.server.service'

export type PlanResolutionStatus =
  | 'resolved'           // A single plan was selected (explicit or only one exists)
  | 'no_plans'           // User has no plans at all
  | 'needs_plan_selection' // Multiple plans exist and no activePlanId was provided

export interface PlanResolutionResult {
  status: PlanResolutionStatus
  plan?: ListedStudyPlan
  allPlans?: ListedStudyPlan[]
  /** Human-readable message for the needs_plan_selection case, ready to send to the user. */
  selectionPrompt?: string
}

/**
 * Resolves which study plan to use for a dashboard chat interaction.
 *
 * Rules:
 * - 0 plans → status: no_plans
 * - 1 plan  → status: resolved (use it automatically, regardless of activePlanId)
 * - N plans, activePlanId provided and valid → status: resolved
 * - N plans, activePlanId missing or not found → status: needs_plan_selection
 */
export async function resolvePlanSelectionForChat(params: {
  userId: string
  activePlanId?: string
}): Promise<PlanResolutionResult> {
  const { userId, activePlanId } = params

  let allPlans: ListedStudyPlan[]

  try {
    allPlans = await listUserStudyPlans(userId)
  } catch (error) {
    logger.error('[PlanResolution] Error al obtener planes del usuario:', error)
    throw error
  }

  if (allPlans.length === 0) {
    logger.info(`[PlanResolution] userId=${userId} no tiene planes.`)
    return { status: 'no_plans', allPlans: [] }
  }

  if (allPlans.length === 1) {
    logger.info(`[PlanResolution] userId=${userId} tiene 1 plan — usando automaticamente.`)
    return { status: 'resolved', plan: allPlans[0], allPlans }
  }

  // Multiple plans: require an explicit activePlanId
  if (activePlanId) {
    const matched = allPlans.find((p) => p.id === activePlanId)
    if (matched) {
      logger.info(
        `[PlanResolution] userId=${userId} tiene ${allPlans.length} planes — usando planId=${activePlanId} (explicito).`,
      )
      return { status: 'resolved', plan: matched, allPlans }
    }

    // activePlanId was provided but doesn't match any plan for this user —
    // treat as ambiguous rather than silently falling back.
    logger.warn(
      `[PlanResolution] userId=${userId} — planId=${activePlanId} no pertenece a este usuario. Solicitando seleccion.`,
    )
  } else {
    logger.info(
      `[PlanResolution] userId=${userId} tiene ${allPlans.length} planes pero no se recibio activePlanId. Solicitando seleccion.`,
    )
  }

  const planList = allPlans
    .map((p) => `- **${p.name}**${p.primaryCourseTitle ? ` (${p.primaryCourseTitle})` : ''}`)
    .join('\n')

  return {
    status: 'needs_plan_selection',
    allPlans,
    selectionPrompt:
      `Tienes varios planes de estudio activos. ¿Sobre cuál quieres que trabaje?\n\n${planList}\n\nDime el nombre del plan y continuo.`,
  }
}
