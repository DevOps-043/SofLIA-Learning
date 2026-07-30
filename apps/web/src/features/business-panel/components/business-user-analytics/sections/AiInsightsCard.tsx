'use client'

import { useState } from 'react'
import {
  BookOpenCheck,
  CalendarDays,
  ChartNoAxesCombined,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Lightbulb,
  ListChecks,
  Loader2,
  MessageSquareText,
  NotebookPen,
  RefreshCw,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import type {
  BusinessUserAnalyticsInsightMetric,
  BusinessUserAnalyticsInsightSection,
  BusinessUserAnalyticsInsights,
} from '@/features/business-panel/types/business-user-analytics.types'
import styles from '../BusinessUserAnalytics.module.css'

export type InsightState = 'idle' | 'loading' | 'ready' | 'error'

interface AiInsightsCardProps {
  state: InsightState
  insights: BusinessUserAnalyticsInsights | null
  error?: string | null
  onGenerate: () => void
}

const METRIC_ICONS = [
  BookOpenCheck,
  ChartNoAxesCombined,
  ClipboardCheck,
  CalendarDays,
  NotebookPen,
  MessageSquareText,
] as const

export function AiInsightsCard({ state, insights, error, onGenerate }: AiInsightsCardProps) {
  return (
    <section aria-label="Análisis de SofLIA" className={`${styles.sectionCard} ${styles.insightCard}`}>
      <div className={styles.insightHeader}>
        <div className={styles.insightIdentity}>
          <span className={styles.insightIcon}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className={styles.insightEyebrow}>Inteligencia aplicada</p>
            <h2 className={styles.sectionTitle}>Análisis de SofLIA</h2>
            <p className={styles.sectionSubtitle}>
              Coaching personalizado basado en tus métricas reales.
            </p>
          </div>
        </div>

        {(state === 'ready' || state === 'error') && (
          <div className={styles.insightActions}>
            {state === 'ready' && (
              <span className={styles.analysisStatus}>
                <span className={styles.analysisStatusDot} aria-hidden="true" />
                Análisis listo
              </span>
            )}
            <button type="button" onClick={onGenerate} className={styles.secondaryAction}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Actualizar
            </button>
          </div>
        )}
      </div>

      <div className={styles.insightBody}>
        {state === 'idle' && <IdleState onGenerate={onGenerate} />}
        {state === 'loading' && <LoadingState />}
        {state === 'error' && <ErrorState message={error} onRetry={onGenerate} />}
        {state === 'ready' && insights && <InsightsContent insights={insights} />}
      </div>
    </section>
  )
}

function InsightsContent({ insights }: { insights: BusinessUserAnalyticsInsights }) {
  if (insights.unavailable) {
    return (
      <div className={styles.insightUnavailable}>
        <span className={styles.insightUnavailableIcon}>
          <TriangleAlert className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className={styles.insightUnavailableTitle}>El análisis no está disponible</p>
          <p className={styles.insightUnavailableText}>{insights.summary}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.analysisReady}>
      {insights.summary && (
        <article className={styles.analysisSummary}>
          <div className={styles.analysisSummaryMeta}>
            <span className={styles.analysisKicker}>
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Lectura ejecutiva
            </span>
            {insights.cached && <span className={styles.analysisCacheChip}>Datos recientes</span>}
          </div>
          <p className={styles.analysisSummaryText}>{insights.summary}</p>
        </article>
      )}

      {insights.metrics.length > 0 && (
        <section className={styles.analysisBlock} aria-labelledby="soflia-key-metrics">
          <SectionLabel
            id="soflia-key-metrics"
            icon={ChartNoAxesCombined}
            label="Métricas clave"
            caption="Las señales que sostienen este diagnóstico."
          />
          <div className={styles.analysisMetricGrid}>
            {insights.metrics.map((metric, index) => (
              <MetricCard
                key={`${metric.label}-${index}`}
                metric={metric}
                icon={METRIC_ICONS[index % METRIC_ICONS.length] ?? ChartNoAxesCombined}
              />
            ))}
          </div>
        </section>
      )}

      {(insights.strengths.length > 0 || insights.opportunities.length > 0) && (
        <div className={styles.analysisSplit}>
          {insights.strengths.length > 0 && (
            <InsightList
              icon={CheckCircle2}
              label="Fortalezas"
              caption="Lo que ya está impulsando tu avance."
              items={insights.strengths}
              tone="success"
            />
          )}

          {insights.opportunities.length > 0 && (
            <InsightList
              icon={TriangleAlert}
              label="Áreas de oportunidad"
              caption="Los puntos con mayor potencial de mejora."
              items={insights.opportunities}
              tone="warning"
            />
          )}
        </div>
      )}

      {insights.recommendations.length > 0 && (
        <section
          className={`${styles.analysisPanel} ${styles.analysisRecommendationPanel}`}
          aria-labelledby="soflia-recommendations"
        >
          <SectionLabel
            id="soflia-recommendations"
            icon={Lightbulb}
            label="Recomendaciones"
            caption="Acciones concretas priorizadas por SofLIA."
            tone="action"
          />
          <ol className={styles.analysisRecommendationList}>
            {insights.recommendations.map((text, index) => (
              <li key={index} className={styles.analysisRecommendationItem}>
                <span className={styles.analysisRecommendationNumber} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {insights.nextSteps.length > 0 && (
        <section className={styles.analysisPanel} aria-labelledby="soflia-next-steps">
          <SectionLabel
            id="soflia-next-steps"
            icon={ListChecks}
            label="Próximos pasos"
            caption="Abre cada etapa para consultar el plan recomendado."
          />
          <div className={styles.analysisAccordionList}>
            {insights.nextSteps.map((section, index) => (
              <NextStepSection
                key={`${section.title}-${index}`}
                section={section}
                index={index}
                defaultOpen={index === 0}
              />
            ))}
          </div>
        </section>
      )}

      <footer className={styles.analysisFooter}>
        <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
        <span>
          Análisis actualizado el{' '}
          {new Date(insights.generatedAt).toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </footer>
    </div>
  )
}

function SectionLabel({
  id,
  icon: Icon,
  label,
  caption,
  tone = 'neutral',
}: {
  id?: string
  icon: LucideIcon
  label: string
  caption?: string
  tone?: 'neutral' | 'success' | 'warning' | 'action'
}) {
  const toneClass = {
    neutral: styles.analysisSectionIconNeutral,
    success: styles.analysisSectionIconSuccess,
    warning: styles.analysisSectionIconWarning,
    action: styles.analysisSectionIconAction,
  }[tone]

  return (
    <div className={styles.analysisSectionLabel}>
      <span className={`${styles.analysisSectionIcon} ${toneClass}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div>
        <h3 id={id} className={styles.analysisSectionTitle}>
          {label}
        </h3>
        {caption && <p className={styles.analysisSectionCaption}>{caption}</p>}
      </div>
    </div>
  )
}

function MetricCard({
  metric,
  icon: Icon,
}: {
  metric: BusinessUserAnalyticsInsightMetric
  icon: LucideIcon
}) {
  return (
    <article className={styles.analysisMetricCard}>
      <div className={styles.analysisMetricTopline}>
        <span className={styles.analysisMetricIcon}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className={styles.analysisMetricIndex} aria-hidden="true" />
      </div>
      <p className={styles.analysisMetricLabel}>{metric.label}</p>
      <p className={styles.analysisMetricValue}>{metric.value}</p>
      <p className={styles.analysisMetricDetail}>{metric.detail}</p>
    </article>
  )
}

function InsightList({
  icon,
  label,
  caption,
  items,
  tone,
}: {
  icon: LucideIcon
  label: string
  caption: string
  items: string[]
  tone: 'success' | 'warning'
}) {
  const panelClass =
    tone === 'success' ? styles.analysisPanelSuccess : styles.analysisPanelWarning
  const markerClass =
    tone === 'success' ? styles.analysisListMarkerSuccess : styles.analysisListMarkerWarning

  return (
    <section className={`${styles.analysisPanel} ${panelClass}`}>
      <SectionLabel icon={icon} label={label} caption={caption} tone={tone} />
      <ul className={styles.analysisInsightList} role="list">
        {items.map((text, index) => (
          <li key={index} className={styles.analysisInsightItem}>
            <span className={`${styles.analysisListMarker} ${markerClass}`} aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function NextStepSection({
  section,
  index,
  defaultOpen,
}: {
  section: BusinessUserAnalyticsInsightSection
  index: number
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = `soflia-next-step-${index}`

  return (
    <div className={`${styles.analysisAccordion} ${open ? styles.analysisAccordionOpen : ''}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={styles.analysisAccordionButton}
        aria-expanded={open}
        aria-controls={contentId}
      >
        <span className={styles.analysisAccordionNumber} aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className={styles.analysisAccordionTitle}>{section.title}</span>
        <span className={styles.analysisAccordionChevron}>
          {open ? (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          )}
        </span>
      </button>

      {open && section.points.length > 0 && (
        <ul id={contentId} className={styles.analysisAccordionContent}>
          {section.points.map((point, pointIndex) => (
            <li key={pointIndex}>
              <span className={styles.analysisAccordionDot} aria-hidden="true" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function IdleState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className={styles.idleState}>
      <span className={styles.idleIcon}>
        <Sparkles className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <p className={styles.idleTitle}>Coaching personalizado con IA</p>
        <p className={styles.idleText}>
          SofLIA analizará tus métricas reales y te dará retroalimentación específica sobre
          tu progreso, fortalezas y próximos pasos concretos.
        </p>
      </div>
      <button type="button" onClick={onGenerate} className={styles.primaryAction}>
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        Generar análisis
      </button>
    </div>
  )
}

function LoadingState() {
  return (
    <div className={styles.insightLoading} role="status">
      <span className={styles.insightLoadingIcon}>
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      </span>
      <div>
        <p className={styles.insightLoadingTitle}>SofLIA está analizando tu progreso</p>
        <p className={styles.insightLoadingText}>Esto puede tomar unos segundos.</p>
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message?: string | null; onRetry: () => void }) {
  return (
    <div className={styles.insightError} role="alert">
      <span className={styles.insightErrorIcon}>
        <TriangleAlert className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <p className={styles.insightErrorTitle}>No pudimos completar el análisis</p>
        <p className={styles.insightErrorText}>
          {message ?? 'Intenta generarlo nuevamente en unos momentos.'}
        </p>
      </div>
      <button type="button" onClick={onRetry} className={styles.secondaryAction}>
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        Reintentar
      </button>
    </div>
  )
}
