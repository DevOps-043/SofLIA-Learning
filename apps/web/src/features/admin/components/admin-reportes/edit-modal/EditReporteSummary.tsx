'use client'

import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../../hooks/useAdminPanelTheme'
import type { AdminReporte } from '../../../services/adminReportes.service'
import { getReporteLabel, getReporterName } from '../admin-reportes.helpers'

interface EditReporteSummaryProps {
  reporte: AdminReporte
}

export function EditReporteSummary({ reporte }: EditReporteSummaryProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  return (
    <section className="rounded-2xl border p-4" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: theme.mutedTextColor }}>{t('reportesPage.editModal.summary')}</h3>
      <div className="space-y-2 text-sm" style={{ color: theme.subtextColor }}>
        <p><span className="font-semibold" style={{ color: theme.textColor }}>{t('reportesPage.table.title')}:</span> {reporte.titulo}</p>
        <p><span className="font-semibold" style={{ color: theme.textColor }}>{t('reportesPage.viewModal.category')}:</span> {getReporteLabel(t, 'category', reporte.categoria)}</p>
        {reporte.usuario ? <p><span className="font-semibold" style={{ color: theme.textColor }}>{t('reportesPage.table.user')}:</span> {getReporterName(reporte)}</p> : null}
      </div>
    </section>
  )
}
