'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { AdminReporte } from '../services/adminReportes.service'

interface EditReporteModalProps {
  reporte: AdminReporte
  isOpen: boolean
  onClose: () => void
  onSave: (
    reporteId: string,
    updates: {
      estado?: AdminReporte['estado']
      admin_asignado?: string
      notas_admin?: string
      prioridad?: AdminReporte['prioridad']
    }
  ) => Promise<void>
  isProcessing: boolean
}

export function EditReporteModal({ reporte, isOpen, onClose, onSave, isProcessing }: EditReporteModalProps) {
  const [estado, setEstado] = useState(reporte.estado)
  const [prioridad, setPrioridad] = useState(reporte.prioridad)
  const [notasAdmin, setNotasAdmin] = useState(reporte.notas_admin || '')

  const handleSave = async () => {
    try {
      await onSave(reporte.id, {
        estado,
        prioridad,
        notas_admin: notasAdmin.trim() || undefined
      })
    } catch (error) {
      // El error se maneja en el componente padre
    }
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#334155] shadow-2xl transition-all">
                {/* Header */}
                <div className="bg-[#0A2540] px-6 py-4 flex items-center justify-between border-b border-[#334155]">
                  <Dialog.Title className="text-xl font-bold text-white flex items-center gap-2">
                    <CheckCircleIcon className="h-6 w-6 text-[#00D4B3]" />
                    Editar Reporte
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-8">
                  <div className="space-y-6">
                    {/* Estado */}
                    <div>
                      <label className="block text-sm font-bold text-[#0A2540] dark:text-gray-300 mb-2 uppercase tracking-wider">
                        Estado
                      </label>
                      <select
                        value={estado}
                        onChange={(e) => setEstado(e.target.value as AdminReporte['estado'])}
                        className="w-full px-4 py-3 rounded-xl border border-[#E9ECEF] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F1419] text-[#0A2540] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B3] transition-all"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="en_revision">En Revisión</option>
                        <option value="en_progreso">En Progreso</option>
                        <option value="resuelto">Resuelto</option>
                        <option value="rechazado">Rechazado</option>
                        <option value="duplicado">Duplicado</option>
                      </select>
                    </div>

                    {/* Prioridad */}
                    <div>
                      <label className="block text-sm font-bold text-[#0A2540] dark:text-gray-300 mb-2 uppercase tracking-wider">
                        Prioridad
                      </label>
                      <select
                        value={prioridad}
                        onChange={(e) => setPrioridad(e.target.value as AdminReporte['prioridad'])}
                        className="w-full px-4 py-3 rounded-xl border border-[#E9ECEF] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F1419] text-[#0A2540] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B3] transition-all"
                      >
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                        <option value="critica">Crítica</option>
                      </select>
                    </div>

                    {/* Notas del Admin */}
                    <div>
                      <label className="block text-sm font-bold text-[#0A2540] dark:text-gray-300 mb-2 uppercase tracking-wider">
                        Notas del Administrador
                      </label>
                      <textarea
                        value={notasAdmin}
                        onChange={(e) => setNotasAdmin(e.target.value)}
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl border border-[#E9ECEF] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F1419] text-[#0A2540] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B3] transition-all resize-none placeholder-gray-400"
                        placeholder="Agrega notas internas sobre este reporte..."
                      />
                    </div>

                    {/* Información del reporte (solo lectura) */}
                    <div className="p-5 bg-[#0A2540]/5 dark:bg-[#0A2540]/20 rounded-xl border border-[#0A2540]/10 dark:border-[#0A2540]/40">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#0A2540] dark:text-[#00D4B3] mb-3">
                        Resumen del Reporte
                      </h3>
                      <div className="space-y-2 text-sm text-[#6C757D] dark:text-gray-400">
                        <p><span className="font-semibold text-[#0A2540] dark:text-gray-300">Título:</span> {reporte.titulo}</p>
                        <p><span className="font-semibold text-[#0A2540] dark:text-gray-300">Categoría:</span> {reporte.categoria}</p>
                        {reporte.usuario && (
                          <p>
                            <span className="font-semibold text-[#0A2540] dark:text-gray-300">Usuario:</span>{' '}
                            {reporte.usuario.display_name || reporte.usuario.username}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-[#F8FAFC] dark:bg-[#0F1419] px-6 py-4 flex justify-end gap-3 border-t border-[#E9ECEF] dark:border-[#334155]">
                  <button
                    onClick={onClose}
                    disabled={isProcessing}
                    className="px-5 py-2.5 text-[#0A2540] dark:text-white hover:bg-white dark:hover:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#334155] rounded-xl transition-all font-medium text-sm shadow-sm disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isProcessing}
                    className="px-5 py-2.5 bg-[#0A2540] hover:bg-[#0d2f4d] text-white rounded-xl transition-all font-medium text-sm shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

