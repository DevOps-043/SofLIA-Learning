'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Award, MessageSquare, ShieldCheck, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

interface AdminDeleteCompanyModalProps {
  companyName: string
  isOpen: boolean
  isDeleting: boolean
  error: string | null
  onClose: () => void
  onConfirm: (confirmText: string) => Promise<void> | void
}

export function AdminDeleteCompanyModal({
  companyName,
  isOpen,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: AdminDeleteCompanyModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const theme = useAdminPanelTheme()

  if (!isOpen) return null

  const isNameMatched = confirmText.trim() === companyName.trim()
  const affectedItems = [
    { label: t('companies.deleteModal.courses'), icon: ShieldCheck },
    { label: t('companies.deleteModal.certificates'), icon: Award },
    { label: t('companies.deleteModal.hierarchy'), icon: MessageSquare },
  ]

  const handleClose = () => {
    if (isDeleting) return
    setConfirmText('')
    onClose()
  }

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <motion.button
          type="button"
          aria-label={tc('actions.close')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 cursor-default backdrop-blur-xl"
          style={{ backgroundColor: theme.overlayBg }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-md overflow-hidden rounded-[28px] border shadow-2xl"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: `color-mix(in srgb, ${theme.dangerColor} 18.8%, transparent)`,
          }}
        >
          <div
            className="border-b p-6"
            style={{
              background: `linear-gradient(135deg, ${theme.inputBg}, ${theme.cardBg})`,
              borderColor: theme.borderColor,
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${theme.dangerColor} 7.1%, transparent)`,
                    borderColor: `color-mix(in srgb, ${theme.dangerColor} 14.9%, transparent)`,
                    color: theme.dangerColor,
                  }}
                >
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold tracking-tight" style={{ color: theme.textColor }}>
                    {t('companies.deleteModal.title')}
                  </h2>
                  <p className="mt-1 truncate text-sm font-medium" style={{ color: theme.subtextColor }}>
                    {companyName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isDeleting}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.borderColor,
                  color: theme.mutedTextColor,
                }}
                aria-label={tc('actions.close')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <AnimatePresence>
              {error ? (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-2xl border p-4 text-sm font-semibold"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${theme.dangerColor} 7.1%, transparent)`,
                    borderColor: `color-mix(in srgb, ${theme.dangerColor} 14.9%, transparent)`,
                    color: theme.dangerColor,
                  }}
                >
                  {error}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div
              className="rounded-[22px] border p-4"
              style={{
                backgroundColor: `color-mix(in srgb, ${theme.dangerColor} 3.1%, transparent)`,
                borderColor: `color-mix(in srgb, ${theme.dangerColor} 13.3%, transparent)`,
              }}
            >
              <p className="text-sm leading-relaxed" style={{ color: theme.subtextColor }}>
                {t('companies.deleteModal.irreversible')}
              </p>
              <p className="mt-2 text-sm font-semibold leading-relaxed" style={{ color: theme.textColor }}>
                {t('companies.deleteModal.membersPreserved')}
              </p>
            </div>

            <div
              className="rounded-[22px] border p-4"
              style={{
                backgroundColor: `color-mix(in srgb, ${theme.warningColor} 6.3%, transparent)`,
                borderColor: `color-mix(in srgb, ${theme.warningColor} 14.1%, transparent)`,
              }}
            >
              <p className="text-xs font-extrabold uppercase tracking-wider" style={{ color: theme.warningColor }}>
                {t('companies.deleteModal.alsoDeleted')}
              </p>
              <div className="mt-3 space-y-2">
                {affectedItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="flex items-center gap-2 text-sm font-semibold" style={{ color: theme.subtextColor }}>
                      <Icon className="h-4 w-4 shrink-0" style={{ color: theme.warningColor }} />
                      <span>{item.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold" style={{ color: theme.textColor }}>
                {t('companies.deleteModal.confirmLabel', { name: companyName })}
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                placeholder={t('companies.deleteModal.confirmPlaceholder')}
                disabled={isDeleting}
                className="w-full rounded-xl border px-4 py-2.5 text-sm font-medium outline-none transition-colors"
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.borderColor,
                  color: theme.textColor,
                }}
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end" style={{ borderColor: theme.borderColor }}>
              <button
                type="button"
                onClick={handleClose}
                disabled={isDeleting}
                className="inline-flex h-11 items-center justify-center rounded-2xl border px-5 text-sm font-bold transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.borderColor,
                  color: theme.textColor,
                }}
              >
                {tc('actions.cancel')}
              </button>
              <button
                type="button"
                onClick={() => void onConfirm(confirmText.trim())}
                disabled={isDeleting || !isNameMatched}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor: theme.dangerColor,
                  color: 'white',
                  boxShadow: `0 12px 28px color-mix(in srgb, ${theme.dangerColor} 18.8%, transparent)`,
                }}
              >
                {isDeleting ? (
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-transparent"
                    style={{ borderTopColor: 'currentColor', borderRightColor: 'currentColor' }}
                  />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {isDeleting ? tc('actions.deleting') : t('companies.deleteModal.confirmButton')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  )
}
