'use client'

import { useState } from 'react'
import { useAdminReportes } from '../hooks/useAdminReportes'
import type { AdminReporte, ReporteUpdateData } from '../services/adminReportes.service'
import { AdminReportesFilters } from './admin-reportes/AdminReportesFilters'
import { AdminReportesHeader } from './admin-reportes/AdminReportesHeader'
import { AdminReportesList } from './admin-reportes/AdminReportesList'
import { AdminReportesModals } from './admin-reportes/AdminReportesModals'
import { AdminReportesPageState } from './admin-reportes/AdminReportesPageState'
import { AdminReportesStatsGrid } from './admin-reportes/AdminReportesStatsGrid'
import { useAdminReportesFilters } from './admin-reportes/useAdminReportesFilters'

export function AdminReportesPage() {
  const { reportes, stats, isLoading, error, refetch, updateReporte, applyFilters } = useAdminReportes()
  const filters = useAdminReportesFilters(applyFilters)
  const [selectedReporte, setSelectedReporte] = useState<AdminReporte | null>(null)
  const [activeModal, setActiveModal] = useState<'view' | 'edit' | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const closeModal = () => {
    setActiveModal(null)
    setSelectedReporte(null)
  }

  const openModal = (reporte: AdminReporte, modal: 'view' | 'edit') => {
    setSelectedReporte(reporte)
    setActiveModal(modal)
  }

  const handleUpdateReporte = async (reporteId: string, updates: ReporteUpdateData) => {
    setProcessingId(reporteId)
    try {
      await updateReporte(reporteId, updates)
      closeModal()
    } finally {
      setProcessingId(null)
    }
  }

  if (isLoading) return <AdminReportesPageState type="loading" />
  if (error) return <AdminReportesPageState type="error" message={error} onRetry={refetch} />

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <AdminReportesHeader />
        <AdminReportesStatsGrid stats={stats} />
        <AdminReportesFilters
          searchTerm={filters.searchTerm}
          estado={filters.estado}
          categoria={filters.categoria}
          prioridad={filters.prioridad}
          onSearchChange={filters.setSearchTerm}
          onEstadoChange={filters.setEstado}
          onCategoriaChange={filters.setCategoria}
          onPrioridadChange={filters.setPrioridad}
          onApply={filters.apply}
          onReset={filters.reset}
        />
        <AdminReportesList reportes={reportes} onView={(reporte) => openModal(reporte, 'view')} onEdit={(reporte) => openModal(reporte, 'edit')} />
      </div>

      <AdminReportesModals
        selectedReporte={selectedReporte}
        isViewModalOpen={activeModal === 'view'}
        isEditModalOpen={activeModal === 'edit'}
        isProcessing={processingId === selectedReporte?.id}
        onClose={closeModal}
        onOpenEdit={() => setActiveModal('edit')}
        onSave={handleUpdateReporte}
      />
    </div>
  )
}
