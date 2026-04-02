'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, UserCog, Shield, Trash2, CheckCircle2, Loader2, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SOFLIA_ADMIN_COLORS } from '../constants/admin-color-tokens'

interface AdminMemberManageModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
  member: any
  companyId: string
  mode: 'edit' | 'delete' | null
  primaryColor?: string
  accentColor?: string
}

export function AdminMemberManageModal({
  isOpen,
  onClose,
  onUpdate,
  member,
  companyId,
  mode,
  primaryColor = SOFLIA_ADMIN_COLORS.primary,
  accentColor = SOFLIA_ADMIN_COLORS.accent
}: AdminMemberManageModalProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState(member?.role || 'member')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!isOpen || !member || !mode) return null

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/companies/${companyId}/members/${member.user_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: selectedRole })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al actualizar el usuario')
      }

      onUpdate()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al guardar los cambios')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/companies/${companyId}/members/${member.user_id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al eliminar el usuario')
      }

      onUpdate()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al eliminar usuario')
    } finally {
      setLoading(false)
    }
  }

  const roleLabels = {
    member: { label: 'Miembro', desc: 'Acceso básico a la plataforma' },
    admin: { label: 'Administrador', desc: 'Puede gestionar usuarios y contenido' },
    owner: { label: 'Propietario', desc: 'Control total de la organización' }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl border bg-white dark:bg-[#1A1F2E] border-gray-100 dark:border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent/10">
                  <UserCog className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {mode === 'edit' ? t('users.modals.manage.title', 'Gestionar Miembro') : t('users.modals.delete.title', 'Eliminar Miembro')}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-[#8899A6]">
                    {member.user?.email || member.email}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 dark:text-[#8899A6]" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500"
              >
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}

            {mode === 'edit' ? (
              <div>
                <label className="block text-sm font-bold text-gray-600 dark:text-white/70 mb-4 uppercase tracking-wider">
                  {t('users.modals.manage.role.label', 'Cambiar Rol')}
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {(['member', 'admin', 'owner'] as const).map((role) => (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${
                        selectedRole === role
                          ? 'bg-accent/10 border-accent shadow-sm'
                          : 'bg-gray-50 dark:bg-[#0F1419] border-gray-100 dark:border-white/10 hover:border-accent/40 dark:hover:border-accent/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <Shield className={`w-5 h-5 ${selectedRole === role ? 'text-accent' : 'text-gray-400 dark:text-[#8899A6]'}`} />
                          <span className={`font-bold ${selectedRole === role ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-white/80'}`}>
                            {roleLabels[role].label}
                          </span>
                        </div>
                        {selectedRole === role && (
                          <CheckCircle2 className="w-5 h-5 text-accent" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-[#8899A6] ml-8">{roleLabels[role].desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                  <p className="text-gray-600 dark:text-white/80">
                    ¿Estás seguro de que deseas eliminar a <strong>{member.user?.email || 'este usuario'}</strong>?
                    Esta acción no se puede deshacer y el usuario perderá acceso inmediato.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50/50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl text-sm font-bold text-gray-500 dark:text-[#8899A6] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              {t('common.buttons.cancel', 'Cancelar')}
            </button>
            {mode === 'edit' ? (
              <button
                onClick={handleEditSubmit}
                disabled={loading || selectedRole === member.role}
                className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-accent hover:bg-accent/90 transition-all disabled:opacity-50 flex items-center gap-2"
                style={{ backgroundColor: accentColor }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('common.buttons.save', 'Guardar Cambios')}
              </button>
            ) : (
              <button
                onClick={handleDeleteSubmit}
                disabled={loading}
                className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('common.buttons.delete', 'Eliminar')}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
