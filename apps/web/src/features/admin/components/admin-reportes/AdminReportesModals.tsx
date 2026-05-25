'use client'

import dynamic from 'next/dynamic'
import type { AdminReporte, ReporteUpdateData } from '../../services/adminReportes.service'

const ViewReporteModal = dynamic(() => import('../ViewReporteModal').then((mod) => ({ default: mod.ViewReporteModal })), { ssr: false })
const EditReporteModal = dynamic(() => import('../EditReporteModal').then((mod) => ({ default: mod.EditReporteModal })), { ssr: false })

interface AdminReportesModalsProps {
  selectedReporte: AdminReporte | null
  isViewModalOpen: boolean
  isEditModalOpen: boolean
  isProcessing: boolean
  onClose: () => void
  onOpenEdit: () => void
  onSave: (reporteId: string, updates: ReporteUpdateData) => Promise<void>
}

export function AdminReportesModals({
  selectedReporte,
  isViewModalOpen,
  isEditModalOpen,
  isProcessing,
  onClose,
  onOpenEdit,
  onSave,
}: AdminReportesModalsProps) {
  if (!selectedReporte) return null

  return (
    <>
      {isViewModalOpen ? (
        <ViewReporteModal reporte={selectedReporte} isOpen={isViewModalOpen} onClose={onClose} onEdit={onOpenEdit} />
      ) : null}
      {isEditModalOpen ? (
        <EditReporteModal reporte={selectedReporte} isOpen={isEditModalOpen} onClose={onClose} onSave={onSave} isProcessing={isProcessing} />
      ) : null}
    </>
  )
}
