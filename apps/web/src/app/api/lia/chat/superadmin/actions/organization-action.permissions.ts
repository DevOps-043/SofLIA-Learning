import type { ActionContext } from './types'

export type OrganizationMemberRole = 'owner' | 'admin' | 'member'

/**
 * Matriz para retirar miembros mediante SofLIA.
 *
 * - El superadmin conserva la autoridad global, pero el handler protege al
 *   último owner y prohíbe que el actor se retire a sí mismo.
 * - Un owner puede gestionar owners, admins y members, salvo al último owner.
 * - Un admin organizacional solo puede retirar members. Así nunca puede
 *   escalar privilegios eliminando a quien lo administra.
 */
export function canRemoveOrganizationMemberRole(
  context: Pick<ActionContext, 'actorAuthority' | 'organizationRole'>,
  targetRole: OrganizationMemberRole,
): boolean {
  if (context.actorAuthority === 'platform-superadmin') return true
  if (context.organizationRole === 'owner') return true
  return context.organizationRole === 'admin' && targetRole === 'member'
}
