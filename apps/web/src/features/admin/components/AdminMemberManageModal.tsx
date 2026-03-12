'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, UserCheck, Shield, Trash2, ShieldAlert } from 'lucide-react'

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
  primaryColor = '#0A2540',
  accentColor = '#00D4B3'
}: AdminMemberManageModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState(member?.role || 'member')

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-[#1A1F2E] rounded-2xl shadow-2xl overflow-hidden border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {mode === 'edit' ? (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-white/10 shrink-0 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-accent/20">
                    <UserCheck className="w-6 h-6" style={{ color: accentColor }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Editar Rol</h3>
                    <p className="text-sm text-white/50">{member.user?.email}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}
                
                <h4 className="text-sm font-medium text-white/70 mb-3">Selecciona el nuevo rol</h4>
                <div className="flex flex-col gap-3">
                  {(['member', 'admin', 'owner'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedRole === role ? 'bg-primary/30 border-primary' : 'bg-white/5 border-white/10'
                      }`}
                      style={{
                        borderColor: selectedRole === role ? accentColor : undefined
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Shield
                          className="w-4 h-4"
                          style={{ color: selectedRole === role ? accentColor : 'rgba(255,255,255,0.5)' }}
                        />
                        <span className="text-sm font-medium text-white">
                          {roleLabels[role].label}
                        </span>
                      </div>
                      <p className="text-xs text-white/50">{roleLabels[role].desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3 bg-black/20">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={loading || selectedRole === member.role}
                  className="px-5 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
                  style={{ backgroundColor: accentColor, color: primaryColor }}
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-red-500/20 shrink-0 bg-red-500/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-red-500/20">
                    <Trash2 className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Eliminar Miembro</h3>
                    <p className="text-sm text-red-400/80">Acción destructiva</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}
                
                <p className="text-white/80 mb-2">
                  ¿Estás seguro de que deseas eliminar a <strong>{member.user?.email || 'este usuario'}</strong> de la empresa?
                </p>
                <p className="text-sm text-white/50">
                  Esta acción revocará su acceso a todos los recursos de esta empresa. No podrás deshacer esta acción fácilmente.
                </p>
              </div>

              <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3 bg-black/20">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteSubmit}
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    'Eliminando...'
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Eliminar Usuario
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
