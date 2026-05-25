'use client'

import { useTranslation } from 'react-i18next'
import type { ReportProblemMetadata } from '@/core/reporting/report-problem.contract'
import type { AdminReporte } from '../../../services/adminReportes.service'
import { ViewReporteEvidence } from './ViewReporteEvidence'
import { ViewReporteOperationalContext } from './ViewReporteOperationalContext'
import { ViewReporteTechnicalContext } from './ViewReporteTechnicalContext'
import { ViewReporteTextSection } from './ViewReporteTextSection'

interface ViewReporteContentProps {
  reporte: AdminReporte
  metadata: Partial<ReportProblemMetadata> | null
}

export function ViewReporteContent({ reporte, metadata }: ViewReporteContentProps) {
  const { t } = useTranslation('admin')

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <ViewReporteTextSection title={t('reportesPage.viewModal.description')}><p className="whitespace-pre-wrap">{reporte.descripcion}</p></ViewReporteTextSection>
      {reporte.pasos_reproducir ? <ViewReporteTextSection title={t('reportesPage.viewModal.steps')}><p className="whitespace-pre-wrap">{reporte.pasos_reproducir}</p></ViewReporteTextSection> : null}
      {reporte.comportamiento_esperado ? <ViewReporteTextSection title={t('reportesPage.viewModal.expected')}><p className="whitespace-pre-wrap">{reporte.comportamiento_esperado}</p></ViewReporteTextSection> : null}
      <ViewReporteTechnicalContext reporte={reporte} />
      <ViewReporteOperationalContext metadata={metadata} />
      <ViewReporteEvidence screenshotUrl={reporte.screenshot_url} />
      {reporte.notas_admin ? <ViewReporteTextSection title={t('reportesPage.viewModal.adminNotes')}><p className="whitespace-pre-wrap">{reporte.notas_admin}</p></ViewReporteTextSection> : null}
    </div>
  )
}
