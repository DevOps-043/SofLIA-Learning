'use client'

import { useTranslation } from 'react-i18next'
import type { ReporteStats } from '../../services/adminReportes.service'
import { REPORTE_STATS } from './admin-reportes.options'
import { AdminReportesStatCard } from './AdminReportesStatCard'

interface AdminReportesStatsGridProps {
  stats: ReporteStats
}

export function AdminReportesStatsGrid({ stats }: AdminReportesStatsGridProps) {
  const { t } = useTranslation('admin')

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {REPORTE_STATS.map((item) => (
        <AdminReportesStatCard
          key={item.key}
          label={t(item.labelKey)}
          value={stats[item.key]}
          icon={item.icon}
          tone={item.tone}
        />
      ))}
    </div>
  )
}
