'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, UserIcon, PlusIcon } from '@heroicons/react/24/outline'
import { GlobeAltIcon } from '@heroicons/react/24/outline'
import type { NewAdminUserData, TabType } from './useAddUserFormState'
import { useAddUserFormState } from './useAddUserFormState'
import { AddUserModalTabs } from './AddUserModalTabs'

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (userData: NewAdminUserData) => Promise<void>
}

export function AddUserModal({ isOpen, onClose, onSave }: AddUserModalProps) {
  const {
    formData, setFormData, isLoading, error,
    activeTab, setActiveTab, handleChange, handleSubmit
  } = useAddUserFormState({ onSave, onClose })

  if (!isOpen) return null

  const tabs: { id: TabType; label: string; icon: typeof UserIcon }[] = [
    { id: 'basic', label: 'Básica', icon: UserIcon },
    { id: 'personal', label: 'Personal', icon: UserIcon },
    { id: 'additional', label: 'Adicional', icon: GlobeAltIcon }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[150] bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[150] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative bg-white dark:bg-[#1E2329] rounded-2xl shadow-2xl max-w-4xl w-full border border-[#E9ECEF] dark:border-[#6C757D]/30 max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 dark:from-[#0A2540] dark:to-[#0A2540]/80 px-6 py-4 border-b border-[#0A2540]/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#00D4B3]/20 flex items-center justify-center">
                        <PlusIcon className="h-5 w-5 text-[#00D4B3]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Agregar Nuevo Usuario</h3>
                        <p className="text-xs text-white/70">Crear un nuevo usuario en la plataforma</p>
                      </div>
                    </div>
                    <motion.button onClick={onClose} whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200">
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
                      <motion.button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isActive ? 'text-[#00D4B3] bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20' : 'text-[#6C757D] dark:text-white/60 hover:text-[#0A2540] dark:hover:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#1E2329]'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                        {isActive && (
                          <motion.div layoutId="activeTab"
                            className="absolute inset-0 rounded-xl bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 -z-10"
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                        )}
                      </motion.button>
                    )
                  })}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 dark:border-red-500/30 rounded-xl">
                        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                      </motion.div>
                    )}
                    <AddUserModalTabs
                      activeTab={activeTab}
                      formData={formData}
                      onChange={handleChange}
                      onRoleChange={(value) => setFormData(prev => ({ ...prev, cargo_rol: value }))}
                    />
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 bg-[#E9ECEF]/30 dark:bg-[#0A0D12] border-t border-[#E9ECEF] dark:border-[#6C757D]/30 flex items-center justify-end gap-3">
                    <motion.button type="button" onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={isLoading}
                      className="px-6 py-2.5 text-[#6C757D] dark:text-white/70 bg-white dark:bg-[#1E2329] hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/30 rounded-xl text-sm font-medium transition-colors duration-200 border border-[#E9ECEF] dark:border-[#6C757D]/30">
                      Cancelar
                    </motion.button>
                    <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={isLoading}
                      className="px-6 py-2.5 bg-[#0A2540] hover:bg-[#0d2f4d] text-white rounded-xl text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#0A2540]/20 flex items-center gap-2">
                      {isLoading ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Creando...</span></>
                      ) : (
                        <><PlusIcon className="h-4 w-4" /><span>Crear Usuario</span></>
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
