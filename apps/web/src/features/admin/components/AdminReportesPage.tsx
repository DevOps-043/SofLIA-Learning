'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  ComputerDesktopIcon,
  PhotoIcon,
  LinkIcon
} from '@heroicons/react/24/outline'
import { useAdminReportes } from '../hooks/useAdminReportes'
import { AdminReporte } from '../services/adminReportes.service'

// Lazy loading de modales
const ViewReporteModal = dynamic(() => import('./ViewReporteModal').then(mod => ({ default: mod.ViewReporteModal })), {
  ssr: false
})

const EditReporteModal = dynamic(() => import('./EditReporteModal').then(mod => ({ default: mod.EditReporteModal })), {
  ssr: false
})

export function AdminReportesPage() {
  const { 
    reportes, 
    stats, 
    isLoading, 
    error, 
    refetch, 
    updateReporte,
    applyFilters
  } = useAdminReportes()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEstado, setSelectedEstado] = useState('all')
  const [selectedCategoria, setSelectedCategoria] = useState('all')
  const [selectedPrioridad, setSelectedPrioridad] = useState('all')
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  
  // Estados para dropdowns
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [isPriorityOpen, setIsPriorityOpen] = useState(false)


  // Estados para modales
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedReporte, setSelectedReporte] = useState<AdminReporte | null>(null)

  // Aplicar filtros
  const handleApplyFilters = () => {
    applyFilters({
      estado: selectedEstado !== 'all' ? selectedEstado : undefined,
      categoria: selectedCategoria !== 'all' ? selectedCategoria : undefined,
      prioridad: selectedPrioridad !== 'all' ? selectedPrioridad : undefined,
      search: searchTerm || undefined
    })
  }

  // Resetear filtros
  const handleResetFilters = () => {
    setSearchTerm('')
    setSelectedEstado('all')
    setSelectedCategoria('all')
    setSelectedPrioridad('all')
    applyFilters({})
  }

  const handleViewReporte = (reporte: AdminReporte) => {
    setSelectedReporte(reporte)
    setIsViewModalOpen(true)
  }

  const handleEditReporte = (reporte: AdminReporte) => {
    setSelectedReporte(reporte)
    setIsEditModalOpen(true)
  }

  const handleUpdateReporte = async (
    reporteId: string,
    updates: {
      estado?: AdminReporte['estado']
      admin_asignado?: string
      notas_admin?: string
      prioridad?: AdminReporte['prioridad']
    }
  ) => {
    try {
      setIsProcessing(reporteId)
      await updateReporte(reporteId, updates)
      setIsEditModalOpen(false)
      setSelectedReporte(null)
    } catch (error) {
      throw error
    } finally {
      setIsProcessing(null)
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100/50 text-yellow-800 dark:bg-[#F59E0B]/20 dark:text-[#F59E0B] border border-yellow-200 dark:border-[#F59E0B]/30'
      case 'en_revision':
        return 'bg-blue-100/50 text-blue-800 dark:bg-[#00D4B3]/20 dark:text-[#00D4B3] border border-blue-200 dark:border-[#00D4B3]/30'
      case 'en_progreso':
        return 'bg-purple-100/50 text-purple-800 dark:bg-[#0A2540]/60 dark:text-blue-200 border border-purple-200 dark:border-blue-800'
      case 'resuelto':
        return 'bg-green-100/50 text-green-800 dark:bg-[#10B981]/20 dark:text-[#10B981] border border-green-200 dark:border-[#10B981]/30'
      case 'rechazado':
      case 'duplicado':
        return 'bg-red-100/50 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-900/50'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
    }
  }

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'critica':
        return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800/50'
      case 'alta':
        return 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800/50'
      case 'media':
        return 'bg-yellow-50 text-yellow-700 dark:bg-[#F59E0B]/10 dark:text-[#F59E0B] border-yellow-200 dark:border-[#F59E0B]/20'
      case 'baja':
        return 'bg-green-50 text-green-700 dark:bg-[#10B981]/10 dark:text-[#10B981] border-green-200 dark:border-[#10B981]/20'
      default:
        return 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700'
    }
  }

  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      'bug': 'Bug',
      'sugerencia': 'Sugerencia',
      'contenido': 'Contenido',
      'performance': 'Performance',
      'ui-ux': 'UI/UX',
      'otro': 'Otro'
    }
    return labels[categoria] || categoria
  }

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      'pendiente': 'Pendiente',
      'en_revision': 'En Revisión',
      'en_progreso': 'En Progreso',
      'resuelto': 'Resuelto',
      'rechazado': 'Rechazado',
      'duplicado': 'Duplicado'
    }
    return labels[estado] || estado
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F1419] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A2540] dark:border-[#00D4B3] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando reportes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F1419] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Error al cargar reportes: {error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-[#0A2540] hover:bg-[#0d2f4d] text-white rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-white dark:bg-[#0F1419] transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] dark:text-white mb-1">
                Gestión de Reportes
              </h1>
              <p className="text-sm text-[#6C757D] dark:text-white/70">
                Administra los reportes de problemas de los usuarios
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <motion.div 
            whileHover={{ y: -2, scale: 1.02 }}
            className="bg-gradient-to-br from-[#0A2540] to-[#0A2540]/80 dark:from-[#1E2329] dark:to-[#0A2540]/30 rounded-xl p-4 border border-[#0A2540]/10 dark:border-[#6C757D]/30 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/70 dark:text-white/60 mb-1">Total</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-white/10 dark:bg-[#00D4B3]/10 flex items-center justify-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -2, scale: 1.02 }}
            className="bg-gradient-to-br from-[#F59E0B] to-[#F59E0B]/80 dark:from-[#1E2329] dark:to-[#F59E0B]/20 rounded-xl p-4 border border-[#F59E0B]/10 dark:border-[#6C757D]/30 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/70 dark:text-white/60 mb-1">Pendientes</p>
                <p className="text-2xl font-bold text-white">{stats.pendientes}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-white/10 dark:bg-[#F59E0B]/10 flex items-center justify-center">
                <ClockIcon className="h-5 w-5 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -2, scale: 1.02 }}
            className="bg-gradient-to-br from-[#00D4B3] to-[#00D4B3]/80 dark:from-[#1E2329] dark:to-[#00D4B3]/20 rounded-xl p-4 border border-[#00D4B3]/10 dark:border-[#6C757D]/30 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/70 dark:text-white/60 mb-1">En Progreso</p>
                <p className="text-2xl font-bold text-white">{stats.en_progreso}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-white/10 dark:bg-[#00D4B3]/10 flex items-center justify-center">
                <PencilIcon className="h-5 w-5 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -2, scale: 1.02 }}
            className="bg-gradient-to-br from-[#10B981] to-[#10B981]/80 dark:from-[#1E2329] dark:to-[#10B981]/20 rounded-xl p-4 border border-[#10B981]/10 dark:border-[#6C757D]/30 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/70 dark:text-white/60 mb-1">Resueltos</p>
                <p className="text-2xl font-bold text-white">{stats.resueltos}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-white/10 dark:bg-[#10B981]/10 flex items-center justify-center">
                <CheckCircleIcon className="h-5 w-5 text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-white dark:bg-[#1E2329] rounded-2xl p-6 border border-[#E9ECEF] dark:border-[#334155] mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6C757D]" />
                <input
                  type="text"
                  placeholder="Buscar por título o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E9ECEF] dark:border-[#334155] bg-white dark:bg-[#0F1419] text-[#0A2540] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00D4B3] transition-all"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-3">
              {/* Filtro Estado */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsStatusOpen(!isStatusOpen)
                    setIsCategoryOpen(false)
                    setIsPriorityOpen(false)
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl bg-white dark:bg-[#0A0D12] text-[#0A2540] dark:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#1E2329] transition-colors duration-200 min-w-[180px] justify-between"
                >
                  <span className="text-sm font-medium">
                    {selectedEstado === 'all' ? 'Todos los estados' : getEstadoLabel(selectedEstado)}
                  </span>
                  <FunnelIcon className="h-4 w-4 text-[#6C757D] dark:text-white/60" />
                </button>
                
                <AnimatePresence>
                  {isStatusOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute left-0 mt-2 w-56 bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                      {[
                        { value: 'all', label: 'Todos los estados' },
                        { value: 'pendiente', label: 'Pendiente' },
                        { value: 'en_revision', label: 'En Revisión' },
                        { value: 'en_progreso', label: 'En Progreso' },
                        { value: 'resuelto', label: 'Resuelto' },
                        { value: 'rechazado', label: 'Rechazado' },
                        { value: 'duplicado', label: 'Duplicado' }
                      ].map((item) => (
                        <button
                          key={item.value}
                          onClick={() => {
                            setSelectedEstado(item.value)
                            setIsStatusOpen(false)
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-200 flex items-center justify-between ${
                            selectedEstado === item.value
                              ? 'bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 text-[#00D4B3] font-medium'
                              : 'text-[#0A2540] dark:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/30'
                          }`}
                        >
                          {item.label}
                          {selectedEstado === item.value && (
                            <CheckCircleIcon className="h-4 w-4" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Filtro Categoría */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsCategoryOpen(!isCategoryOpen)
                    setIsStatusOpen(false)
                    setIsPriorityOpen(false)
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl bg-white dark:bg-[#0A0D12] text-[#0A2540] dark:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#1E2329] transition-colors duration-200 min-w-[180px] justify-between"
                >
                  <span className="text-sm font-medium">
                    {selectedCategoria === 'all' ? 'Todas las categorías' : getCategoriaLabel(selectedCategoria)}
                  </span>
                  <FunnelIcon className="h-4 w-4 text-[#6C757D] dark:text-white/60" />
                </button>
                
                <AnimatePresence>
                  {isCategoryOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute left-0 mt-2 w-56 bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                      {[
                        { value: 'all', label: 'Todas las categorías' },
                        { value: 'bug', label: 'Bug' },
                        { value: 'sugerencia', label: 'Sugerencia' },
                        { value: 'contenido', label: 'Contenido' },
                        { value: 'performance', label: 'Performance' },
                        { value: 'ui-ux', label: 'UI/UX' },
                        { value: 'otro', label: 'Otro' }
                      ].map((item) => (
                        <button
                          key={item.value}
                          onClick={() => {
                            setSelectedCategoria(item.value)
                            setIsCategoryOpen(false)
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-200 flex items-center justify-between ${
                            selectedCategoria === item.value
                              ? 'bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 text-[#00D4B3] font-medium'
                              : 'text-[#0A2540] dark:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/30'
                          }`}
                        >
                          {item.label}
                          {selectedCategoria === item.value && (
                            <CheckCircleIcon className="h-4 w-4" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Filtro Prioridad */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsPriorityOpen(!isPriorityOpen)
                    setIsStatusOpen(false)
                    setIsCategoryOpen(false)
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl bg-white dark:bg-[#0A0D12] text-[#0A2540] dark:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#1E2329] transition-colors duration-200 min-w-[180px] justify-between"
                >
                  <span className="text-sm font-medium">
                    {selectedPrioridad === 'all' ? 'Todas las prioridades' : selectedPrioridad.charAt(0).toUpperCase() + selectedPrioridad.slice(1)}
                  </span>
                  <FunnelIcon className="h-4 w-4 text-[#6C757D] dark:text-white/60" />
                </button>
                
                <AnimatePresence>
                  {isPriorityOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute left-0 mt-2 w-56 bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                      {[
                        { value: 'all', label: 'Todas las prioridades' },
                        { value: 'critica', label: 'Crítica' },
                        { value: 'alta', label: 'Alta' },
                        { value: 'media', label: 'Media' },
                        { value: 'baja', label: 'Baja' }
                      ].map((item) => (
                        <button
                          key={item.value}
                          onClick={() => {
                            setSelectedPrioridad(item.value)
                            setIsPriorityOpen(false)
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-200 flex items-center justify-between ${
                            selectedPrioridad === item.value
                              ? 'bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 text-[#00D4B3] font-medium'
                              : 'text-[#0A2540] dark:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/30'
                          }`}
                        >
                          {item.label}
                          {selectedPrioridad === item.value && (
                            <CheckCircleIcon className="h-4 w-4" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-2">
                <button
                  onClick={handleApplyFilters}
                  className="px-6 py-2.5 bg-[#0A2540] hover:bg-[#0d2f4d] text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <FunnelIcon className="h-5 w-5" />
                  Filtrar
                </button>
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-2.5 border border-[#E9ECEF] dark:border-[#6C757D]/30 text-[#6C757D] dark:text-white/60 hover:bg-[#E9ECEF] dark:hover:bg-[#1E2329] hover:text-[#0A2540] dark:hover:text-white font-medium rounded-xl transition-all"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Reportes */}
        <div className="bg-white dark:bg-[#1E2329] rounded-2xl border border-[#E9ECEF] dark:border-[#334155] overflow-hidden shadow-sm">
          {reportes.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-[#F8FAFC] dark:bg-[#0F1419] rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-[#6C757D]" />
              </div>
              <h3 className="text-lg font-medium text-[#0A2540] dark:text-white mb-2">No se encontraron reportes</h3>
              <p className="text-[#6C757D] dark:text-gray-400">Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E9ECEF] dark:divide-[#334155]">
              {reportes.map((reporte) => (
                <div
                  key={reporte.id}
                  className="p-6 hover:bg-[#F8FAFC] dark:hover:bg-[#0F1419]/50 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-bold text-[#0A2540] dark:text-white group-hover:text-[#00D4B3] transition-colors">
                          {reporte.titulo}
                        </h3>
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getPrioridadColor(reporte.prioridad)}`}>
                          {reporte.prioridad.toUpperCase()}
                        </span>
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getEstadoColor(reporte.estado)}`}>
                          {getEstadoLabel(reporte.estado)}
                        </span>
                      </div>
                      
                      <p className="text-[#6C757D] dark:text-gray-400 mb-4 line-clamp-2 text-sm leading-relaxed">
                        {reporte.descripcion}
                      </p>

                      <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-[#6C757D] dark:text-gray-500">
                        <span className="flex items-center gap-1.5 bg-[#F8FAFC] dark:bg-[#0F1419] px-2 py-1 rounded-md border border-[#E9ECEF] dark:border-[#334155]">
                          <span className="text-[#0A2540] dark:text-gray-300">Categoría:</span>
                          {getCategoriaLabel(reporte.categoria)}
                        </span>
                        {reporte.usuario && (
                          <span className="flex items-center gap-1.5">
                            <UserIcon className="h-4 w-4" />
                            {reporte.usuario.display_name || reporte.usuario.username}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <ClockIcon className="h-4 w-4" />
                          {new Date(reporte.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {reporte.screenshot_url && (
                          <span className="flex items-center gap-1.5 text-[#00D4B3]">
                            <PhotoIcon className="h-4 w-4" />
                            Con imagen
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-6">
                      <button
                        onClick={() => handleViewReporte(reporte)}
                        className="p-2.5 text-[#6C757D] dark:text-gray-400 hover:text-[#00D4B3] dark:hover:text-[#00D4B3] hover:bg-[#F8FAFC] dark:hover:bg-[#0F1419] rounded-xl border border-transparent hover:border-[#00D4B3]/30 transition-all"
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEditReporte(reporte)}
                        className="p-2.5 text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-blue-400 hover:bg-[#F8FAFC] dark:hover:bg-[#0F1419] rounded-xl border border-transparent hover:border-[#0A2540]/30 transition-all"
                        title="Editar"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {isViewModalOpen && selectedReporte && (
        <ViewReporteModal
          reporte={selectedReporte}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false)
            setSelectedReporte(null)
          }}
          onEdit={() => {
            setIsViewModalOpen(false)
            setIsEditModalOpen(true)
          }}
        />
      )}

      {isEditModalOpen && selectedReporte && (
        <EditReporteModal
          reporte={selectedReporte}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedReporte(null)
          }}
          onSave={handleUpdateReporte}
          isProcessing={isProcessing === selectedReporte.id}
        />
      )}
    </div>
  )
}

