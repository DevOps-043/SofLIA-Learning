'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon,
  BookOpenIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  TagIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  CheckCircleIcon as CheckIcon
} from '@heroicons/react/24/outline'
import { AdminWorkshop } from '../services/adminWorkshops.service'

interface EditWorkshopModalProps {
  workshop: AdminWorkshop | null
  onClose: () => void
  onSave: (data: Partial<AdminWorkshop>) => Promise<void>
}

type TabType = 'basic' | 'status'

export function EditWorkshopModal({ workshop, onClose, onSave }: EditWorkshopModalProps) {
  const [formData, setFormData] = useState<Partial<AdminWorkshop>>({
    title: '',
    description: '',
    category: 'ia',
    level: 'beginner',
    duration_total_minutes: 0,
    price: 0,
    is_active: true,
    approval_status: 'pending',
    rejection_reason: ''
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('basic')

  const categories = [
    { value: 'ia', label: 'Inteligencia Artificial' },
    { value: 'tecnologia', label: 'Tecnología' },
    { value: 'negocios', label: 'Negocios' },
    { value: 'diseño', label: 'Diseño' },
    { value: 'marketing', label: 'Marketing' }
  ]

  const levels = [
    { value: 'beginner', label: 'Principiante' },
    { value: 'intermediate', label: 'Intermedio' },
    { value: 'advanced', label: 'Avanzado' }
  ]

  const approvalStatuses = [
    { value: 'pending', label: 'Pendiente', icon: ExclamationTriangleIcon, color: '#F59E0B' },
    { value: 'approved', label: 'Aprobado', icon: CheckCircleIcon, color: '#10B981' },
    { value: 'rejected', label: 'Rechazado', icon: XCircleIcon, color: '#EF4444' }
  ]

  useEffect(() => {
    if (workshop) {
      setFormData({
        title: workshop.title || '',
        description: workshop.description || '',
        category: workshop.category || 'ia',
        level: workshop.level || 'beginner',
        duration_total_minutes: workshop.duration_total_minutes || 0,
        price: workshop.price || 0,
        is_active: workshop.is_active !== undefined ? workshop.is_active : true,
        approval_status: workshop.approval_status || 'pending',
        rejection_reason: workshop.rejection_reason || ''
      })
      setErrors({})
      setActiveTab('basic')
    }
  }, [workshop])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title || formData.title.trim() === '') {
      newErrors.title = 'El título es obligatorio'
    }

    if (!formData.description || formData.description.trim() === '') {
      newErrors.description = 'La descripción es obligatoria'
    }

    if (!formData.duration_total_minutes || formData.duration_total_minutes <= 0) {
      newErrors.duration_total_minutes = 'La duración debe ser mayor a 0'
    }

    if (formData.approval_status === 'rejected' && (!formData.rejection_reason || formData.rejection_reason.trim() === '')) {
      newErrors.rejection_reason = 'La razón de rechazo es obligatoria cuando el estado es "Rechazado"'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const dataToSave = { ...formData }
      if (formData.approval_status !== 'rejected') {
        dataToSave.rejection_reason = ''
      }

      await onSave(dataToSave)
      onClose()
    } catch (error) {
      setSaveError('Error al actualizar el taller')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = <K extends keyof AdminWorkshop>(field: K, value: AdminWorkshop[K]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  if (!workshop) return null

  const tabs: { id: TabType; label: string; icon: typeof BookOpenIcon }[] = [
    { id: 'basic', label: 'Información', icon: BookOpenIcon },
    { id: 'status', label: 'Estado', icon: ShieldCheckIcon }
  ]

  return (
    <AnimatePresence>
      {workshop && (
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
                className="relative bg-white dark:bg-[#1E2329] rounded-2xl shadow-2xl max-w-4xl w-full border border-[#E9ECEF] dark:border-[#6C757D]/30 max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header Compacto */}
                <div className="relative bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 dark:from-[#0A2540] dark:to-[#0A2540]/80 px-6 py-4 border-b border-[#0A2540]/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#00D4B3]/20 flex items-center justify-center">
                        <BookOpenIcon className="h-5 w-5 text-[#00D4B3]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          Editar Taller
                        </h3>
                        <p className="text-xs text-white/70">
                          {workshop.title}
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

                {/* Tabs */}
                <div className="flex items-center gap-1 px-6 py-3 bg-[#E9ECEF]/50 dark:bg-[#0A0D12] border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                      <motion.button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'text-[#00D4B3] bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20'
                            : 'text-[#6C757D] dark:text-white/60 hover:text-[#0A2540] dark:hover:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#1E2329]'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 rounded-xl bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 -z-10"
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    )
                  })}
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    <AnimatePresence mode="wait">
                      {/* Tab: Información */}
                      {activeTab === 'basic' && (
                        <motion.div
                          key="basic"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <div>
                            <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                              Título *
                            </label>
                            <input
                              type="text"
                              value={formData.title}
                              onChange={(e) => handleInputChange('title', e.target.value)}
                              className={`w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 transition-all duration-200 ${
                                errors.title
                                  ? 'border-red-500 focus:ring-red-500/40'
                                  : 'border-[#E9ECEF] dark:border-[#6C757D]/30 focus:ring-[#00D4B3]/40 focus:border-transparent'
                              }`}
                              placeholder="Título del taller"
                            />
                            {errors.title && (
                              <p className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                                <ExclamationTriangleIcon className="h-3 w-3" />
                                {errors.title}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                              Descripción *
                            </label>
                            <textarea
                              value={formData.description}
                              onChange={(e) => handleInputChange('description', e.target.value)}
                              rows={4}
                              className={`w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 transition-all duration-200 resize-none ${
                                errors.description
                                  ? 'border-red-500 focus:ring-red-500/40'
                                  : 'border-[#E9ECEF] dark:border-[#6C757D]/30 focus:ring-[#00D4B3]/40 focus:border-transparent'
                              }`}
                              placeholder="Descripción del taller"
                            />
                            {errors.description && (
                              <p className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                                <ExclamationTriangleIcon className="h-3 w-3" />
                                {errors.description}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                                Categoría *
                              </label>
                              <select
                                value={formData.category}
                                onChange={(e) => handleInputChange('category', e.target.value)}
                                className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                              >
                                {categories.map(cat => (
                                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                                Nivel *
                              </label>
                              <select
                                value={formData.level}
                                onChange={(e) => handleInputChange('level', e.target.value)}
                                className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                              >
                                {levels.map(level => (
                                  <option key={level.value} value={level.value}>{level.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                                Duración (minutos) *
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={formData.duration_total_minutes}
                                onChange={(e) => handleInputChange('duration_total_minutes', parseInt(e.target.value) || 0)}
                                className={`w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 transition-all duration-200 ${
                                  errors.duration_total_minutes
                                    ? 'border-red-500 focus:ring-red-500/40'
                                    : 'border-[#E9ECEF] dark:border-[#6C757D]/30 focus:ring-[#00D4B3]/40 focus:border-transparent'
                                }`}
                              />
                              {errors.duration_total_minutes && (
                                <p className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                                  <ExclamationTriangleIcon className="h-3 w-3" />
                                  {errors.duration_total_minutes}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                                Precio
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Tab: Estado */}
                      {activeTab === 'status' && (
                        <motion.div
                          key="status"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            className="p-4 bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30"
                          >
                            <label className="flex items-center gap-3 cursor-pointer">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={formData.is_active}
                                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                                  className="sr-only"
                                />
                                <motion.div
                                  animate={{
                                    backgroundColor: formData.is_active ? '#00D4B3' : '#E9ECEF',
                                    borderColor: formData.is_active ? '#00D4B3' : '#E9ECEF'
                                  }}
                                  className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200"
                                >
                                  {formData.is_active && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    >
                                      <CheckIcon className="h-4 w-4 text-white" />
                                    </motion.div>
                                  )}
                                </motion.div>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-[#0A2540] dark:text-white">
                                  {formData.is_active ? 'Taller Activo' : 'Taller Inactivo'}
                                </span>
                                <p className="text-xs text-[#6C757D] dark:text-white/60 mt-0.5">
                                  {formData.is_active ? 'El taller es visible para los estudiantes' : 'El taller está oculto'}
                                </p>
                              </div>
                            </label>
                          </motion.div>

                          <div>
                            <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                              Estado de Aprobación *
                            </label>
                            <select
                              value={formData.approval_status}
                              onChange={(e) => handleInputChange('approval_status', e.target.value as 'pending' | 'approved' | 'rejected')}
                              className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                            >
                              {approvalStatuses.map(status => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>
                            <div className="mt-2 flex items-center gap-2">
                              {approvalStatuses.map(status => {
                                if (status.value === formData.approval_status) {
                                  const Icon = status.icon
                                  return (
                                    <div key={status.value} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${status.value === 'pending' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : status.value === 'approved' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#EF4444]/10 text-[#EF4444]'}`}>
                                      <Icon className="w-4 h-4" />
                                      <span className="text-xs font-medium">{status.label}</span>
                                    </div>
                                  )
                                }
                                return null
                              })}
                            </div>
                          </div>

                          {formData.approval_status === 'rejected' && (
                            <div>
                              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                                Razón de Rechazo *
                              </label>
                              <textarea
                                value={formData.rejection_reason}
                                onChange={(e) => handleInputChange('rejection_reason', e.target.value)}
                                rows={3}
                                className={`w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 transition-all duration-200 resize-none ${
                                  errors.rejection_reason
                                    ? 'border-red-500 focus:ring-red-500/40'
                                    : 'border-[#E9ECEF] dark:border-[#6C757D]/30 focus:ring-[#00D4B3]/40 focus:border-transparent'
                                }`}
                                placeholder="Explica por qué se rechaza este taller..."
                              />
                              {errors.rejection_reason ? (
                                <p className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                                  <ExclamationTriangleIcon className="h-3 w-3" />
                                  {errors.rejection_reason}
                                </p>
                              ) : (
                                <p className="mt-1 text-xs text-[#6C757D] dark:text-white/60">
                                  La razón de rechazo es obligatoria cuando el estado es "Rechazado"
                                </p>
                              )}
                            </div>
                          )}

                          {formData.approval_status === 'approved' && workshop.approved_at && (
                            <div className="p-4 bg-[#10B981]/10 dark:bg-[#10B981]/20 border border-[#10B981]/20 dark:border-[#10B981]/30 rounded-xl">
                              <p className="text-sm text-[#10B981] dark:text-[#10B981]">
                                <strong>Aprobado el:</strong> {new Date(workshop.approved_at).toLocaleString('es-ES')}
                              </p>
                              {workshop.approved_by && (
                                <p className="text-xs text-[#10B981]/80 dark:text-[#10B981] mt-1">
                                  Por: {workshop.approved_by}
                                </p>
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 bg-[#E9ECEF]/30 dark:bg-[#0A0D12] border-t border-[#E9ECEF] dark:border-[#6C757D]/30 flex items-center justify-end gap-3">
                    {saveError && (
                      <p className="mr-auto text-xs text-red-500">{saveError}</p>
                    )}
                    <motion.button
                      type="button"
                      onClick={onClose}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-2.5 text-[#6C757D] dark:text-white/70 bg-white dark:bg-[#1E2329] hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/30 rounded-xl text-sm font-medium transition-colors duration-200 border border-[#E9ECEF] dark:border-[#6C757D]/30"
                      disabled={loading}
                    >
                      Cancelar
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-2.5 bg-[#0A2540] hover:bg-[#0d2f4d] text-white rounded-xl text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#0A2540]/20 flex items-center gap-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-4 w-4" />
                          <span>Guardar Cambios</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
