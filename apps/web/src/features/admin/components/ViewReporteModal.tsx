'use client'

import { useMemo } from 'react'
import type { ReportProblemMetadata } from '@/core/reporting/report-problem.contract'
import type { AdminReporte } from '../services/adminReportes.service'
import { ReporteModalShell } from './admin-reportes/ReporteModalShell'
import { ViewReporteContent } from './admin-reportes/view-modal/ViewReporteContent'
import { ViewReporteFooter } from './admin-reportes/view-modal/ViewReporteFooter'
import { ViewReporteHeader } from './admin-reportes/view-modal/ViewReporteHeader'
import { ViewReporteSidebar } from './admin-reportes/view-modal/ViewReporteSidebar'

interface ViewReporteModalProps {
  reporte: AdminReporte
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
}

export function ViewReporteModal({ reporte, isOpen, onClose, onEdit }: ViewReporteModalProps) {
  const reportMetadata = useMemo<Partial<ReportProblemMetadata> | null>(() => {
    if (!reporte.metadata || typeof reporte.metadata !== 'object') return null
    return reporte.metadata as Partial<ReportProblemMetadata>
  }, [reporte.metadata])

  return (
    <ReporteModalShell isOpen={isOpen} onClose={onClose} className="flex h-[88vh]">
      <ViewReporteSidebar reporte={reporte} />
      <div className="flex min-w-0 flex-1 flex-col">
        <ViewReporteHeader reporte={reporte} onClose={onClose} />
        <ViewReporteContent reporte={reporte} metadata={reportMetadata} />
        <ViewReporteFooter onClose={onClose} onEdit={onEdit} />
      </div>
    </ReporteModalShell>
  )
}
