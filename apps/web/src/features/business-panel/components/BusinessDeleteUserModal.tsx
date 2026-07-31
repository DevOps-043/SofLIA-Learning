'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation, Trans } from 'react-i18next'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { BusinessUser } from '../services/businessUsers.service'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'

interface BusinessDeleteUserModalProps {
  user: BusinessUser | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function BusinessDeleteUserModal({
  user,
  isOpen,
  onClose,
  onConfirm,
}: BusinessDeleteUserModalProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()
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

  const displayName =
    user.display_name ||
    `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
    user.username

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 isolate flex h-app-dynamic items-center justify-center p-4"
        style={{ zIndex: 100000 }}
      >
        <motion.div
          animate={{ opacity: 1 }}
          className="absolute inset-0"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
          style={{
            backgroundColor: theme.overlayBg,
            backdropFilter: 'blur(16px) saturate(112%)',
          }}
        />

        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative m-4 w-full max-w-[30rem] overflow-hidden border shadow-[0_30px_70px_-24px_rgba(2,12,23,0.58)]"
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          onClick={(event) => event.stopPropagation()}
          style={{
            backgroundColor: theme.panelBg,
            borderColor: `color-mix(in srgb, ${theme.dangerColor} 24%, ${theme.borderColor})`,
            borderRadius: '1.65rem',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <header
            className="border-b px-6 py-5"
            style={{
              backgroundColor: `color-mix(in srgb, ${theme.inputBg} 94%, transparent)`,
              borderColor: theme.borderColor,
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <motion.div
                  animate={{ scale: 1, rotate: 0 }}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[0.95rem] border"
                  initial={{ scale: 0.9, rotate: -5 }}
                  style={{
                    color: theme.dangerColor,
                    backgroundColor: `color-mix(in srgb, ${theme.dangerColor} 10%, transparent)`,
                    borderColor: `color-mix(in srgb, ${theme.dangerColor} 24%, ${theme.borderColor})`,
                  }}
                  transition={{ delay: 0.1, type: 'spring' }}
                >
                  <AlertTriangle className="h-5 w-5" strokeWidth={1.8} />
                </motion.div>
                <div className="min-w-0">
                  <h2
                    className="truncate font-display text-[1.65rem] leading-none tracking-[-0.025em]"
                    style={{ color: theme.textColor }}
                  >
                    {t('users.modals.delete.title')}
                  </h2>
                  <p
                    className="mt-1.5 font-ui text-xs"
                    style={{ color: theme.mutedTextColor }}
                  >
                    {t('users.modals.delete.subtitle')}
                  </p>
                </div>
              </div>
              <motion.button
                aria-label={t('common.close', 'Cerrar')}
                className="rounded-[0.8rem] border p-2.5 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
                onClick={onClose}
                style={{
                  color: theme.mutedTextColor,
                  backgroundColor: theme.inputBg,
                  borderColor: theme.borderColor,
                }}
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.94 }}
              >
                <X className="h-4 w-4" strokeWidth={1.8} />
              </motion.button>
            </div>
          </header>

          <div className="space-y-5 p-6">
            <AnimatePresence>
              {error ? (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[0.95rem] border p-4"
                  exit={{ opacity: 0, y: -8 }}
                  initial={{ opacity: 0, y: -8 }}
                  style={{
                    color: theme.dangerColor,
                    backgroundColor: `color-mix(in srgb, ${theme.dangerColor} 8%, ${theme.inputBg})`,
                    borderColor: `color-mix(in srgb, ${theme.dangerColor} 22%, ${theme.borderColor})`,
                  }}
                >
                  <span className="font-ui text-sm">{error}</span>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-[1rem] border p-5"
              initial={{ opacity: 0, scale: 0.97 }}
              style={{
                backgroundColor: `color-mix(in srgb, ${theme.dangerColor} 5%, ${theme.inputBg})`,
                borderColor: `color-mix(in srgb, ${theme.dangerColor} 20%, ${theme.borderColor})`,
              }}
            >
              <p
                className="mb-2 font-ui text-sm leading-relaxed"
                style={{ color: theme.textColor }}
              >
                <Trans
                  components={{
                    1: (
                      <span
                        className="font-ui font-semibold"
                        style={{ color: theme.dangerColor }}
                      />
                    ),
                  }}
                  i18nKey="users.modals.delete.confirmQuestion"
                  t={t}
                  values={{ name: displayName }}
                />
              </p>
              <p
                className="font-ui text-xs leading-relaxed"
                style={{ color: theme.mutedTextColor }}
              >
                {t('users.modals.delete.warning')}
              </p>
            </motion.div>

            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[1rem] border p-5"
              initial={{ opacity: 0, y: 8 }}
              style={{
                backgroundColor: theme.inputBg,
                borderColor: theme.borderColor,
              }}
            >
              <div className="space-y-4">
                <div>
                  <p
                    className="mb-1.5 font-label text-[0.62rem] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: theme.mutedTextColor }}
                  >
                    {t('users.modals.delete.fields.email')}
                  </p>
                  <p
                    className="break-all font-ui text-sm font-medium"
                    style={{ color: theme.textColor }}
                  >
                    {user.email}
                  </p>
                </div>
                <div>
                  <p
                    className="mb-1.5 font-label text-[0.62rem] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: theme.mutedTextColor }}
                  >
                    {t('users.modals.delete.fields.role')}
                  </p>
                  <p
                    className="font-ui text-sm font-medium capitalize"
                    style={{ color: theme.textColor }}
                  >
                    {user.org_role === 'owner'
                      ? t('users.roles.owner')
                      : user.org_role === 'admin'
                        ? t('users.roles.admin')
                        : t('users.roles.member')}
                  </p>
                </div>
              </div>
            </motion.div>

            <div
              className="flex items-center justify-end gap-3 border-t pt-4"
              style={{ borderColor: theme.borderColor }}
            >
              <motion.button
                className="min-h-11 rounded-[0.85rem] border px-5 font-ui text-xs font-semibold transition-all disabled:opacity-50"
                disabled={isLoading}
                onClick={onClose}
                style={{
                  color: theme.textColor,
                  backgroundColor: theme.inputBg,
                  borderColor: theme.borderColor,
                }}
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                {t('users.buttons.cancel')}
              </motion.button>
              <motion.button
                className="min-h-11 rounded-[0.85rem] border px-5 font-ui text-xs font-semibold text-white shadow-[0_12px_28px_-14px_rgba(239,68,68,0.8)] transition-all disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
                onClick={handleConfirm}
                style={{
                  backgroundColor: theme.dangerColor,
                  borderColor: theme.dangerColor,
                }}
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {t('users.buttons.deleting')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                    {t('users.buttons.delete')}
                  </span>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
