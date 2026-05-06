'use client'

import { Fragment, useState, useMemo, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, UserIcon, ComputerDesktopIcon, PhotoIcon, LinkIcon, CalendarIcon, PencilIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { AdminReporte } from '../services/adminReportes.service'
import type { ReportProblemMetadata } from '../../../core/reporting/report-problem.contract'

interface ViewReporteModalProps {
  reporte: AdminReporte
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
}

export function ViewReporteModal({ reporte, isOpen, onClose, onEdit }: ViewReporteModalProps) {
  const [isMounted, setIsMounted] = useState(false)
  const reportMetadata = useMemo<Partial<ReportProblemMetadata> | null>(() => {
    if (!reporte.metadata || typeof reporte.metadata !== 'object') {
      return null
    }

    return reporte.metadata as Partial<ReportProblemMetadata>
  }, [reporte.metadata])

  // Detectar cuando estamos en el cliente
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const getEstadoColor = (estado: string | null | undefined) => {
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

  const getPrioridadColor = (prioridad: string | null | undefined) => {
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

  const getEstadoLabel = (estado: string | null | undefined) => {
    const labels: Record<string, string> = {
      'pendiente': 'Pendiente',
      'en_revision': 'En Revisión',
      'en_progreso': 'En Progreso',
      'resuelto': 'Resuelto',
      'rechazado': 'Rechazado',
      'duplicado': 'Duplicado'
    }
    return estado ? labels[estado] || estado : 'Sin estado'
  }

  const formatReporteDate = (
    dateValue: string | null | undefined,
    options?: Intl.DateTimeFormatOptions
  ) => {
    if (!dateValue) {
      return 'N/D'
    }

    return new Date(dateValue).toLocaleString([], options)
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-[#0F1419]/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#334155] shadow-2xl transition-all flex h-[85vh]">
                
                {/* 👈 LEFT PREVIEW PANEL (320px fixed) */}
                <div className="hidden lg:flex w-80 flex-col border-r border-[#E9ECEF] dark:border-[#334155] bg-gradient-to-br from-[#0A2540]/5 to-[#00D4B3]/5 dark:from-[#0A2540]/30 dark:to-[#00D4B3]/10 relative overflow-y-auto custom-scrollbar">
                  <div className="p-8 flex flex-col h-full">
                    {/* Icono Animado */}
                    <div className="relative mb-8 self-center">
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#0A2540] to-[#00D4B3] shadow-lg shadow-[#00D4B3]/20">
                         <ExclamationTriangleIcon className="h-10 w-10 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#00D4B3] flex items-center justify-center border-2 border-[#1E2329]">
                         <span className="text-xs font-bold text-[#0A2540]">!</span>
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="space-y-6 flex-1">
                      <div>
                        <h4 className="text-xs font-bold text-[#6C757D] dark:text-gray-400 uppercase tracking-wider mb-2">Estado</h4>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getEstadoColor(reporte.estado)} bg-opacity-10 w-full justify-center`}>
                           <span className="font-medium text-sm">{getEstadoLabel(reporte.estado)}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-[#6C757D] dark:text-gray-400 uppercase tracking-wider mb-2">Prioridad</h4>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getPrioridadColor(reporte.prioridad)} bg-opacity-10 w-full justify-center`}>
                           <span className="font-medium text-sm">{(reporte.prioridad || 'sin prioridad').toUpperCase()}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-[#6C757D] dark:text-gray-400 uppercase tracking-wider mb-2">Categoría</h4>
                        <div className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0F1419] border border-[#E9ECEF] dark:border-[#334155] text-center">
                           <span className="text-sm text-[#0A2540] dark:text-white font-medium">{getCategoriaLabel(reporte.categoria)}</span>
                        </div>
                      </div>

                      {/* Info Usuario */}
                      {reporte.usuario && (
                        <div className="pt-6 border-t border-[#E9ECEF] dark:border-[#334155]">
                           <h4 className="text-xs font-bold text-[#6C757D] dark:text-gray-400 uppercase tracking-wider mb-3">Reportado por</h4>
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#0A2540] flex items-center justify-center text-white font-bold flex-shrink-0">
                                {reporte.usuario.display_name?.charAt(0) || reporte.usuario.username.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[#0A2540] dark:text-white truncate">
                                  {reporte.usuario.display_name || reporte.usuario.username}
                                </p>
                                <p className="text-xs text-[#6C757D] dark:text-gray-400 truncate">
                                  {reporte.usuario.email}
                                </p>
                              </div>
                           </div>
                        </div>
                      )}
                    </div>

                    {/* Fechas Footer */}
                    <div className="mt-8 pt-6 border-t border-[#E9ECEF] dark:border-[#334155] text-xs text-[#6C757D] dark:text-gray-500 space-y-2">
                       <div className="flex justify-between">
                          <span>Creado:</span>
                          <span className="text-[#0A2540] dark:text-gray-300">{formatReporteDate(reporte.created_at, { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
                       </div>
                       <div className="flex justify-between">
                          <span>Hora:</span>
                          <span className="text-[#0A2540] dark:text-gray-300">{formatReporteDate(reporte.created_at, { hour: '2-digit', minute:'2-digit' })}</span>
                       </div>
                    </div>
                  </div>
                </div>

                {/* 👉 RIGHT FORM/CONTENT PANEL (flex-1) */}
                <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1E2329]">
                  {/* Header */}
                  <div className="px-8 py-5 border-b border-[#E9ECEF] dark:border-[#334155] bg-white dark:bg-[#1E2329] flex items-center justify-between sticky top-0 z-10">
                    <div>
                      <h2 className="text-xl font-bold text-[#0A2540] dark:text-white truncate pr-4">
                        {reporte.titulo}
                      </h2>
                      <p className="text-sm text-[#6C757D] dark:text-gray-400 mt-1 flex items-center gap-2">
                         ID: <span className="font-mono text-xs opacity-70">{reporte.id.slice(0, 8)}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={onClose}
                        className="p-2 text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#334155] rounded-xl transition-all"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                    
                    {/* Descripción */}
                    <section>
                       <h3 className="text-sm font-bold text-[#0A2540] dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                          <span className="w-1 h-4 bg-[#00D4B3] rounded-full"></span>
                          Descripción
                       </h3>
                       <div className="p-5 bg-[#F8FAFC] dark:bg-[#0F1419] rounded-xl border border-[#E9ECEF] dark:border-[#334155]">
                          <p className="text-[#0A2540] dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {reporte.descripcion}
                          </p>
                       </div>
                    </section>

                    {/* Pasos y Comportamiento (Grid) */}
                    {(reporte.pasos_reproducir || reporte.comportamiento_esperado) && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                         {reporte.pasos_reproducir && (
                            <section>
                               <h3 className="text-sm font-bold text-[#0A2540] dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                  <span className="w-1 h-4 bg-[#F59E0B] rounded-full"></span>
                                  Pasos para Reproducir
                               </h3>
                               <div className="p-4 bg-[#F8FAFC] dark:bg-[#0F1419] rounded-xl border border-[#E9ECEF] dark:border-[#334155] h-full">
                                  <p className="text-sm text-[#0A2540] dark:text-gray-300 whitespace-pre-wrap font-mono">
                                    {reporte.pasos_reproducir}
                                  </p>
                               </div>
                            </section>
                         )}
                         {reporte.comportamiento_esperado && (
                            <section>
                               <h3 className="text-sm font-bold text-[#0A2540] dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                  <span className="w-1 h-4 bg-[#10B981] rounded-full"></span>
                                  Comportamiento Esperado
                               </h3>
                               <div className="p-4 bg-[#F8FAFC] dark:bg-[#0F1419] rounded-xl border border-[#E9ECEF] dark:border-[#334155] h-full">
                                  <p className="text-sm text-[#0A2540] dark:text-gray-300 whitespace-pre-wrap">
                                    {reporte.comportamiento_esperado}
                                  </p>
                               </div>
                            </section>
                         )}
                      </div>
                    )}

                    {/* Contexto Técnico Completo */}
                    <section>
                       <h3 className="text-sm font-bold text-[#0A2540] dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                          <span className="w-1 h-4 bg-[#0A2540] dark:bg-gray-500 rounded-full"></span>
                          Contexto Técnico
                       </h3>
                       <div className="bg-[#0F1419] rounded-xl border border-[#334155] overflow-hidden">
                          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#334155]">
                             {reporte.pagina_url && (
                                <div className="p-4">
                                   <div className="text-xs text-[#6C757D] dark:text-gray-500 mb-1">URL</div>
                                   <a href={reporte.pagina_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#00D4B3] hover:underline break-all block">
                                      {(() => {
                                        try {
                                          return new URL(reporte.pagina_url).pathname
                                        } catch {
                                          return reporte.pagina_url
                                        }
                                      })()}
                                   </a>
                                </div>
                             )}
                             {reporte.navegador && (
                                <div className="p-4">
                                   <div className="text-xs text-[#6C757D] dark:text-gray-500 mb-1">Navegador</div>
                                   <div className="text-sm text-white">{reporte.navegador}</div>
                                </div>
                             )}
                             {reporte.screen_resolution && (
                                <div className="p-4">
                                   <div className="text-xs text-[#6C757D] dark:text-gray-500 mb-1">Resolución</div>
                                   <div className="text-sm text-white">{reporte.screen_resolution}</div>
                                </div>
                             )}
                          </div>
                       </div>
                    </section>

                    {reportMetadata?.source || reportMetadata?.courseContext || reportMetadata?.irisSync ? (
                      <section>
                         <h3 className="text-sm font-bold text-[#0A2540] dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-1 h-4 bg-[#00D4B3] rounded-full"></span>
                            Contexto Operativo
                         </h3>
                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {reportMetadata?.source ? (
                              <div className="p-4 rounded-xl border border-[#E9ECEF] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F1419]">
                                 <div className="text-xs text-[#6C757D] dark:text-gray-500 mb-1">Origen</div>
                                 <div className="text-sm font-medium text-[#0A2540] dark:text-white">{reportMetadata.source}</div>
                              </div>
                            ) : null}
                            {reportMetadata?.courseContext ? (
                              <div className="p-4 rounded-xl border border-[#E9ECEF] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F1419]">
                                 <div className="text-xs text-[#6C757D] dark:text-gray-500 mb-1">Curso / LecciÃ³n</div>
                                 <div className="text-sm font-medium text-[#0A2540] dark:text-white">
                                   {reportMetadata.courseContext.courseTitle || 'Curso no identificado'}
                                 </div>
                                 <div className="text-xs text-[#6C757D] dark:text-gray-400 mt-1">
                                   {reportMetadata.courseContext.lessonTitle || 'Lección no identificada'}
                                 </div>
                              </div>
                            ) : null}
                            {reportMetadata?.irisSync ? (
                              <div className="p-4 rounded-xl border border-[#E9ECEF] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F1419]">
                                 <div className="text-xs text-[#6C757D] dark:text-gray-500 mb-1">SincronizaciÃ³n IRIS</div>
                                 <div className="text-sm font-medium text-[#0A2540] dark:text-white">
                                   {reportMetadata.irisSync.status}
                                 </div>
                                 <div className="text-xs text-[#6C757D] dark:text-gray-400 mt-1">
                                   {reportMetadata.irisSync.externalIssueId || 'Sin issue externo enlazado'}
                                 </div>
                              </div>
                            ) : null}
                         </div>
                      </section>
                    ) : null}

                    {/* Evidencia Visual (Screenshot) */}
                    {reporte.screenshot_url && (
                      <section>
                         <h3 className="text-sm font-bold text-[#0A2540] dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                            Evidencia
                         </h3>
                         <div className="rounded-xl border border-[#E9ECEF] dark:border-[#334155] overflow-hidden bg-black/5 dark:bg-black/20 group">
                            <div className="relative">
                               <img
                                 src={reporte.screenshot_url}
                                 alt="Screenshot"
                                 className="w-full max-h-[300px] object-contain mx-auto"
                               />
                               <a
                                 href={reporte.screenshot_url}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium"
                               >
                                  <div className="flex items-center gap-2 bg-[#1E2329] px-4 py-2 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                     <PhotoIcon className="h-5 w-5" />
                                     Ver imagen original
                                  </div>
                               </a>
                            </div>
                         </div>
                      </section>
                    )}
                    
                    {/* Admin Notes */}
                    {reporte.notas_admin && (
                      <section className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-900/20">
                         <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <PencilIcon className="h-4 w-4" />
                            Notas del Administrador
                         </h3>
                         <p className="text-sm text-blue-900 dark:text-blue-200">
                           {reporte.notas_admin}
                         </p>
                      </section>
                    )}

                  </div>

                  {/* Footer Actions */}
                  <div className="px-8 py-5 border-t border-[#E9ECEF] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1E2329] flex justify-end gap-3 rounded-br-2xl sticky bottom-0 z-10">
                     <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-medium text-[#6C757D] dark:text-gray-300 hover:bg-[#E9ECEF] dark:hover:bg-[#334155] transition-colors"
                     >
                        Cerrar
                     </button>
                     <button
                        onClick={onEdit}
                        className="px-6 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-[#0A2540] to-[#0F2E4D] hover:shadow-lg hover:to-[#0A2540] border border-transparent hover:border-[#00D4B3]/50 transition-all flex items-center gap-2"
                     >
                        <PencilIcon className="h-5 w-5" />
                        Gestionar Reporte
                     </button>
                  </div>
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
