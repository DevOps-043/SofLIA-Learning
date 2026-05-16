'use client'

import { colors } from '../shared'
import type { CompanyData } from '@/features/admin/hooks/useEditCompanyLogic'

export function UsersStatsCards({ company }: { company: CompanyData }) {
  const stats = [
    { label: 'Total usuarios', value: company.total_users, color: 'text-gray-900 dark:text-white' },
    { label: 'Activos', value: company.active_users, color: '' },
    { label: 'Invitados', value: company.invited_users, color: '' },
    { label: 'Máximo permitido', value: company.max_users || '∞', color: '' },
  ]
  const styleColors = ['', colors.success, colors.warning, colors.accent]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((stat, index) => (
        <div key={stat.label} className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-white/5 dark:bg-[#0F1419]">
          <p className={`text-2xl font-bold ${stat.color || ''}`} style={styleColors[index] ? { color: styleColors[index] } : undefined}>
            {stat.value}
          </p>
          <p className="text-xs" style={{ color: colors.grayMedium }}>{stat.label}</p>
        </div>
      ))}
    </div>
  )
}
