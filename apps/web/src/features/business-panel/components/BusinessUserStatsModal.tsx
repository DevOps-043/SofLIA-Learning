'use client'

import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BarChart3, ChevronRight, Download, FileText, Loader2, Mail, Sparkles, User, X } from 'lucide-react'
import Image from 'next/image'
import { useOrganizationStore } from '@/core/stores/organizationStore'
import { useForensicReport } from '@/features/admin/components/admin-users/master-panel/hooks/useForensicReport'
import type { BusinessUser } from '../services/businessUsers.service'
import { useBusinessUserStatsModalLogic } from '../hooks/useBusinessUserStatsModalLogic'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { BusinessUserAnalyticsPageClient } from './business-user-analytics/BusinessUserAnalyticsPageClient'
import type {
  BusinessUserAnalyticsInsights,
  BusinessUserAnalyticsResponse,
} from '../types/business-user-analytics.types'
import { useLanguage } from '@/core/providers/I18nProvider'
import type { ToastType } from '@/core/components/ToastNotification/ToastNotification'

interface BusinessUserStatsModalProps {
  user:             BusinessUser | null
  isOpen:           boolean
  onClose:          () => void
  orgSlug?:         string
  /** Id of the currently logged-in viewer, used to detect an admin viewing their own row. */
  viewerUserId?:    string
  onNotifyFeedback?: (message: string, type: ToastType) => void
}

export function BusinessUserStatsModal({
  user,
  isOpen,
  onClose,
  orgSlug,
  viewerUserId,
  onNotifyFeedback,
}: BusinessUserStatsModalProps) {
  const panelTheme       = useBusinessPanelTheme()
  const organizationName = useOrganizationStore((s) => s.currentOrganization?.name) ?? null
  const { language }     = useLanguage()

  const { t, isDark, primaryColor, accentColor, displayName } =
    useBusinessUserStatsModalLogic({ user, onClose })

  const [analyticsData,    setAnalyticsData]    = useState<BusinessUserAnalyticsResponse | null>(null)
  const [analyticsInsights, setAnalyticsInsights] = useState<BusinessUserAnalyticsInsights | null>(null)
  const [isPdfExporting,   setIsPdfExporting]   = useState(false)

  const handleExportPdf = useCallback(async () => {
    if (!analyticsData) return
    setIsPdfExporting(true)
    try {
      const { generateUserStatsPdf } = await import(
        '../services/business-user-analytics/pdf/generate-user-stats-pdf'
      )
      const blob = await generateUserStatsPdf(analyticsData, {
        userLabel:         displayName,
        organizationLabel: organizationName,
        locale:            (language as 'es' | 'en' | 'pt') ?? 'es',
        insights:          analyticsInsights,
      })
      const url = URL.createObjectURL(blob)
      const a   = document.createElement('a')
      a.href     = url
      a.download = `estadisticas-${displayName.toLowerCase().replace(/\s+/g, '-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // PDF generation is non-critical; ignore failures silently
    } finally {
      setIsPdfExporting(false)
    }
  }, [analyticsData, analyticsInsights, displayName, language, organizationName])

  // Dictamen forense (auditoría con SofLIA) — usa la ruta org-autorizada del panel de
  // organización. El botón solo aparece si hay orgSlug (contexto de organización).
  const forensicReport = useForensicReport(
    user?.id ?? '',
    displayName,
    user?.email ?? null,
    orgSlug && user ? `/api/${orgSlug}/business/users/${user.id}/forensics/analysis` : undefined,
  )

  if (!isOpen || !user) return null

  const modalBg     = panelTheme.panelBg
  const modalBorder = panelTheme.borderColor
  const inputBg     = panelTheme.inputBg
  const mutedText   = panelTheme.mutedTextColor

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 isolate flex h-app-dynamic items-center justify-center overflow-hidden p-0 sm:p-4"
        style={{ zIndex: 99999 }}
      >
        {/* Backdrop */}
        <motion.div
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-transparent"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative flex h-full w-full max-w-[1500px] flex-col overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] sm:h-[min(calc(var(--soflia-viewport-height)-2rem),900px)] sm:max-h-[900px] sm:rounded-[2.5rem]"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="flex h-full flex-col overflow-hidden border"
            style={{ backgroundColor: modalBg, borderColor: modalBorder }}
          >
            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div className="relative shrink-0 border-b border-white/5 px-6 pb-4 pt-6 sm:px-12 sm:pb-6 sm:pt-8">
              <div className="relative z-10 flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] border-2 shadow-2xl sm:h-20 sm:w-20 sm:rounded-[2rem] sm:border-4"
                    style={{
                      background:   user.profile_picture_url
                        ? 'transparent'
                        : `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                      borderColor:  isDark ? 'rgba(255,255,255,0.05)' : 'var(--color-bg-light)',
                    }}
                  >
                    {user.profile_picture_url ? (
                      <Image
                        src={user.profile_picture_url}
                        alt={displayName}
                        fill
                        className="rounded-[1.5rem] object-cover sm:rounded-[2rem]"
                      />
                    ) : (
                      <User className="h-8 w-8 text-white sm:h-10 sm:w-10" strokeWidth={2.5} />
                    )}
                  </div>
                </div>

                {/* Name + badges */}
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <h2
                    className="mb-1 truncate text-xl font-black tracking-tight sm:text-2xl"
                    style={{ color: panelTheme.textColor }}
                  >
                    {displayName}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <div
                      className="inline-flex items-center gap-2 rounded-xl border px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                      style={{ backgroundColor: inputBg, borderColor: modalBorder, color: mutedText }}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span className="max-w-[150px] truncate sm:max-w-none">{user.email}</span>
                    </div>
                    <div
                      className="inline-flex items-center gap-2 rounded-xl border px-3 py-1 text-[10px] font-black uppercase tracking-widest capitalize"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${primaryColor} 8%, transparent)`,
                        borderColor:     `color-mix(in srgb, ${primaryColor} 12%, transparent)`,
                        color:           primaryColor,
                      }}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {user.org_role}
                    </div>
                  </div>
                </div>

                {/* Close */}
                <button
                  onClick={onClose}
                  className="shrink-0 rounded-2xl border p-3 transition-all"
                  style={{ backgroundColor: inputBg, borderColor: modalBorder, color: mutedText }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* ── Content ─────────────────────────────────────────────────────── */}
            <div className="relative flex-1 overflow-hidden">
              <div
                className="h-full overflow-y-auto px-6 pb-28 pt-6 sm:px-12 sm:pb-32"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.05) transparent' }}
              >
                <div className="mx-auto w-full max-w-[1400px]">
                  <BusinessUserAnalyticsPageClient
                    embedded
                    orgSlug={orgSlug}
                    showBackButton={false}
                    userId={user.id}
                    pdfExport={{ userLabel: displayName, organizationLabel: organizationName }}
                    onAnalyticsLoaded={setAnalyticsData}
                    onInsightsLoaded={setAnalyticsInsights}
                    viewerUserId={viewerUserId}
                    goalActionMode="reminder"
                    onNotifyFeedback={onNotifyFeedback}
                  />
                </div>
              </div>

              {/* ── Footer ──────────────────────────────────────────────────────── */}
              <div
                className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-4 border-t p-5 px-8"
                style={{ backgroundColor: modalBg, borderColor: modalBorder }}
              >
                <div className="hidden select-none items-center gap-3 opacity-30 sm:flex">
                  <BarChart3 className="h-5 w-5" style={{ color: panelTheme.textColor }} />
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: panelTheme.textColor }}>
                    Panel de Analítica
                  </span>
                </div>

                <div className="flex w-full items-center gap-3 sm:w-auto">
                  <button
                    onClick={onClose}
                    className="flex-1 rounded-2xl border px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all sm:flex-none"
                    style={{ color: mutedText, backgroundColor: inputBg, borderColor: modalBorder }}
                  >
                    {t('common.close', 'Cerrar')}
                  </button>
                  <button
                    onClick={() => void handleExportPdf()}
                    disabled={!analyticsData || isPdfExporting}
                    className="flex items-center justify-center gap-2 rounded-2xl border px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                    style={{ color: mutedText, backgroundColor: inputBg, borderColor: modalBorder }}
                  >
                    {isPdfExporting
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Download className="h-4 w-4" />
                    }
                    PDF
                  </button>
                  {orgSlug ? (
                    <button
                      onClick={() => void forensicReport.generate()}
                      disabled={forensicReport.isGenerating}
                      className="flex items-center justify-center gap-2 rounded-2xl border px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                      style={{ color: mutedText, backgroundColor: inputBg, borderColor: modalBorder }}
                      title={t('common.forensicReport', 'Dictamen forense (PDF)')}
                    >
                      {forensicReport.isGenerating
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <FileText className="h-4 w-4" />
                      }
                      {t('common.forensicReportShort', 'Dictamen')}
                    </button>
                  ) : null}
                  <button
                    onClick={onClose}
                    className="flex flex-[2] items-center justify-center gap-3 rounded-2xl px-10 py-4 text-[10px] font-black uppercase tracking-widest shadow-2xl sm:flex-none"
                    style={{ backgroundColor: primaryColor, color: panelTheme.onPrimaryColor }}
                  >
                    {t('common.done', 'Finalizar')}
                    <ChevronRight className="h-4 w-4" strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
