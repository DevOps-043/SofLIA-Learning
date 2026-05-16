'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  AlertTriangle,
  FileText,
  MessageCircle,
  Shield,
  Trash2,
  UserPlus,
  Users,
  Video,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../hooks/useAdminPanelTheme'
import type { AdminCommunity } from '../services/adminCommunities.service'
import { getAdminCommunityStatusConfig } from './admin-communities'

interface DeleteCommunityModalProps {
  community: AdminCommunity | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function DeleteCommunityModal({
  community,
  isOpen,
  onClose,
  onConfirm,
}: DeleteCommunityModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const theme = useAdminPanelTheme()

  const handleConfirm = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('generic.errorDeleting'))
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen || !community) return null

  const statusConfig = getAdminCommunityStatusConfig(community.is_active, theme)
  const dataItems = [
    {
      icon: Users,
      label: t('communities.deleteModal.data.members'),
      value: community.member_count || 0,
    },
    {
      icon: FileText,
      label: t('communities.deleteModal.data.posts'),
      value: community.posts_count || 0,
    },
    {
      icon: MessageCircle,
      label: t('communities.deleteModal.data.comments'),
      value: community.comments_count || 0,
    },
    {
      icon: Video,
      label: t('communities.deleteModal.data.videos'),
      value: community.videos_count || 0,
    },
    {
      icon: UserPlus,
      label: t('communities.deleteModal.data.requests'),
      value: community.access_requests_count || 0,
    },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 backdrop-blur-sm"
              style={{ backgroundColor: theme.overlayBg }}
              onClick={onClose}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl border shadow-2xl"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.borderColor,
              }}
            >
              <div
                className="relative border-b p-6"
                style={{
                  background: `linear-gradient(135deg, ${theme.dangerColor}, ${theme.warningColor})`,
                  borderColor: `${theme.dangerColor}33`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="rounded-2xl p-3"
                      style={{ backgroundColor: theme.inverseSurface }}
                    >
                      <AlertTriangle
                        className="h-6 w-6"
                        style={{ color: theme.inverseTextColor }}
                      />
                    </div>
                    <div>
                      <h2
                        className="text-2xl font-bold"
                        style={{ color: theme.inverseTextColor }}
                      >
                        {t('communities.deleteModal.title')}
                      </h2>
                      <p
                        className="mt-0.5 text-sm"
                        style={{ color: theme.inverseSubtextColor }}
                      >
                        {t('generic.irreversible')}
                      </p>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="rounded-xl p-2.5 transition-colors"
                    style={{ color: theme.inverseSubtextColor }}
                    type="button"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>

              <div className="space-y-5 p-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-xl border p-4"
                    style={{
                      backgroundColor: `${theme.dangerColor}14`,
                      borderColor: `${theme.dangerColor}26`,
                    }}
                  >
                    <AlertCircle
                      className="h-5 w-5"
                      style={{ color: theme.dangerColor }}
                    />
                    <p className="text-sm" style={{ color: theme.dangerColor }}>
                      {error}
                    </p>
                  </motion.div>
                )}

                <div
                  className="rounded-2xl border p-5"
                  style={{
                    backgroundColor: `${theme.dangerColor}14`,
                    borderColor: `${theme.dangerColor}26`,
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="mt-0.5 rounded-xl p-2.5"
                      style={{ backgroundColor: `${theme.dangerColor}20` }}
                    >
                      <AlertTriangle
                        className="h-5 w-5"
                        style={{ color: theme.dangerColor }}
                      />
                    </div>
                    <div>
                      <h4
                        className="mb-2 text-lg font-semibold"
                        style={{ color: theme.dangerColor }}
                      >
                        {t('communities.deleteModal.confirmText')}
                      </h4>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: theme.subtextColor }}
                      >
                        {t('generic.irreversible')}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-2xl border p-5"
                  style={{
                    backgroundColor: theme.inputBg,
                    borderColor: theme.borderColor,
                  }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className="rounded-lg p-2"
                      style={{ backgroundColor: theme.actionSurface }}
                    >
                      <Users className="h-4 w-4" style={{ color: theme.primaryColor }} />
                    </div>
                    <h5
                      className="text-sm font-semibold"
                      style={{ color: theme.textColor }}
                    >
                      {t('communities.deleteModal.communityInfo')}
                    </h5>
                  </div>

                  <div className="space-y-3 text-sm">
                    {[
                      {
                        label: t('communities.deleteModal.fields.name'),
                        value: community.name,
                      },
                      {
                        label: t('communities.deleteModal.fields.description'),
                        value: community.description,
                      },
                      {
                        label: t('communities.deleteModal.fields.visibility'),
                        value: community.visibility,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-start justify-between gap-4 border-b py-2 last:border-b-0"
                        style={{ borderColor: theme.dividerColor }}
                      >
                        <span style={{ color: theme.subtextColor }}>
                          {item.label}
                        </span>
                        <span
                          className="max-w-[280px] text-right font-medium"
                          style={{ color: theme.textColor }}
                        >
                          {item.value}
                        </span>
                      </div>
                    ))}
                    <div
                      className="flex items-center justify-between gap-4 pt-1"
                    >
                      <span style={{ color: theme.subtextColor }}>
                        {t('communities.deleteModal.fields.status')}
                      </span>
                      <span
                        className="rounded-full border px-2.5 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: statusConfig.bg,
                          borderColor: statusConfig.border,
                          color: statusConfig.color,
                        }}
                      >
                        {t(statusConfig.labelKey)}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-2xl border p-5"
                  style={{
                    backgroundColor: `${theme.warningColor}14`,
                    borderColor: `${theme.warningColor}26`,
                  }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className="rounded-lg p-2"
                      style={{ backgroundColor: `${theme.warningColor}20` }}
                    >
                      <Shield className="h-4 w-4" style={{ color: theme.warningColor }} />
                    </div>
                    <h5
                      className="text-sm font-semibold"
                      style={{ color: theme.warningColor }}
                    >
                      {t('communities.deleteModal.dataTitle')}
                    </h5>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {dataItems.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-2.5 rounded-xl p-3"
                        style={{ backgroundColor: `${theme.warningColor}10` }}
                      >
                        <item.icon
                          className="h-4 w-4"
                          style={{ color: theme.warningColor }}
                        />
                        <div>
                          <p
                            className="text-lg font-bold"
                            style={{ color: theme.textColor }}
                          >
                            {item.value}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: theme.subtextColor }}
                          >
                            {item.label}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="flex items-start gap-3 rounded-xl border p-4"
                  style={{
                    backgroundColor: theme.actionSurface,
                    borderColor: theme.heroBorderColor,
                  }}
                >
                  <div
                    className="rounded-lg p-2"
                    style={{ backgroundColor: theme.actionSurface }}
                  >
                    <Shield className="h-5 w-5" style={{ color: theme.primaryColor }} />
                  </div>
                  <div>
                    <h5
                      className="text-sm font-semibold"
                      style={{ color: theme.primaryColor }}
                    >
                      {t('communities.deleteModal.auditTitle')}
                    </h5>
                    <p
                      className="mt-1 text-xs leading-relaxed"
                      style={{ color: theme.subtextColor }}
                    >
                      {t('communities.deleteModal.auditDescription')}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="flex justify-end gap-3 border-t p-6"
                style={{ borderColor: theme.borderColor }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onClose}
                  disabled={isDeleting}
                  className="rounded-xl border px-6 py-3 font-medium transition-all disabled:opacity-60"
                  style={{
                    backgroundColor: theme.inputBg,
                    borderColor: theme.borderColor,
                    color: theme.subtextColor,
                  }}
                >
                  {tc('actions.cancel')}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleConfirm}
                  disabled={isDeleting}
                  className="flex items-center gap-2 rounded-xl px-6 py-3 font-semibold shadow-lg disabled:opacity-50"
                  style={{
                    backgroundColor: theme.dangerColor,
                    color: theme.inverseTextColor,
                  }}
                >
                  {isDeleting ? (
                    <>
                      <span
                        className="h-5 w-5 animate-spin rounded-full border-2"
                        style={{
                          borderColor: theme.inverseBorderColor,
                          borderTopColor: theme.inverseTextColor,
                        }}
                      />
                      <span>{tc('actions.deleting')}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-5 w-5" />
                      <span>{tc('actions.delete')}</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
