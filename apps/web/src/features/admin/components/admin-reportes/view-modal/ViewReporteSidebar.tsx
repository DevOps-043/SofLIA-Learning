'use client'

import { AlertTriangle, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../../hooks/useAdminPanelTheme'
import type { AdminReporte } from '../../../services/adminReportes.service'
import { getEstadoBadgeClass, getPrioridadBadgeClass } from '../admin-reportes.badges'
import { formatReporteDate, getReporteLabel, getReporterName } from '../admin-reportes.helpers'
import { ReporteBadge } from '../ReporteBadge'
import { ReporteInfoCard } from '../ReporteInfoCard'

interface ViewReporteSidebarProps {
  reporte: AdminReporte
}

export function ViewReporteSidebar({ reporte }: ViewReporteSidebarProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  return (
    <aside className="hidden w-80 shrink-0 flex-col gap-5 border-r p-6 lg:flex" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}>
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px]" style={{ background: theme.heroBackground, color: theme.inverseTextColor }}>
        <AlertTriangle className="h-9 w-9" />
      </div>

      <div className="space-y-4">
        <ReporteInfoCard label={t('reportesPage.viewModal.status')}>
          <ReporteBadge className={getEstadoBadgeClass(reporte.estado)}>{getReporteLabel(t, 'status', reporte.estado)}</ReporteBadge>
        </ReporteInfoCard>
        <ReporteInfoCard label={t('reportesPage.viewModal.priority')}>
          <ReporteBadge className={getPrioridadBadgeClass(reporte.prioridad)}>{getReporteLabel(t, 'priority', reporte.prioridad)}</ReporteBadge>
        </ReporteInfoCard>
        <ReporteInfoCard label={t('reportesPage.viewModal.category')}>
          {getReporteLabel(t, 'category', reporte.categoria)}
        </ReporteInfoCard>
      </div>

      {reporte.usuario ? (
        <div className="rounded-2xl border p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: theme.mutedTextColor }}>{t('reportesPage.viewModal.reportedBy')}</p>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: theme.primaryColor, color: theme.onPrimaryColor }}><User className="h-4 w-4" /></span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" style={{ color: theme.textColor }}>{getReporterName(reporte)}</p>
              <p className="truncate text-xs" style={{ color: theme.subtextColor }}>{reporte.usuario.email}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-auto grid grid-cols-2 gap-3 text-xs">
        <ReporteInfoCard label={t('reportesPage.viewModal.createdDate')}>{formatReporteDate(reporte.created_at)}</ReporteInfoCard>
      </div>
    </aside>
  )
}
