'use client'

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ChartNoAxesCombined, Download, Loader2, RefreshCw } from 'lucide-react'
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
import { chooseReadableTextColor } from '@/core/theme/color-engine'
import { resolveOrganizationBrandColors } from '@/core/theme/organization-brand-colors'
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
import styles from './BusinessUserAnalytics.module.css'

export interface BusinessUserAnalyticsPageClientProps {
  embedded?:          boolean
  orgSlug?:           string
  showBackButton?:    boolean
  userId?:            string
  onBack?:            () => void
  apiBasePath?:       string
  organizationId?:    string
  pdfExport?:         { userLabel: string; organizationLabel?: string | null }
  /** En modo embedded el header (y su botón PDF) se oculta. Actívalo para
   *  mostrar una toolbar compacta con la exportación; déjalo apagado si el
   *  contenedor ya provee su propio botón (p. ej. BusinessUserStatsModal). */
  showEmbeddedPdfButton?: boolean
  onAnalyticsLoaded?: (data: BusinessUserAnalyticsResponse) => void
  /** Rango activo del panel. Lo necesita quien exporta el PDF desde fuera. */
  onRangeChange?:     (range: BusinessUserAnalyticsRange) => void
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
  showEmbeddedPdfButton = false,
  onAnalyticsLoaded,
  onRangeChange,
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
  // The shared resolver is the branding gate: saved organization colors are applied
  // only when custom branding is enabled; otherwise the SofLIA palette is restored.
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const organizationBrand = useMemo(
    () => resolveOrganizationBrandColors(currentOrganization),
    [currentOrganization],
  )

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

  useEffect(() => {
    onRangeChange?.(range)
  }, [range, onRangeChange])

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
  // In embedded mode (admin master panel) the full header is hidden, so a
  // compact toolbar with the export button is rendered instead (see below).

  // El informe lo genera el servidor, que guarda uno por día y devuelve el ya
  // generado si vuelven a pedirlo la misma jornada; así una segunda descarga no
  // vuelve a gastar análisis de SofLIA.
  const handleExportPdf = useCallback(async () => {
    if (!data || !pdfExport) return

    setIsPdfExporting(true)
    try {
      const { downloadUserStatsPdf } = await import(
        '../../services/business-user-analytics/download-user-stats-pdf'
      )
      await downloadUserStatsPdf({
        apiBasePath,
        orgSlug,
        userId,
        organizationId,
        range,
        locale: (language as 'es' | 'en' | 'pt') ?? 'es',
      })
    } catch {
      // PDF generation is non-critical; ignore failures silently
    } finally {
      setIsPdfExporting(false)
    }
  }, [data, pdfExport, language, apiBasePath, orgSlug, userId, organizationId, range])

  // ── Navigation ───────────────────────────────────────────────────────────────

  const goBack = useCallback(() => {
    if (onBack) { onBack(); return }
    if (orgSlug) router.push(`/${orgSlug}/business-user/dashboard`)
  }, [onBack, orgSlug, router])

  // ── CSS variables — expose org theme tokens to child sections ────────────────
  // Surface tokens (card, border, bg) come from useBusinessPanelTheme() so they
  // respect the active panel theme (SOFLIA preset or org-branded).
  //
  // Interactive tokens use the same resolved colors as the navbar. This keeps
  // charts and actions consistent in both default and organization-branded modes.
  const dashVars = useMemo(() => {
    const interactivePrimary = resolveBusinessPanelActionColor({
      primaryColor: organizationBrand.primaryColor,
      accentColor: organizationBrand.accentColor,
      surfaceColor: theme.panelBg,
    })
    const interactiveAccent = organizationBrand.accentColor
    const onActionColor = chooseReadableTextColor(interactivePrimary)

    return {
      '--dash-primary':    interactivePrimary,
      '--dash-accent':     interactiveAccent,
      '--dash-on-action':  onActionColor,
      '--dash-surface':    theme.panelBg,
      '--dash-card':       theme.cardBg,
      '--dash-card-inner': theme.hoverBg,
      '--dash-border':     theme.borderColor,
      '--dash-text':       theme.textColor,
      '--dash-muted':      theme.subtextColor,
    } as CSSProperties
  }, [
    organizationBrand.primaryColor,
    organizationBrand.accentColor,
    theme.panelBg,
    theme.cardBg,
    theme.hoverBg,
    theme.borderColor,
    theme.textColor,
    theme.subtextColor,
  ])

  // ── Render ───────────────────────────────────────────────────────────────────

  const content = (
    <div className={styles.content}>
      {/* ── Header — hidden when embedded (the modal provides its own header) ── */}
      {!embedded && (
        <header className={styles.hero}>
          <div className={styles.heroIdentity}>
            {showBackButton && (
              <button
                type="button"
                onClick={goBack}
                aria-label="Volver"
                className={styles.heroBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <p className={styles.eyebrow}>
                Panel personal
              </p>
              <h1 className={styles.heroTitle}>
                Mis estadísticas
              </h1>
              <p className={styles.heroSubtitle}>
                Una lectura clara de tu progreso, constancia y calidad de aprendizaje.
              </p>
            </div>
          </div>

          {/* Refresh + PDF export — only when data is loaded */}
          {!isLoading && (
            <div className={styles.heroActions}>
              {pdfExport && data && (
                <button
                  type="button"
                  onClick={() => void handleExportPdf()}
                  disabled={isPdfExporting}
                  className={styles.heroAction}
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
                className={styles.heroAction}
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </button>
            </div>
          )}
        </header>
      )}

      {/* Toolbar compacta de exportación en modo embedded (opt-in): el header
          completo está oculto y contenedores como BusinessUserStatsModal ya
          tienen su propio botón, así que solo se muestra si el caller lo pide. */}
      {embedded && showEmbeddedPdfButton && pdfExport && !isLoading && data && (
        <div className={styles.embeddedToolbar}>
          <button
            type="button"
            onClick={() => void handleExportPdf()}
            disabled={isPdfExporting}
            className={styles.secondaryAction}
          >
            {isPdfExporting
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Download className="h-4 w-4" />
            }
            PDF
          </button>
        </div>
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
      <div className={`${styles.page} ${styles.embedded}`} style={dashVars}>
        {content}
      </div>
    )
  }

  return (
    <div className={styles.page} style={dashVars}>
      <OrgNavbar />
      <main className={styles.main}>
        {content}
      </main>
    </div>
  )
}

// ─── Inline error banner ──────────────────────────────────────────────────────

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={styles.errorBanner}>
      <ChartNoAxesCombined className="h-7 w-7" aria-hidden="true" />
      <p className={styles.errorMessage}>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className={styles.secondaryAction}
      >
        <RefreshCw className="h-4 w-4" />
        Reintentar
      </button>
    </div>
  )
}
