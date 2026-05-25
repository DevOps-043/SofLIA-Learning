'use client'

import type { FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { AdminUser } from '../services/adminUsers.service'
import {
  EditUserAccountTab,
  EditUserModalFooter,
  EditUserModalHeader,
  EditUserModalTabs,
  EditUserPersonalTab,
  getEditUserDisplayName,
  useEditUserModalForm,
} from './edit-user-modal'
import type { EditUserModalProps } from './edit-user-modal'

export function EditUserModal({
  user,
  isOpen,
  onClose,
  onSave,
}: EditUserModalProps) {
  const {
    formData,
    isLoading,
    error,
    activeTab,
    setIsLoading,
    setError,
    setActiveTab,
    handleFieldChange,
  } = useEditUserModalForm(user)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await onSave(formData as Partial<AdminUser>)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar usuario')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !user) {
    return null
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{
                  duration: 0.3,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="relative bg-white dark:bg-carbon-800 rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 dark:border-gray-500/30 max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <EditUserModalHeader
                  title={getEditUserDisplayName(user)}
                  onClose={onClose}
                />

                <EditUserModalTabs
                  activeTab={activeTab}
                  onChange={setActiveTab}
                />

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 dark:border-red-500/30 rounded-xl"
                      >
                        <p className="text-sm text-red-500 dark:text-red-400">
                          {error}
                        </p>
                      </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                      {activeTab === 'personal' ? (
                        <EditUserPersonalTab
                          formData={formData}
                          onFieldChange={handleFieldChange}
                        />
                      ) : (
                        <EditUserAccountTab
                          formData={formData}
                          onFieldChange={handleFieldChange}
                        />
                      )}
                    </AnimatePresence>
                  </div>

                  <EditUserModalFooter
                    isLoading={isLoading}
                    onClose={onClose}
                  />
                </form>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
