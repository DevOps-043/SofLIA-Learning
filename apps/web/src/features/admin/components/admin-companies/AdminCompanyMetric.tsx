'use client'

import type { AdminCompaniesThemeColors } from '../../services/admin-companies'

interface AdminCompanyMetricProps {
  label: string
  value: number | string
  color: string
  themeColors: AdminCompaniesThemeColors
}

export function AdminCompanyMetric({
  label,
  value,
  color,
  themeColors,
}: AdminCompanyMetricProps) {
  return (
    <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: themeColors.inputBg }}>
      <p className="text-lg font-extrabold" style={{ color }}>{value}</p>
      <p className="text-xs font-bold" style={{ color: themeColors.textSecondary }}>{label}</p>
    </div>
  )
}
