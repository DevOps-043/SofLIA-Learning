import type { TFunction } from 'i18next'
import type { InviteRole, RoleLabel } from './types'

export function buildRoleLabels(t: TFunction<'business'>) {
  return {
    member: {
      label: t('users.roles.member', 'Miembro'),
      desc: t('users.modals.bulkInvite.roleDesc.member', 'Acceso basico a la plataforma'),
    },
    admin: {
      label: t('users.roles.admin', 'Administrador'),
      desc: t('users.modals.bulkInvite.roleDesc.admin', 'Puede gestionar usuarios y contenido'),
    },
    owner: {
      label: t('users.roles.owner', 'Propietario'),
      desc: t('users.modals.bulkInvite.roleDesc.owner', 'Control total de la organizacion'),
    },
  } satisfies Record<InviteRole, RoleLabel>
}
