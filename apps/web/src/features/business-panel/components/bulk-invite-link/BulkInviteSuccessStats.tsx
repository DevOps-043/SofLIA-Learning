'use client'

import { Calendar, Shield, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { CreatedLink, RoleLabels } from './types'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

interface BulkInviteSuccessStatsProps {
  createdLink: CreatedLink
  roleLabels: RoleLabels
}

export function BulkInviteSuccessStats({ createdLink, roleLabels }: BulkInviteSuccessStatsProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const role = roleLabels[createdLink.role as keyof RoleLabels]?.label || createdLink.role
  const expiresAt = new Date(createdLink.expires_at).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  })

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard icon={<Users className="w-5 h-5" />} value={createdLink.max_uses} label={t('users.modals.bulkInvite.success.maxUsers', 'Max. usuarios')} />
      <StatCard icon={<Shield className="w-5 h-5" />} value={role} label={t('users.modals.bulkInvite.success.role', 'Rol')} />
      <StatCard icon={<Calendar className="w-5 h-5" />} value={expiresAt} label={t('users.modals.bulkInvite.success.expires', 'Expira')} />
    </div>
  )
}

function StatCard({ icon, value, label }: { icon: ReactNode; value: ReactNode; label: string }) {
  const theme = useBusinessPanelTheme()

  return (
    <div className="p-3 rounded-xl text-center" style={{ backgroundColor: theme.inputBg }}>
      <div className="w-5 h-5 mx-auto mb-1" style={{ color: theme.accentColor }}>{icon}</div>
      <p className="text-lg font-bold capitalize" style={{ color: theme.textColor }}>{value}</p>
      <p className="text-xs" style={{ color: theme.mutedTextColor }}>{label}</p>
    </div>
  )
}
