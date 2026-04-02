'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X,
  AlertTriangle,
  Users,
  FileText,
  Video,
  MessageCircle,
  UserPlus,
  Shield,
  Trash2,
  AlertCircle
} from 'lucide-react'
import { SOFLIA_ADMIN_COLORS } from '../constants/admin-color-tokens'
import { AdminCommunity } from '../services/adminCommunities.service'

const colors = SOFLIA_ADMIN_COLORS

interface DeleteCommunityModalProps {
  community: AdminCommunity | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function DeleteCommunityModal({ community, isOpen, onClose, onConfirm }: DeleteCommunityModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar comunidad')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen || !community) return null

  const dataItems = [
    { icon: Users, label: 'Miembros', value: community.member_count || 0 },
    { icon: FileText, label: 'Posts', value: community.posts_count || 0 },
    { icon: MessageCircle, label: 'Comentarios', value: community.comments_count || 0 },
    { icon: Video, label: 'Videos', value: community.videos_count || 0 },
    { icon: UserPlus, label: 'Solicitudes', value: community.access_requests_count || 0 },
  ]

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
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-2xl rounded-3xl overflow-hidden"
            style={{ 
              background: `linear-gradient(145deg, ${colors.bgSecondary} 0%, ${colors.bgTertiary} 100%)`,
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {/* Decorative danger glow */}
            <div 
              className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-30 pointer-events-none"
              style={{ background: colors.error }}
            />

            {/* Header */}
            <div 
              className="relative p-6 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    className="p-3 rounded-2xl"
                    style={{ 
                      background: `linear-gradient(135deg, ${colors.error} 0%, ${colors.warning} 100%)`,
                      boxShadow: `0 10px 40px ${colors.error}40`
                    }}
                  >
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Eliminar Comunidad</h2>
                    <p className="text-red-400 text-sm mt-0.5">Esta acción no se puede deshacer</p>
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

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Error Message */}
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

              {/* Warning Message */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-5 rounded-2xl"
                style={{ 
                  background: `linear-gradient(135deg, ${colors.error}20 0%, ${colors.warning}10 100%)`,
                  border: `1px solid ${colors.error}30`
                }}
              >
                <div className="flex items-start gap-4">
                  <motion.div 
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                    className="p-2.5 rounded-xl mt-0.5"
                    style={{ background: `${colors.error}30` }}
                  >
                    <AlertTriangle className="w-5 h-5" style={{ color: colors.error }} />
                  </motion.div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: colors.error }}>
                      ¿Estás seguro de que quieres eliminar esta comunidad?
                    </h4>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      Esta acción eliminará permanentemente la comunidad{' '}
                      <span className="font-semibold text-white">"{community.name}"</span>{' '}
                      y todos sus datos asociados. Esta operación no se puede deshacer.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Community Info */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-5 rounded-2xl"
                style={{ background: colors.bgTertiary, border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg" style={{ background: `${colors.accent}20` }}>
                    <Users className="w-4 h-4" style={{ color: colors.accent }} />
                  </div>
                  <h5 className="text-sm font-semibold text-white">Información de la Comunidad</h5>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <span className="text-gray-400">Nombre</span>
                    <span className="text-white font-medium">{community.name}</span>
                  </div>
                  <div className="flex justify-between items-start py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <span className="text-gray-400">Descripción</span>
                    <span className="text-white text-right max-w-[200px] text-xs">{community.description}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <span className="text-gray-400">Estado</span>
                    <span 
                      className="px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        background: community.is_active ? `${colors.success}20` : `${colors.error}20`,
                        color: community.is_active ? colors.success : colors.error,
                        border: `1px solid ${community.is_active ? colors.success : colors.error}30`
                      }}
                    >
                      {community.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400">Visibilidad</span>
                    <span className="text-white capitalize">{community.visibility}</span>
                  </div>
                </div>
              </motion.div>

              {/* Data to be Deleted */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-5 rounded-2xl"
                style={{ 
                  background: `linear-gradient(135deg, ${colors.warning}15 0%, transparent 100%)`,
                  border: `1px solid ${colors.warning}30`
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg" style={{ background: `${colors.warning}20` }}>
                    <Shield className="w-4 h-4" style={{ color: colors.warning }} />
                  </div>
                  <h5 className="text-sm font-semibold" style={{ color: colors.warning }}>
                    Datos que se eliminarán
                  </h5>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {dataItems.map((item, index) => (
                    <motion.div 
                      key={item.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="flex items-center gap-2.5 p-3 rounded-xl"
                      style={{ background: `${colors.warning}10` }}
                    >
                      <item.icon className="w-4 h-4" style={{ color: colors.warning }} />
                      <div>
                        <p className="text-lg font-bold text-white">{item.value}</p>
                        <p className="text-xs text-gray-400">{item.label}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Data Protection Notice */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{ 
                  background: `linear-gradient(135deg, ${colors.primary}30 0%, ${colors.accent}10 100%)`,
                  border: `1px solid ${colors.accent}20`
                }}
              >
                <div className="p-2 rounded-lg" style={{ background: `${colors.accent}20` }}>
                  <Shield className="w-5 h-5" style={{ color: colors.accent }} />
                </div>
                <div>
                  <h5 className="text-sm font-semibold" style={{ color: colors.accent }}>
                    Aviso de Protección de Datos
                  </h5>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Esta eliminación será registrada en el log de auditoría conforme a la LFPDPPP y las normas ISO 27001.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Actions */}
            <div 
              className="p-6 border-t flex justify-end gap-3"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-6 py-3 rounded-xl font-medium text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                Cancelar
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: `0 10px 40px ${colors.error}40` }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleConfirm}
                disabled={isDeleting}
                className="px-6 py-3 rounded-xl font-semibold text-white flex items-center gap-2 disabled:opacity-50"
                style={{ 
                  background: `linear-gradient(135deg, ${colors.error} 0%, ${colors.warning} 100%)`,
                  boxShadow: `0 5px 20px ${colors.error}30`
                }}
              >
                {isDeleting ? (
                  <>
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    <span>Eliminar Comunidad</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}
