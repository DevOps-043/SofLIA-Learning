import { AlertCircle, CheckCircle, Clock, Pause, XCircle } from 'lucide-react'
import type { TFunction } from 'i18next'

export function getInviteLinkStatusConfig(
  status: string,
  t: TFunction<'business'>,
  fallback: { bgColor: string; color: string },
) {
  switch (status) {
    case 'active':
      return { label: t('users.modals.manageLinks.status.active', 'Activo'), color: '#22C55E', bgColor: 'rgba(34, 197, 94, 0.1)', icon: CheckCircle }
    case 'paused':
      return { label: t('users.modals.manageLinks.status.paused', 'Pausado'), color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)', icon: Pause }
    case 'expired':
      return { label: t('users.modals.manageLinks.status.expired', 'Expirado'), color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.1)', icon: Clock }
    case 'exhausted':
      return { label: t('users.modals.manageLinks.status.exhausted', 'Agotado'), color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.1)', icon: XCircle }
    default:
      return { label: status, color: fallback.color, bgColor: fallback.bgColor, icon: AlertCircle }
  }
}

export function getInviteRoleLabels(t: TFunction<'business'>) {
  return {
    admin: t('users.roles.admin', 'Administrador'),
    member: t('users.roles.member', 'Miembro'),
    owner: t('users.roles.owner', 'Propietario'),
  }
}
