'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline'
import { AdminWorkshop } from '../services/adminWorkshops.service'

interface DeleteWorkshopModalProps {
  isOpen: boolean
  onClose: () => void
  workshop: AdminWorkshop | null
  onConfirm: () => Promise<void>
}

export function DeleteWorkshopModal({ isOpen, onClose, workshop, onConfirm }: DeleteWorkshopModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
    } catch (error) {
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen || !workshop) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative bg-white dark:bg-[#1E2329] rounded-2xl shadow-2xl max-w-md w-full border border-[#E9ECEF] dark:border-[#6C757D]/30 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-[#EF4444] to-[#EF4444]/80 dark:from-[#EF4444] dark:to-[#EF4444]/60 px-6 py-4 border-b border-[#EF4444]/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          Eliminar Taller
                        </h3>
                        <p className="text-xs text-white/70">
                          Esta acción no se puede deshacer
                        </p>
                      </div>
                    </div>
                    <motion.button
                      onClick={onClose}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 p-3 bg-[#EF4444]/10 dark:bg-[#EF4444]/20 rounded-xl">
                      <ExclamationTriangleIcon className="h-8 w-8 text-[#EF4444]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[#0A2540] dark:text-white mb-2">
                        ¿Estás seguro de que quieres eliminar este taller?
                      </h3>
                      <p className="text-sm text-[#6C757D] dark:text-white/60">
                        Esta acción no se puede deshacer. Se eliminará permanentemente:
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-xl p-4 mb-4 border border-[#E9ECEF] dark:border-[#6C757D]/30">
                    <h4 className="font-semibold text-[#0A2540] dark:text-white mb-3">{workshop.title}</h4>
                    <div className="text-sm text-[#6C757D] dark:text-white/60 space-y-2">
                      <p>Categoría: <span className="text-[#0A2540] dark:text-white font-medium">{workshop.category}</span></p>
                      <p>Nivel: <span className="text-[#0A2540] dark:text-white font-medium">{workshop.level}</span></p>
                      <p>Estado: <span className="text-[#0A2540] dark:text-white font-medium capitalize">{workshop.is_active ? 'Activo' : 'Inactivo'}</span></p>
                      <p>Instructor: <span className="text-[#0A2540] dark:text-white font-medium">{workshop.instructor_name || 'Sin instructor'}</span></p>
                      {(workshop.student_count && workshop.student_count > 0) && (
                        <p>Estudiantes inscritos: <span className="text-[#0A2540] dark:text-white font-medium">{workshop.student_count}</span></p>
                      )}
                      <p>Duración: <span className="text-[#0A2540] dark:text-white font-medium">{workshop.duration_total_minutes} minutos</span></p>
                    </div>
                  </div>

                  {workshop.student_count && workshop.student_count > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#F59E0B]/10 dark:bg-[#F59E0B]/20 border border-[#F59E0B]/20 dark:border-[#F59E0B]/30 rounded-xl p-4 mb-4"
                    >
                      <p className="text-sm text-[#F59E0B] dark:text-[#F59E0B]">
                        ⚠️ Este taller tiene {workshop.student_count} estudiante{workshop.student_count > 1 ? 's' : ''} inscrito{workshop.student_count > 1 ? 's' : ''}. 
                        Las inscripciones también se eliminarán.
                      </p>
                    </motion.div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E9ECEF] dark:border-[#6C757D]/30">
                    <motion.button
                      onClick={onClose}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isDeleting}
                      className="px-6 py-2.5 text-[#6C757D] dark:text-white/70 bg-white dark:bg-[#1E2329] hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/30 rounded-xl text-sm font-medium transition-colors duration-200 border border-[#E9ECEF] dark:border-[#6C757D]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </motion.button>
                    <motion.button
                      onClick={handleConfirm}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isDeleting}
                      className="px-6 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors duration-200 shadow-lg shadow-[#EF4444]/20 flex items-center gap-2"
                    >
                      {isDeleting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Eliminando...</span>
                        </>
                      ) : (
                        <>
                          <TrashIcon className="h-4 w-4" />
                          <span>Eliminar Taller</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
