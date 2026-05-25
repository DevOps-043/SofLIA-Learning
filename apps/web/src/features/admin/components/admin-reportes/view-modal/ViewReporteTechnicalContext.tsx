'use client'

import { useTranslation } from 'react-i18next'
import type { AdminReporte } from '../../../services/adminReportes.service'
import { getUrlPath } from '../admin-reportes.helpers'
import { ReporteInfoCard } from '../ReporteInfoCard'

interface ViewReporteTechnicalContextProps {
  reporte: AdminReporte
}

export function ViewReporteTechnicalContext({ reporte }: ViewReporteTechnicalContextProps) {
  const { t } = useTranslation('admin')

  return (
    <section className="grid gap-3 md:grid-cols-3">
      {reporte.pagina_url ? (
        <ReporteInfoCard label={t('reportesPage.viewModal.url')}>
          <a href={reporte.pagina_url} target="_blank" rel="noopener noreferrer" className="break-all text-emerald-600 dark:text-emerald-300">{getUrlPath(reporte.pagina_url)}</a>
        </ReporteInfoCard>
      ) : null}
      {reporte.navegador ? <ReporteInfoCard label={t('reportesPage.viewModal.browser')}>{reporte.navegador}</ReporteInfoCard> : null}
      {reporte.screen_resolution ? <ReporteInfoCard label={t('reportesPage.viewModal.resolution')}>{reporte.screen_resolution}</ReporteInfoCard> : null}
    </section>
  )
}
