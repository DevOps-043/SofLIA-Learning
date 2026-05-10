'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { 
  XMarkIcon,
  BookOpenIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { AdminModule } from '../services/adminModules.service'

interface ModuleModalProps {
  module?: AdminModule | null
  onClose: () => void
  onSave: (data: { module_title: string, module_description?: string, is_required: boolean, is_published: boolean }) => Promise<void>
}

export function ModuleModal({ module, onClose, onSave }: ModuleModalProps) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const [formData, setFormData] = useState({
    module_title: '',
    module_description: '',
    is_required: true,
    is_published: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (module) {
      setFormData({
        module_title: module.module_title,
        module_description: module.module_description || '',
        is_required: module.is_required,
        is_published: module.is_published
      })
    } else {
      setFormData({
        module_title: '',
        module_description: '',
        is_required: true,
        is_published: false
      })
    }
    setError(null)
  }, [module])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : t('workshops.errors.saveModule'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {true && (
        <>
          {/* Backdrop Mejorado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Mejorado */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-[100dvh] items-end justify-center p-0 sm:items-center sm:p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                transition={{ 
                  duration: 0.3, 
                  ease: [0.25, 0.46, 0.45, 0.94],
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
                className="relative flex h-[100dvh] w-full flex-col overflow-hidden rounded-none border border-[#E9ECEF] bg-white shadow-2xl dark:border-[#6C757D]/30 dark:bg-[#1E2329] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header Mejorado con Animación */}
                <motion.div 
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="relative overflow-hidden border-b border-[#0A2540]/20 bg-gradient-to-r from-[#0A2540] via-[#0A2540]/95 to-[#0A2540]/90 px-4 py-5 dark:from-[#0A2540] dark:via-[#0A2540]/90 dark:to-[#0A2540]/80 sm:px-6"
                >
                  {/* Efecto de brillo animado */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00D4B3]/10 to-transparent"
                    animate={{
                      x: ['-100%', '200%']
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 2,
                      ease: "linear"
                    }}
                  />
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="w-12 h-12 rounded-xl bg-[#00D4B3]/20 dark:bg-[#00D4B3]/30 flex items-center justify-center shadow-lg shadow-[#00D4B3]/20"
                      >
                        <BookOpenIcon className="h-6 w-6 text-[#00D4B3]" />
                      </motion.div>
                      <div>
                        <motion.h3 
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.15 }}
                          className="text-xl font-bold text-white"
                        >
                          {module ? t('workshops.editor.modules.editModule') : t('workshops.editor.modules.createModule')}
                        </motion.h3>
                        <motion.p 
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="text-xs text-white/70 mt-0.5"
                        >
                          {module ? t('workshops.editor.modules.editModuleDesc') : t('workshops.editor.modules.createModuleDesc')}
                        </motion.p>
                      </div>
                    </div>
                    <motion.button
                      onClick={onClose}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 group relative"
                    >
                      <XMarkIcon className="h-5 w-5 relative z-10" />
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/10"
                        transition={{ duration: 0.2 }}
                      />
                    </motion.button>
                  </div>
                </motion.div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <div className="min-h-0 flex-1 overflow-y-auto space-y-4 p-4 sm:p-6">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 dark:border-red-500/30 rounded-xl"
                      >
                        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                      </motion.div>
                    )}

                    {/* Título Mejorado */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="group"
                    >
                      <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-2 uppercase tracking-wide">
                        {t('workshops.editor.modules.moduleTitleLabel')}
                      </label>
                      <div className="relative">
                        <motion.div
                          animate={{
                            color: formData.module_title ? '#00D4B3' : '#6C757D'
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <BookOpenIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 group-focus-within:text-[#00D4B3] transition-colors pointer-events-none" />
                        </motion.div>
                        <input
                          type="text"
                          required
                          value={formData.module_title}
                          onChange={(e) => setFormData(prev => ({ ...prev, module_title: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-[#00D4B3]/50 transition-all duration-200"
                          placeholder={t('workshops.editor.modules.moduleTitlePlaceholder')}
                        />
                      </div>
                    </motion.div>

                    {/* Descripción Mejorada */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-2 uppercase tracking-wide">
                        {t('workshops.editor.modules.moduleDescriptionLabel')}
                      </label>
                      <div className="relative">
                        <textarea
                          rows={4}
                          value={formData.module_description}
                          onChange={(e) => setFormData(prev => ({ ...prev, module_description: e.target.value }))}
                          className="w-full px-4 py-3 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-[#00D4B3]/50 transition-all duration-200 resize-none"
                          placeholder={t('workshops.editor.modules.moduleDescriptionPlaceholder')}
                        />
                      </div>
                    </motion.div>

                    {/* Checkboxes Mejorados */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="grid grid-cols-1 gap-4 md:grid-cols-2"
                    >
                      <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="group relative p-4 bg-gradient-to-br from-[#E9ECEF]/50 to-[#E9ECEF]/30 dark:from-[#0A0D12] dark:to-[#0A0D12]/50 rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#00D4B3]/30 dark:hover:border-[#00D4B3]/30 transition-all duration-300 cursor-pointer overflow-hidden"
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-[#00D4B3]/0 to-[#00D4B3]/0 group-hover:from-[#00D4B3]/5 group-hover:to-[#00D4B3]/0"
                          transition={{ duration: 0.3 }}
                        />
                        <label className="relative flex items-center gap-3 cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={formData.is_required}
                              onChange={(e) => setFormData(prev => ({ ...prev, is_required: e.target.checked }))}
                              className="sr-only"
                            />
                            <motion.div
                              animate={{
                                backgroundColor: formData.is_required ? '#00D4B3' : '#E9ECEF',
                                borderColor: formData.is_required ? '#00D4B3' : '#E9ECEF',
                                scale: formData.is_required ? 1 : 0.95
                              }}
                              className="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 shadow-sm"
                            >
                              {formData.is_required && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                >
                                  <CheckCircleIcon className="h-4 w-4 text-white" />
                                </motion.div>
                              )}
                            </motion.div>
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-[#0A2540] dark:text-white">
                              {t('workshops.editor.modules.requiredLabel')}
                            </span>
                            <p className="text-xs text-[#6C757D] dark:text-white/60 mt-0.5">
                              {t('workshops.editor.modules.requiredDesc')}
                            </p>
                          </div>
                        </label>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="group relative p-4 bg-gradient-to-br from-[#E9ECEF]/50 to-[#E9ECEF]/30 dark:from-[#0A0D12] dark:to-[#0A0D12]/50 rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#00D4B3]/30 dark:hover:border-[#00D4B3]/30 transition-all duration-300 cursor-pointer overflow-hidden"
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-[#00D4B3]/0 to-[#00D4B3]/0 group-hover:from-[#00D4B3]/5 group-hover:to-[#00D4B3]/0"
                          transition={{ duration: 0.3 }}
                        />
                        <label className="relative flex items-center gap-3 cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={formData.is_published}
                              onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                              className="sr-only"
                            />
                            <motion.div
                              animate={{
                                backgroundColor: formData.is_published ? '#00D4B3' : '#E9ECEF',
                                borderColor: formData.is_published ? '#00D4B3' : '#E9ECEF',
                                scale: formData.is_published ? 1 : 0.95
                              }}
                              className="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 shadow-sm"
                            >
                              {formData.is_published && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                >
                                  <CheckCircleIcon className="h-4 w-4 text-white" />
                                </motion.div>
                              )}
                            </motion.div>
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-[#0A2540] dark:text-white">
                              {t('workshops.editor.modules.publishedLabel')}
                            </span>
                            <p className="text-xs text-[#6C757D] dark:text-white/60 mt-0.5">
                              {t('workshops.editor.modules.publishedDesc')}
                            </p>
                          </div>
                        </label>
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Footer Mejorado */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-[#E9ECEF] bg-gradient-to-r from-[#E9ECEF]/30 via-[#E9ECEF]/20 to-[#E9ECEF]/30 px-4 py-4 dark:border-[#6C757D]/30 dark:from-[#0A0D12] dark:via-[#0A0D12]/50 dark:to-[#0A0D12] sm:flex-row sm:items-center sm:justify-end sm:px-6"
                  >
                    <motion.button
                      type="button"
                      onClick={onClose}
                      whileHover={{ scale: 1.02, x: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full rounded-xl border border-[#E9ECEF] bg-white px-6 py-2.5 text-sm font-medium text-[#6C757D] shadow-sm transition-all duration-200 hover:bg-[#E9ECEF] hover:shadow-md dark:border-[#6C757D]/30 dark:bg-[#1E2329] dark:text-white/70 dark:hover:bg-[#0A2540]/30 sm:w-auto"
                      disabled={loading}
                    >
                      {tc('actions.cancel')}
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0A2540]/20 transition-all duration-200 hover:from-[#0d2f4d] hover:to-[#0A2540] hover:shadow-xl hover:shadow-[#0A2540]/30 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      disabled={loading}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-[#00D4B3]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      />
                      {loading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full relative z-10"
                          />
                          <span className="relative z-10">{tc('actions.saving')}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-4 w-4 relative z-10" />
                          <span className="relative z-10">{tc('actions.save')}</span>
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                </form>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
