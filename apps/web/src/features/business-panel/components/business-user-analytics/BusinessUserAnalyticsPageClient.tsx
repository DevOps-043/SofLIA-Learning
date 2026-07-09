'use client'

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, Loader2, RefreshCw } from 'lucide-react'
import useSWR from 'swr'

import type { ToastType } from '@/core/components/ToastNotification/ToastNotification'
import type {
  BusinessUserAnalyticsInsights,
  BusinessUserAnalyticsInsightsResponse,
  BusinessUserAnalyticsRange,
  BusinessUserAnalyticsResponse,
} from '@/features/business-panel/types/business-user-analytics.types'
import { useOrganizationStore } from '@/core/stores/organizationStore'
import { useLanguage } from '@/core/providers/I18nProvider'
import {
  resolveBusinessPanelActionColor,
  useBusinessPanelTheme,
} from '../../hooks/useBusinessPanelTheme'
import { OrgNavbar } from '@/core/components/OrgNavbar/OrgNavbar'

import { DashboardSkeleton } from './shared/DashboardSkeleton'
import { OverviewKPIs }       from './sections/OverviewKPIs'
import { CourseProgressBars } from './sections/CourseProgressBars'
import { LearningTrendChart } from './sections/LearningTrendChart'
import { PerformanceCards }   from './sections/PerformanceCards'
import { QualityRadarChart }  from './sections/QualityRadarChart'
import { NextGoals }          from './sections/NextGoals'
import { AiInsightsCard, type InsightState } from './sections/AiInsightsCard'

export interface BusinessUserAnalyticsPageClientProps {
  embedded?:          boolean
  orgSlug?:           string
  showBackButton?:    boolean
  userId?:            string
  onBack?:            () => void
  apiBasePath?:       string
  organizationId?:    string
  pdfExport?:         { userLabel: string; organizationLabel?: string | null }
  onAnalyticsLoaded?: (data: BusinessUserAnalyticsResponse) => void
  onInsightsLoaded?:  (insights: BusinessUserAnalyticsInsights) => void
  /** When true, renders only OverviewKPIs + PerformanceCards (no charts, no AI insights) */
  compactMode?:       boolean
  /** Id of the currently logged-in viewer. Used to detect when a Business admin is
   *  looking at their own row (vs. another employee's) inside the stats modal. */
  viewerUserId?:      string
  /** Controls whether next-goal CTAs navigate as the learner or send admin reminders. */
  goalActionMode?:    'personal' | 'reminder'
  onNotifyFeedback?:  (message: string, type: ToastType) => void
}

const DEFAULT_RANGE: BusinessUserAnalyticsRange = '365d'

export function BusinessUserAnalyticsPageClient({
  embedded       = false,
  orgSlug:       explicitOrgSlug,
  showBackButton = true,
  userId,
  onBack,
  apiBasePath,
  organizationId,
  pdfExport,
  onAnalyticsLoaded,
  onInsightsLoaded,
  compactMode    = false,
  viewerUserId,
  goalActionMode = 'personal',
  onNotifyFeedback,
}: BusinessUserAnalyticsPageClientProps = {}) {
  const router  = useRouter()
  const params  = useParams()
  const orgSlug = explicitOrgSlug || (params?.orgSlug as string | undefined) || ''
  const { language } = useLanguage()

  // In personal action mode, no target userId means the viewer is on their own
  // analytics page. Admin embeds can force reminder mode even for a matching row.
  const isOwnProfile = goalActionMode === 'personal' && (!userId || userId === viewerUserId)

  const theme = useBusinessPanelTheme()
  // Raw org brand colors from the server-side layout — always present regardless of
  // whether `brandingEnabled` is true. We use these for interactive elements (buttons,
  // chart lines, progress bars) so they reflect the org's identity even when the full
  // panel branding theme is not enabled. Surface colors (background, cards, borders)
  // still come from useBusinessPanelTheme() which respects the panel theme config.
  const orgBrandPrimary = useOrganizationStore((s) => s.currentOrganization?.brandColorPrimary ?? null)
  const orgBrandAccent  = useOrganizationStore((s) => s.currentOrganization?.brandColorAccent  ?? null)

  const [range, setRange]       = useState<BusinessUserAnalyticsRange>(DEFAULT_RANGE)
  const [insightState, setInsightState] = useState<InsightState>('idle')
  const [insights,     setInsights]     = useState<BusinessUserAnalyticsInsights | null>(null)
  const [insightError, setInsightError] = useState<string | null>(null)
  const [isPdfExporting, setIsPdfExporting] = useState(false)

  // ── URL builders ────────────────────────────────────────────────────────────

  const analyticsUrl = useMemo<string | null>(() => {
    const orgParam = organizationId ? `&organizationId=${encodeURIComponent(organizationId)}` : ''

    if (apiBasePath) return `${apiBasePath}?range=${range}${orgParam}`
    if (!orgSlug)    return null

    const base = userId
      ? `/api/${orgSlug}/business/users/${userId}/analytics`
      : `/api/${orgSlug}/business-user/analytics`

    return `${base}?range=${range}`
  }, [apiBasePath, orgSlug, organizationId, range, userId])

  const insightsUrl = useMemo<string | null>(() => {
    if (apiBasePath) return `${apiBasePath}/insights`
    if (!orgSlug)    return null

    return userId
      ? `/api/${orgSlug}/business/users/${userId}/analytics/insights`
      : `/api/${orgSlug}/business-user/analytics/insights`
  }, [apiBasePath, orgSlug, userId])

  // ── Main data — SWR caches by URL so range switches are instant on revisit ──

  const {
    data,
    isLoading,
    error: fetchError,
    mutate,
  } = useSWR<BusinessUserAnalyticsResponse>(
    analyticsUrl,
    async (url: string) => {
      const res  = await fetch(url, { credentials: 'include' })
      const json = (await res.json()) as BusinessUserAnalyticsResponse
      // The API envelope adds success/error outside the response type.
      const envelope = json as unknown as { success?: boolean; error?: string }
      if (!res.ok || envelope.success === false) {
        throw new Error(envelope.error ?? 'Error al cargar estadísticas')
      }
      return json
    },
    {
      revalidateOnFocus:    false,
      revalidateOnReconnect: false,
      dedupingInterval:     30_000,
      keepPreviousData:     true,
      errorRetryCount:      1,
    },
  )

  // Notify parent when data changes (used by admin panel for external PDF export)
  useEffect(() => {
    if (data) onAnalyticsLoaded?.(data)
  }, [data, onAnalyticsLoaded])

  // Reset insights when range changes (stale AI analysis for a different period)
  useEffect(() => {
    setInsights(null)
    setInsightState('idle')
    setInsightError(null)
  }, [range])

  // ── Insights — triggered manually ───────────────────────────────────────────

  const generateInsights = useCallback(async () => {
    if (!insightsUrl) return

    setInsightState('loading')
    setInsightError(null)

    try {
      const res  = await fetch(insightsUrl, {
        method:  'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          range,
          locale: 'es',
          ...(organizationId ? { organizationId } : {}),
        }),
      })

      const json = (await res.json()) as BusinessUserAnalyticsInsightsResponse
      // The API envelope adds success/error outside the response type.
      const envelope = json as unknown as { success?: boolean; error?: string }

      if (!res.ok || envelope.success === false) {
        throw new Error(envelope.error ?? 'Error al generar insights')
      }

      setInsights(json.insights)
      setInsightState('ready')
      onInsightsLoaded?.(json.insights)
    } catch (err) {
      setInsightState('error')
      setInsightError(err instanceof Error ? err.message : 'Error al generar insights')
    }
  }, [insightsUrl, organizationId, range, onInsightsLoaded])

  // ── PDF export — only available when the caller supplies `pdfExport` labels ──
  // (the standalone `/business-user/analytics` page). The admin stats modal renders
  // its own export button in its footer instead, using the `onAnalyticsLoaded`/
  // `onInsightsLoaded` callbacks above to capture this same data externally.

  const handleExportPdf = useCallback(async () => {
    if (!data || !pdfExport) return

    setIsPdfExporting(true)
    try {
      const { generateUserStatsPdf } = await import(
        '../../services/business-user-analytics/pdf/generate-user-stats-pdf'
      )
      const blob = await generateUserStatsPdf(data, {
        userLabel:         pdfExport.userLabel,
        organizationLabel: pdfExport.organizationLabel ?? null,
        locale:            (language as 'es' | 'en' | 'pt') ?? 'es',
        insights,
      })
      const url = URL.createObjectURL(blob)
      const a   = document.createElement('a')
      a.href     = url
      a.download = `estadisticas-${pdfExport.userLabel.toLowerCase().replace(/\s+/g, '-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // PDF generation is non-critical; ignore failures silently
    } finally {
      setIsPdfExporting(false)
    }
  }, [data, pdfExport, language, insights])

  // ── Navigation ───────────────────────────────────────────────────────────────

  const goBack = useCallback(() => {
    if (onBack) { onBack(); return }
    if (orgSlug) router.push(`/${orgSlug}/business-user/dashboard`)
  }, [onBack, orgSlug, router])

  // ── CSS variables — expose org theme tokens to child sections ────────────────
  // Surface tokens (card, border, bg) come from useBusinessPanelTheme() so they
  // respect the active panel theme (SOFLIA preset or org-branded).
  //
  // Interactive tokens (primary, accent) use the org's RAW brand colors from the
  // store — these bypass the branding-enabled gate so buttons and chart lines
  // always reflect the org's brand identity, not the platform's default teal.
  //
  // Root cause of the teal bug: when brandingEnabled=false, the context's
  // effectiveStyles computation calls getThemeStylesForMode() which reads directly
  // from PRESET_THEMES['SOFLIA'] and loses any panel overrides. Using raw org
  // colors here is the correct fix without touching the shared branding system.
  const dashVars = useMemo(() => {
    let interactivePrimary: string
    let interactiveAccent: string

    if (orgBrandPrimary || orgBrandAccent) {
      // Derive the action color with contrast check against the current surface.
      // resolveBusinessPanelActionColor handles CSS var strings in surfaceColor
      // by falling back to DESIGN_HEX_COLOR.bgDark when it can't resolve them.
      interactivePrimary = resolveBusinessPanelActionColor({
        primaryColor: orgBrandPrimary ?? 'var(--color-primary)',
        accentColor:  orgBrandAccent  ?? orgBrandPrimary ?? 'var(--color-accent)',
        surfaceColor: theme.panelBg,
      })
      // Accent = raw org accent (if readable) or the resolved action color
      interactiveAccent = orgBrandAccent ?? interactivePrimary
    } else {
      // No raw brand colors configured — fall back to theme (teal for SOFLIA preset)
      interactivePrimary = theme.primaryColor
      interactiveAccent  = theme.accentColor
    }

    return {
      '--dash-primary':    interactivePrimary,
      '--dash-accent':     interactiveAccent,
      '--dash-surface':    theme.panelBg,
      '--dash-card':       theme.cardBg,
      '--dash-card-inner': theme.hoverBg,
      '--dash-border':     theme.borderColor,
    } as CSSProperties
  }, [
    orgBrandPrimary,
    orgBrandAccent,
    theme.panelBg,
    theme.cardBg,
    theme.hoverBg,
    theme.borderColor,
    theme.primaryColor,
    theme.accentColor,
  ])

  // ── Render ───────────────────────────────────────────────────────────────────

  const content = (
    <div className="flex w-full flex-col gap-8">
      {/* ── Header — hidden when embedded (the modal provides its own header) ── */}
      {!embedded && (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <button
                type="button"
                onClick={goBack}
                aria-label="Volver"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-gray-600 shadow-sm transition-colors dark:text-gray-300"
                style={{
                  backgroundColor: 'var(--dash-card)',
                  borderColor:     'var(--dash-border)',
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.mutedTextColor }}>
                Panel personal
              </p>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                Mis estadísticas
              </h1>
            </div>
          </div>

          {/* Refresh + PDF export — only when data is loaded */}
          {!isLoading && (
            <div className="flex items-center gap-2">
              {pdfExport && data && (
                <button
                  type="button"
                  onClick={() => void handleExportPdf()}
                  disabled={isPdfExporting}
                  className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300"
                  style={{
                    backgroundColor: 'var(--dash-card)',
                    borderColor:     'var(--dash-border)',
                    color:           theme.subtextColor,
                  }}
                >
                  {isPdfExporting
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Download className="h-4 w-4" />
                  }
                  PDF
                </button>
              )}
              <button
                type="button"
                onClick={() => void mutate()}
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold shadow-sm transition-colors dark:text-gray-300"
                style={{
                  backgroundColor: 'var(--dash-card)',
                  borderColor:     'var(--dash-border)',
                  color:           theme.subtextColor,
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </button>
            </div>
          )}
        </header>
      )}

      {/* ── States ─────────────────────────────────────────────────────────── */}

      {isLoading && !data && <DashboardSkeleton />}

      {!isLoading && fetchError && !data && (
        <ErrorBanner
          message={fetchError instanceof Error ? fetchError.message : 'Error al cargar las estadísticas.'}
          onRetry={() => void mutate()}
        />
      )}

      {data && (
        <>
          <OverviewKPIs data={data} />
          {compactMode
            ? <PerformanceCards data={data} />
            : (
              <>
                <CourseProgressBars courses={data.learning.courses} />
                <LearningTrendChart
                  lessonTrend={data.learning.lessonTrend}
                  activityTrend={data.activities.submissionsTrend}
                  range={range}
                  onRangeChange={setRange}
                />
                <QualityRadarChart quality={data.quality} />
                <NextGoals
                  data={data}
                  orgSlug={orgSlug}
                  isOwnProfile={isOwnProfile}
                  viewedUserId={userId}
                  onNotifyFeedback={onNotifyFeedback}
                />
                <AiInsightsCard
                  state={insightState}
                  insights={insights}
                  error={insightError}
                  onGenerate={() => void generateInsights()}
                />
              </>
            )
          }
        </>
      )}
    </div>
  )

  // Embedded mode: no outer container (used inside modals or side panels)
  if (embedded) {
    return (
      <div className="w-full" style={dashVars}>
        {content}
      </div>
    )
  }

  return (
    <div
      className="min-h-screen"
      style={{ ...dashVars, backgroundColor: 'var(--dash-surface)' } as CSSProperties}
    >
      <OrgNavbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
        {content}
      </main>
    </div>
  )
}

// ─── Inline error banner ──────────────────────────────────────────────────────

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-100 bg-red-50 px-6 py-12 text-center dark:border-red-900/30 dark:bg-red-900/10">
      <p className="text-sm font-semibold text-red-600 dark:text-red-400">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50 dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-900/20"
      >
        <RefreshCw className="h-4 w-4" />
        Reintentar
      </button>
    </div>
  )
}
