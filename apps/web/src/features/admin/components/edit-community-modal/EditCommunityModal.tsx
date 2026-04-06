'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Edit3, Save, AlertCircle, Shield } from 'lucide-react'
import { SOFLIA_ADMIN_COLORS } from '../../constants/admin-color-tokens'
import type { AdminCommunity } from '../../services/adminCommunities.service'
import { useEditCommunityFormState } from './useEditCommunityFormState'
import { CommunityFormSections } from './CommunityFormSections'

const colors = SOFLIA_ADMIN_COLORS

interface EditCommunityModalProps {
  community: AdminCommunity | null
  isOpen: boolean
  onClose: () => void
  onSave: (communityData: ReturnType<typeof useEditCommunityFormState>['formData']) => Promise<void>
}

export function EditCommunityModal({ community, isOpen, onClose, onSave }: EditCommunityModalProps) {
  const { formData, isLoading, error, handleChange, handleSubmit } = useEditCommunityFormState({
    community,
    onSave,
    onClose
  })

  if (!isOpen || !community) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl"
            style={{
              background: `linear-gradient(145deg, ${colors.bgSecondary} 0%, ${colors.bgTertiary} 100%)`,
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {/* Decorative glow */}
            <div
              className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ background: colors.purple }}
            />

            {/* Header */}
            <div className="relative p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    initial={{ rotate: -180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    className="p-3 rounded-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${colors.purple} 0%, ${colors.primary} 100%)`,
                      boxShadow: '0 10px 40px rgba(139, 92, 246, 0.3)'
                    }}
                  >
                    <Edit3 className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Editar Comunidad</h2>
                    <p className="text-gray-400 text-sm mt-0.5">
                      Modificando: <span className="text-white font-medium">{community.name}</span>
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Global Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{
                    background: `${colors.error}15`,
                    border: `1px solid ${colors.error}30`
                  }}
                >
                  <AlertCircle className="w-5 h-5" style={{ color: colors.error }} />
                  <p className="text-sm" style={{ color: colors.error }}>{error}</p>
                </motion.div>
              )}

              {/* Form Sections */}
              <CommunityFormSections formData={formData} handleChange={handleChange} />

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-6 py-3 rounded-xl font-medium text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  Cancelar
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 10px 40px rgba(139, 92, 246, 0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3 rounded-xl font-semibold text-white flex items-center gap-2 disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${colors.purple} 0%, ${colors.primary} 100%)`,
                    boxShadow: '0 5px 20px rgba(139, 92, 246, 0.2)'
                  }}
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}
