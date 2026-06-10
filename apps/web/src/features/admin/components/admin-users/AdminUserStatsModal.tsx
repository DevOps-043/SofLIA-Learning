'use client'

import { Fragment, useCallback, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Download, Loader2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/core/providers/I18nProvider'
import { BusinessUserAnalyticsPageClient } from '@/features/business-panel/components/business-user-analytics/BusinessUserAnalyticsPageClient'
import type {
  BusinessUserAnalyticsInsights,
  BusinessUserAnalyticsLocale,
  BusinessUserAnalyticsResponse,
} from '@/features/business-panel/types/business-user-analytics.types'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { generateUserStatsPdf } from '../../services/admin-user-analytics/generate-user-stats-pdf'
import type { AdminUser } from '../../services/adminUsers.service'
import { getAdminUserDisplayConfig } from './service'

interface AdminUserStatsModalProps {
  user: AdminUser
  isOpen: boolean
  onClose: () => void
  organizationLabel?: string | null
}

function normalizeLocale(language: string): BusinessUserAnalyticsLocale {
  return language === 'en' || language === 'pt' ? language : 'es'
}

function sanitizeFileSegment(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'usuario'
  )
}

export function AdminUserStatsModal({
  user,
  isOpen,
  onClose,
  organizationLabel,
}: AdminUserStatsModalProps) {
  const theme = useAdminPanelTheme()
  const { t } = useTranslation('admin')
  const { language } = useLanguage()
  const { displayName } = getAdminUserDisplayConfig(user)

  const [analytics, setAnalytics] = useState<BusinessUserAnalyticsResponse | null>(null)
  const [insights, setInsights] = useState<BusinessUserAnalyticsInsights | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const handleExport = useCallback(async () => {
    if (!analytics) return
    setIsExporting(true)
    setExportError(null)
    try {
      const blob = await generateUserStatsPdf(analytics, {
        userLabel: displayName,
        organizationLabel,
        locale: normalizeLocale(language),
        insights,
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `estadisticas-${sanitizeFileSegment(user.username || displayName)}-${
        new Date().toISOString().split('T')[0]
      }.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch {
      setExportError(t('users.stats.exportError'))
    } finally {
      setIsExporting(false)
    }
  }, [analytics, displayName, insights, language, organizationLabel, t, user.username])

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 backdrop-blur-sm" style={{ backgroundColor: theme.overlayBg }} />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className="flex max-h-[92vh] w-full max-w-[1400px] transform flex-col overflow-hidden rounded-[28px] border shadow-2xl transition-all"
                style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
              >
                <div
                  className="flex flex-shrink-0 items-center justify-between gap-3 border-b px-6 py-4"
                  style={{ borderColor: theme.borderColor }}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.subtextColor }}>
                      {t('users.stats.modalEyebrow')}
                    </p>
                    <h2 className="truncate text-lg font-bold" style={{ color: theme.textColor }}>
                      {t('users.stats.modalTitle', { name: displayName })}
                    </h2>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleExport()}
                      disabled={!analytics || isExporting}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ backgroundColor: theme.primaryColor, color: theme.onPrimaryColor }}
                    >
                      {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      {isExporting ? t('users.stats.exporting') : t('users.stats.exportPdf')}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label={t('users.stats.close')}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition-all"
                      style={{
                        backgroundColor: theme.inputBg,
                        borderColor: theme.borderColor,
                        color: theme.textColor,
                      }}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {exportError ? (
                  <div
                    className="flex-shrink-0 px-6 py-2 text-sm"
                    style={{ color: theme.dangerColor }}
                  >
                    {exportError}
                  </div>
                ) : null}

                <div className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
                  <BusinessUserAnalyticsPageClient
                    embedded
                    showBackButton={false}
                    apiBasePath={`/api/admin/users/${user.id}/analytics`}
                    onAnalyticsLoaded={setAnalytics}
                    onInsightsLoaded={setInsights}
                  />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
