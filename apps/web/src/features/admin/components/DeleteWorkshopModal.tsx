'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Clock, Layers3, Trash2, UserRound, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../hooks/useAdminPanelTheme'
import { AdminWorkshop } from '../services/adminWorkshops.service'
import {
  formatWorkshopDuration,
  getAdminWorkshopCategoryConfig,
  getAdminWorkshopLevelConfig,
  getAdminWorkshopStatusConfig,
} from './admin-workshops/admin-workshops-display.service'

interface DeleteWorkshopModalProps {
  isOpen: boolean
  onClose: () => void
  workshop: AdminWorkshop | null
  onConfirm: () => Promise<void>
}

export function DeleteWorkshopModal({
  isOpen,
  onClose,
  workshop,
  onConfirm,
}: DeleteWorkshopModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const theme = useAdminPanelTheme()

  useEffect(() => {
    if (isOpen) {
      setDeleteError(null)
    }
  }, [isOpen, workshop?.id])

  const handleConfirm = async () => {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await onConfirm()
    } catch (error) {
      setDeleteError(
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : t('generic.errorDeleting'),
      )
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen || !workshop) return null

  const categoryConfig = getAdminWorkshopCategoryConfig(workshop.category, theme)
  const levelConfig = getAdminWorkshopLevelConfig(workshop.level, theme)
  const statusConfig = getAdminWorkshopStatusConfig(workshop.is_active, theme)
  const categoryLabel = tc(
    `common.categories.${workshop.category}`,
    workshop.category,
  )
  const levelLabel = levelConfig.labelKey
    ? t(levelConfig.labelKey)
    : levelConfig.fallbackLabel
  const statusLabel = statusConfig.labelKey
    ? t(statusConfig.labelKey)
    : statusConfig.fallbackLabel
  const details = [
    {
      label: t('workshops.editor.preview.stats.category'),
      value: categoryLabel,
      color: categoryConfig.color,
      bg: categoryConfig.bg,
      border: categoryConfig.border,
      icon: Layers3,
    },
    {
      label: t('workshops.editor.preview.stats.level'),
      value: levelLabel,
      color: levelConfig.color,
      bg: levelConfig.bg,
      border: levelConfig.border,
      icon: Layers3,
    },
    {
      label: t('workshops.editor.preview.stats.status'),
      value: statusLabel,
      color: statusConfig.color,
      bg: statusConfig.bg,
      border: statusConfig.border,
      icon: AlertTriangle,
    },
    {
      label: t('workshops.card.instructorLabel'),
      value: workshop.instructor_name || t('workshops.card.noInstructor'),
      color: theme.primaryColor,
      bg: theme.actionSurface,
      border: theme.heroBorderColor,
      icon: UserRound,
    },
    {
      label: t('workshops.editor.preview.stats.duration'),
      value: formatWorkshopDuration(workshop.duration_total_minutes),
      color: theme.subtextColor,
      bg: theme.inputBg,
      border: theme.borderColor,
      icon: Clock,
    },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 backdrop-blur-sm"
            style={{ backgroundColor: theme.overlayBg }}
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.borderColor,
                }}
                onClick={(event) => event.stopPropagation()}
              >
                <div
                  className="relative border-b px-6 py-4"
                  style={{
                    background: `linear-gradient(135deg, ${theme.dangerColor}, ${theme.dangerColor}D9)`,
                    borderColor: `${theme.dangerColor}33`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: theme.inverseSurface }}
                      >
                        <AlertTriangle
                          className="h-5 w-5"
                          style={{ color: theme.inverseTextColor }}
                        />
                      </div>
                      <div>
                        <h3
                          className="text-lg font-bold"
                          style={{ color: theme.inverseTextColor }}
                        >
                          {t('workshops.deleteModal.title')}
                        </h3>
                        <p
                          className="text-xs"
                          style={{ color: theme.inverseSubtextColor }}
                        >
                          {t('generic.irreversible')}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      onClick={onClose}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      className="rounded-lg p-2 transition-colors duration-200"
                      style={{ color: theme.inverseSubtextColor }}
                      type="button"
                    >
                      <X className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-6 flex items-start gap-4">
                    <div
                      className="flex-shrink-0 rounded-xl p-3"
                      style={{ backgroundColor: `${theme.dangerColor}14` }}
                    >
                      <AlertTriangle
                        className="h-8 w-8"
                        style={{ color: theme.dangerColor }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3
                        className="mb-2 text-lg font-semibold"
                        style={{ color: theme.textColor }}
                      >
                        {t('workshops.deleteModal.confirmText')}
                      </h3>
                      <p
                        className="text-sm"
                        style={{ color: theme.subtextColor }}
                      >
                        {t('generic.irreversible')}
                      </p>
                    </div>
                  </div>

                  <div
                    className="mb-4 rounded-2xl border p-4"
                    style={{
                      backgroundColor: theme.inputBg,
                      borderColor: theme.borderColor,
                    }}
                  >
                    <h4
                      className="mb-3 font-semibold"
                      style={{ color: theme.textColor }}
                    >
                      {workshop.title}
                    </h4>
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      {details.map((detail) => {
                        const Icon = detail.icon

                        return (
                          <div
                            key={detail.label}
                            className="rounded-xl border px-3 py-2"
                            style={{
                              backgroundColor: detail.bg,
                              borderColor: detail.border,
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Icon
                                className="h-4 w-4"
                                style={{ color: detail.color }}
                              />
                              <span
                                className="text-[11px] font-bold uppercase tracking-[0.18em]"
                                style={{ color: theme.mutedTextColor }}
                              >
                                {detail.label}
                              </span>
                            </div>
                            <p
                              className="mt-1 truncate font-semibold"
                              style={{ color: theme.textColor }}
                            >
                              {detail.value}
                            </p>
                          </div>
                        )
                      })}
                      {workshop.student_count > 0 ? (
                        <div
                          className="rounded-xl border px-3 py-2 sm:col-span-2"
                          style={{
                            backgroundColor: `${theme.warningColor}14`,
                            borderColor: `${theme.warningColor}26`,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <AlertTriangle
                              className="h-4 w-4"
                              style={{ color: theme.warningColor }}
                            />
                            <span
                              className="text-[11px] font-bold uppercase tracking-[0.18em]"
                              style={{ color: theme.mutedTextColor }}
                            >
                              {t('workshops.card.studentsLabel')}
                            </span>
                          </div>
                          <p
                            className="mt-1 font-semibold"
                            style={{ color: theme.textColor }}
                          >
                            {workshop.student_count}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {workshop.student_count > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 rounded-xl border p-4"
                      style={{
                        backgroundColor: `${theme.warningColor}14`,
                        borderColor: `${theme.warningColor}26`,
                      }}
                    >
                      <p
                        className="text-sm font-medium"
                        style={{ color: theme.warningColor }}
                      >
                        {t('workshops.deleteModal.enrolledWarning', {
                          count: workshop.student_count,
                        })}
                      </p>
                    </motion.div>
                  )}

                  {deleteError && (
                    <div
                      className="mb-4 rounded-xl border p-4"
                      style={{
                        backgroundColor: `${theme.dangerColor}14`,
                        borderColor: `${theme.dangerColor}26`,
                      }}
                    >
                      <p
                        className="text-sm"
                        style={{ color: theme.dangerColor }}
                      >
                        {deleteError}
                      </p>
                    </div>
                  )}

                  <div
                    className="flex items-center justify-end gap-3 border-t pt-4"
                    style={{ borderColor: theme.dividerColor }}
                  >
                    <motion.button
                      onClick={onClose}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isDeleting}
                      className="rounded-xl border px-6 py-2.5 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{
                        backgroundColor: theme.inputBg,
                        borderColor: theme.borderColor,
                        color: theme.subtextColor,
                      }}
                      type="button"
                    >
                      {tc('actions.cancel')}
                    </motion.button>
                    <motion.button
                      onClick={handleConfirm}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isDeleting}
                      className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold shadow-lg transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{
                        backgroundColor: theme.dangerColor,
                        color: theme.inverseTextColor,
                      }}
                      type="button"
                    >
                      {isDeleting ? (
                        <>
                          <div
                            className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
                            style={{
                              borderColor: theme.inverseBorderColor,
                              borderTopColor: theme.inverseTextColor,
                            }}
                          />
                          <span>{tc('actions.deleting')}</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          <span>{tc('actions.delete')}</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
