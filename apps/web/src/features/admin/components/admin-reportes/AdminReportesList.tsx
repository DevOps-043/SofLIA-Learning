'use client'

import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminReporte } from '../../services/adminReportes.service'
import { AdminReporteRow } from './AdminReporteRow'
import { AdminReportesEmptyState } from './AdminReportesEmptyState'

interface AdminReportesListProps {
  reportes: AdminReporte[]
  onView: (reporte: AdminReporte) => void
  onEdit: (reporte: AdminReporte) => void
}

export function AdminReportesList({ reportes, onView, onEdit }: AdminReportesListProps) {
  const theme = useAdminPanelTheme()

  return (
    <section className="overflow-hidden rounded-[24px] border shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)]" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      {reportes.length === 0 ? <AdminReportesEmptyState /> : (
        <div className="divide-y" style={{ borderColor: theme.dividerColor }}>
          {reportes.map((reporte) => <AdminReporteRow key={reporte.id} reporte={reporte} onView={onView} onEdit={onEdit} />)}
        </div>
      )}
    </section>
  )
}
