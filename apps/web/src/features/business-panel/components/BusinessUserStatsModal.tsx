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
  BusinessUserAnalyticsRange,
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

  const [analyticsData,  setAnalyticsData]  = useState<BusinessUserAnalyticsResponse | null>(null)
  // El rango lo controla el panel embebido y define el ámbito del informe diario.
  const [analyticsRange, setAnalyticsRange] = useState<BusinessUserAnalyticsRange>('365d')
  const [isPdfExporting, setIsPdfExporting] = useState(false)

  // El informe lo genera el servidor, que guarda uno por día y devuelve el ya
  // generado si vuelven a pedirlo la misma jornada; así una segunda descarga no
  // vuelve a gastar análisis de SofLIA.
  const handleExportPdf = useCallback(async () => {
    if (!analyticsData || !user || !orgSlug) return
    setIsPdfExporting(true)
    try {
      const { downloadUserStatsPdf } = await import(
        '../services/business-user-analytics/download-user-stats-pdf'
      )
      await downloadUserStatsPdf({
        orgSlug,
        userId: user.id,
        range: analyticsRange,
        locale: (language as 'es' | 'en' | 'pt') ?? 'es',
      })
    } catch {
      // PDF generation is non-critical; ignore failures silently
    } finally {
      setIsPdfExporting(false)
    }
  }, [analyticsData, analyticsRange, language, orgSlug, user])

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
          className="absolute inset-0"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
          style={{
            backgroundColor: panelTheme.overlayBg,
            backdropFilter: 'blur(16px) saturate(112%)',
          }}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative flex h-full w-full max-w-[76rem] flex-col overflow-hidden shadow-[0_32px_72px_-22px_rgba(2,12,23,0.55)] sm:h-[min(calc(var(--soflia-viewport-height)-3rem),820px)] sm:max-h-[820px] sm:rounded-[1.65rem]"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="flex h-full flex-col overflow-hidden border sm:rounded-[1.65rem]"
            style={{ backgroundColor: modalBg, borderColor: modalBorder }}
          >
            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div className="relative shrink-0 border-b border-white/5 px-5 py-4 sm:px-7">
              <div className="relative z-10 flex items-center gap-4">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-[1rem] border-2 shadow-xl"
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
                        className="rounded-[0.9rem] object-cover"
                      />
                    ) : (
                      <User className="h-7 w-7 text-white" strokeWidth={2} />
                    )}
                  </div>
                </div>

                {/* Name + badges */}
                <div className="min-w-0 flex-1 text-left">
                  <h2
                    className="mb-1 truncate font-display text-2xl tracking-[-0.025em]"
                    style={{ color: panelTheme.textColor }}
                  >
                    {displayName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
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
                  aria-label={t('common.close', 'Cerrar')}
                  onClick={onClose}
                  className="shrink-0 rounded-[0.85rem] border p-2.5 transition-all"
                  style={{ backgroundColor: inputBg, borderColor: modalBorder, color: mutedText }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* ── Content ─────────────────────────────────────────────────────── */}
            <div className="relative flex-1 overflow-hidden">
              <div
                className="h-full overflow-y-auto px-4 pb-24 pt-5 sm:px-7 sm:pb-28"
                style={{ scrollbarWidth: 'none' }}
              >
                <div className="mx-auto w-full max-w-[70rem]">
                  <BusinessUserAnalyticsPageClient
                    embedded
                    orgSlug={orgSlug}
                    showBackButton={false}
                    userId={user.id}
                    pdfExport={{ userLabel: displayName, organizationLabel: organizationName }}
                    onAnalyticsLoaded={setAnalyticsData}
                    onRangeChange={setAnalyticsRange}
                    viewerUserId={viewerUserId}
                    goalActionMode="reminder"
                    onNotifyFeedback={onNotifyFeedback}
                  />
                </div>
              </div>

              {/* ── Footer ──────────────────────────────────────────────────────── */}
              <div
                className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-4 border-t px-5 py-3.5 sm:px-7"
                style={{
                  backgroundColor: `color-mix(in srgb, ${modalBg} 94%, transparent)`,
                  borderColor: modalBorder,
                  backdropFilter: 'blur(18px) saturate(115%)',
                }}
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
