'use client'

import type { AdminReporte, ReporteUpdateData } from '../services/adminReportes.service'
import { ReporteModalShell } from './admin-reportes/ReporteModalShell'
import { EditReporteFooter } from './admin-reportes/edit-modal/EditReporteFooter'
import { EditReporteForm } from './admin-reportes/edit-modal/EditReporteForm'
import { EditReporteHeader } from './admin-reportes/edit-modal/EditReporteHeader'
import { EditReporteSummary } from './admin-reportes/edit-modal/EditReporteSummary'
import { useEditReporteForm } from './admin-reportes/edit-modal/useEditReporteForm'

interface EditReporteModalProps {
  reporte: AdminReporte
  isOpen: boolean
  onClose: () => void
  onSave: (reporteId: string, updates: ReporteUpdateData) => Promise<void>
  isProcessing: boolean
}

export function EditReporteModal({ reporte, isOpen, onClose, onSave, isProcessing }: EditReporteModalProps) {
  const form = useEditReporteForm(reporte)
  const handleSave = () => onSave(reporte.id, form.getUpdates())

  return (
    <ReporteModalShell isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <EditReporteHeader onClose={onClose} />
      <div className="space-y-6 p-6">
        <EditReporteForm
          estado={form.estado}
          prioridad={form.prioridad}
          notasAdmin={form.notasAdmin}
          onEstadoChange={form.setEstado}
          onPrioridadChange={form.setPrioridad}
          onNotasChange={form.setNotasAdmin}
        />
        <EditReporteSummary reporte={reporte} />
      </div>
      <EditReporteFooter isProcessing={isProcessing} onClose={onClose} onSave={handleSave} />
    </ReporteModalShell>
  )
}
