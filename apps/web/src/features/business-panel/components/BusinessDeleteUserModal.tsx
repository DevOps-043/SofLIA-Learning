'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation, Trans } from 'react-i18next'
import { X, AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'
import { BusinessUser } from '../services/businessUsers.service'

interface BusinessDeleteUserModalProps {
  user: BusinessUser | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function BusinessDeleteUserModal({ user, isOpen, onClose, onConfirm }: BusinessDeleteUserModalProps) {
  const { t } = useTranslation('business')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.modals.delete.error'))
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !user) return null

  const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop premium */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative backdrop-blur-xl rounded-3xl shadow-2xl border w-full max-w-md m-4 overflow-hidden bg-white/95 dark:bg-slate-900/95 border-red-200/50 dark:border-red-500/30"
        >
          {/* Header */}
          <div className="relative border-b p-6 backdrop-blur-sm bg-slate-50/80 dark:bg-slate-900/80 border-slate-200/50 dark:border-slate-700/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0.9, rotate: -5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center shrink-0"
                >
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </motion.div>
                <div>
                  <h2 className="text-heading text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {t('users.modals.delete.title')}
                  </h2>
                  <p className="text-body text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {t('users.modals.delete.subtitle')}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                disabled={isLoading}
                className="p-2 rounded-xl transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors" />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl text-red-600 dark:text-red-400 backdrop-blur-sm"
                >
                  <span className="text-body text-sm">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Warning message */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="p-5 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-500/20 rounded-xl backdrop-blur-sm"
            >
              <p className="text-body text-slate-700 dark:text-slate-200 mb-2 leading-relaxed">
                <Trans
                  i18nKey="users.modals.delete.confirmQuestion"
                  t={t}
                  values={{ name: displayName }}
                  components={{ 1: <span className="font-ui font-semibold text-red-600 dark:text-red-400" /> }}
                />
              </p>
              <p className="text-body text-red-500/80 dark:text-slate-400 text-sm">
                {t('users.modals.delete.warning')}
              </p>
            </motion.div>

            {/* User details */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="p-5 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/30 backdrop-blur-sm"
            >
              <div className="space-y-3">
                <div>
                  <p className="text-body text-xs text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{t('users.modals.delete.fields.email')}</p>
                  <p className="text-body text-slate-900 dark:text-white font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-body text-xs text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{t('users.modals.delete.fields.role')}</p>
                  <p className="text-body text-slate-900 dark:text-white font-medium capitalize">{
                    user.org_role === 'owner' ? t('users.roles.owner') :
                      user.org_role === 'admin' ? t('users.roles.admin') : t('users.roles.member')
                  }</p>
                </div>
              </div>
            </motion.div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700/30">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={isLoading}
                  className="font-ui text-sm transition-all duration-200"
                >
                  {t('users.buttons.cancel')}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="button"
                  variant="gradient"
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700 font-ui text-sm transition-all duration-200"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {t('users.buttons.deleting')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      {t('users.buttons.delete')}
                    </span>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
