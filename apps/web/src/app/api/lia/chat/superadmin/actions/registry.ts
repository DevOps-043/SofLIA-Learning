import {
  createOrganizationAction,
  setOrganizationBrandingAction,
} from './handlers/organization.actions'
import { createUserAction, setUserBanAction } from './handlers/user.actions'
import {
  addDefaultCourseAction,
  createInviteLinkAction,
} from './handlers/enrollment.actions'
import type { RegisteredAction } from './types'
import {
  assignCourseToUserAction,
  assignCourseToHierarchyNodeAction,
  assignLearningPathToUserAction,
  assignUserToHierarchyNodeAction,
  createOrganizationStructureAction,
  createOrganizationHierarchyNodeAction,
  generateOrganizationAnalyticsReportAction,
  removeUserCoursesAction,
  removeUserFromOrganizationAction,
} from './handlers/organization-operations.actions'

/**
 * Catálogo de acciones administrativas que SofLIA puede PROPONER.
 *
 * Es una allowlist cerrada: el modelo no puede ejecutar nada que no esté aquí.
 * Añadir una capacidad nueva = escribir un handler con `defineAction` y
 * registrarlo en esta lista; el motor (validación, confirmación, auditoría,
 * catálogo del prompt) no cambia.
 */
const ACTION_DEFINITIONS: readonly RegisteredAction[] = [
  createOrganizationAction,
  setOrganizationBrandingAction,
  setUserBanAction,
  createUserAction,
  addDefaultCourseAction,
  createInviteLinkAction,
  removeUserFromOrganizationAction,
  removeUserCoursesAction,
  assignCourseToUserAction,
  assignLearningPathToUserAction,
  generateOrganizationAnalyticsReportAction,
  createOrganizationHierarchyNodeAction,
  assignUserToHierarchyNodeAction,
  assignCourseToHierarchyNodeAction,
  createOrganizationStructureAction,
]

const ACTIONS_BY_ID = new Map<string, RegisteredAction>(
  ACTION_DEFINITIONS.map((definition) => [definition.id, definition]),
)

/** Devuelve la acción registrada, o `null` si no está en la allowlist. */
export function findActionDefinition(actionId: string): RegisteredAction | null {
  return ACTIONS_BY_ID.get(actionId) ?? null
}

/** Todas las acciones registradas (para construir el catálogo del prompt). */
export function listActionDefinitions(): readonly RegisteredAction[] {
  return ACTION_DEFINITIONS
}
