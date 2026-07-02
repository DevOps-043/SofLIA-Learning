'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  ListChecks,
  BarChart3,
} from 'lucide-react'
import type {
  BusinessUserAnalyticsInsightMetric,
  BusinessUserAnalyticsInsightSection,
  BusinessUserAnalyticsInsights,
} from '@/features/business-panel/types/business-user-analytics.types'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'

export type InsightState = 'idle' | 'loading' | 'ready' | 'error'

interface AiInsightsCardProps {
  state:      InsightState
  insights:   BusinessUserAnalyticsInsights | null
  error?:     string | null
  onGenerate: () => void
}

export function AiInsightsCard({ state, insights, error, onGenerate }: AiInsightsCardProps) {
  const theme = useBusinessPanelTheme()

  return (
    <section
      aria-label="Análisis de SofLIA"
      className="rounded-2xl border shadow-sm"
      style={{ backgroundColor: 'var(--dash-card)', borderColor: 'var(--dash-border)' }}
    >
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div
        className="flex items-start justify-between gap-4 border-b p-6"
        style={{ borderColor: 'var(--dash-border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `linear-gradient(135deg, ${theme.actionColor} 0%, ${theme.accentColor} 100%)` }}
          >
            <Sparkles className="no-theme h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Análisis de SofLIA</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Coaching personalizado basado en tus métricas reales.
            </p>
          </div>
        </div>

        {(state === 'ready' || state === 'error') && (
          <button
            type="button"
            onClick={onGenerate}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm transition-opacity hover:opacity-80"
            style={{
              backgroundColor: 'var(--dash-card-inner)',
              borderColor:     'var(--dash-border)',
              color:           theme.subtextColor,
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </button>
        )}
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="p-6">
        {state === 'idle'    && <IdleState onGenerate={onGenerate} />}
        {state === 'loading' && <LoadingState />}
        {state === 'error'   && <ErrorState message={error} onRetry={onGenerate} />}
        {state === 'ready' && insights && (
          <InsightsContent insights={insights} theme={theme} />
        )}
      </div>
    </section>
  )
}

// ─── Ready state: full structured display ────────────────────────────────────

function InsightsContent({
  insights,
  theme,
}: {
  insights: BusinessUserAnalyticsInsights
  theme: ReturnType<typeof useBusinessPanelTheme>
}) {
  if (insights.unavailable) {
    return (
      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/10">
        <p className="text-sm text-amber-700 dark:text-amber-400">{insights.summary}</p>
      </div>
    )
  }

  const innerStyle = {
    backgroundColor: 'var(--dash-card-inner)',
    borderColor:     'var(--dash-border)',
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      {insights.summary && (
        <div
          className="rounded-xl border p-5"
          style={innerStyle}
        >
          <p className="text-sm leading-7 text-gray-700 dark:text-gray-200">{insights.summary}</p>

          {insights.cached && (
            <div className="mt-3 flex items-center gap-2">
              <Chip label="En caché" theme={theme} />
            </div>
          )}
        </div>
      )}

      {/* Key metrics grid */}
      {insights.metrics.length > 0 && (
        <div>
          <SectionLabel icon={<BarChart3 className="h-4 w-4" />} label="Métricas clave" />
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {insights.metrics.map((metric, i) => (
              <MetricCard key={i} metric={metric} theme={theme} />
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {insights.strengths.length > 0 && (
        <InsightList
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          label="Fortalezas"
          items={insights.strengths}
          dotColor="bg-emerald-500"
          theme={theme}
        />
      )}

      {/* Opportunities */}
      {insights.opportunities.length > 0 && (
        <InsightList
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          label="Áreas de oportunidad"
          items={insights.opportunities}
          dotColor="bg-amber-500"
          theme={theme}
        />
      )}

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <div>
          <SectionLabel icon={<Lightbulb className="h-4 w-4" />} label="Recomendaciones" />
          <ul className="mt-3 space-y-2" role="list">
            {insights.recommendations.map((text, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm leading-6 text-gray-700 dark:text-gray-200"
                style={{ backgroundColor: 'var(--dash-card-inner)', borderColor: 'var(--dash-border)' }}
              >
                <span
                  className="no-theme mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: theme.actionColor }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next steps (collapsible) */}
      {insights.nextSteps.length > 0 && (
        <div>
          <SectionLabel icon={<ListChecks className="h-4 w-4" />} label="Próximos pasos" />
          <div className="mt-3 space-y-2">
            {insights.nextSteps.map((section, i) => (
              <NextStepSection key={i} section={section} theme={theme} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      )}

      {/* Trending note */}
      <div className="flex items-center gap-2 rounded-lg px-3 py-2.5"
        style={{ backgroundColor: 'var(--dash-card-inner)', borderColor: 'var(--dash-border)' }}>
        <TrendingUp className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Análisis generado el {new Date(insights.generatedAt).toLocaleDateString('es-MX', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-500 dark:text-gray-400">{icon}</span>
      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </h3>
    </div>
  )
}

function Chip({ label, theme }: { label: string; theme: ReturnType<typeof useBusinessPanelTheme> }) {
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs text-gray-400 dark:text-gray-500"
      style={{ backgroundColor: theme.borderColor }}
    >
      {label}
    </span>
  )
}

function MetricCard({
  metric,
  theme,
}: {
  metric: BusinessUserAnalyticsInsightMetric
  theme:  ReturnType<typeof useBusinessPanelTheme>
}) {
  return (
    <div
      className="flex flex-col gap-1 rounded-xl border p-4"
      style={{ backgroundColor: 'var(--dash-card-inner)', borderColor: 'var(--dash-border)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {metric.label}
      </p>
      <p
        className="text-2xl font-bold tabular-nums"
        style={{ color: theme.actionColor }}
      >
        {metric.value}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{metric.detail}</p>
    </div>
  )
}

function InsightList({
  icon,
  label,
  items,
  dotColor,
  theme,
}: {
  icon:     React.ReactNode
  label:    string
  items:    string[]
  dotColor: string
  theme:    ReturnType<typeof useBusinessPanelTheme>
}) {
  return (
    <div>
      <SectionLabel icon={icon} label={label} />
      <ul className="mt-3 space-y-2" role="list">
        {items.map((text, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-6 text-gray-700 dark:text-gray-200"
            style={{ backgroundColor: 'var(--dash-card-inner)', borderColor: 'var(--dash-border)' }}
          >
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor}`}
              aria-hidden="true"
            />
            {text}
          </li>
        ))}
      </ul>
    </div>
  )
}

function NextStepSection({
  section,
  theme,
  defaultOpen,
}: {
  section:     BusinessUserAnalyticsInsightSection
  theme:       ReturnType<typeof useBusinessPanelTheme>
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: 'var(--dash-border)' }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:opacity-80"
        style={{ backgroundColor: 'var(--dash-card-inner)' }}
      >
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {section.title}
        </span>
        {open
          ? <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
          : <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
        }
      </button>

      {open && section.points.length > 0 && (
        <ul className="space-y-0 divide-y"
          style={{ borderColor: 'var(--dash-border)', backgroundColor: 'var(--dash-card)' }}>
          {section.points.map((point, i) => (
            <li
              key={i}
              className="flex items-start gap-3 px-4 py-3 text-sm text-gray-600 dark:text-gray-300"
            >
              <span
                className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: theme.actionColor }}
                aria-hidden="true"
              />
              {point}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Idle / Loading / Error states ───────────────────────────────────────────

function IdleState({ onGenerate }: { onGenerate: () => void }) {
  const theme = useBusinessPanelTheme()
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: `linear-gradient(135deg, ${theme.actionColor} 0%, ${theme.accentColor} 100%)` }}
      >
        <Sparkles className="no-theme h-7 w-7 text-white" />
      </div>
      <div>
        <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
          Coaching personalizado con IA
        </p>
        <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          SofLIA analizará tus métricas reales y te dará retroalimentación específica sobre
          tu progreso, fortalezas y próximos pasos concretos.
        </p>
      </div>
      <button
        type="button"
        onClick={onGenerate}
        className="no-theme inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition-all hover:brightness-95 active:scale-95"
        style={{ backgroundColor: theme.actionColor, color: theme.onActionColor }}
      >
        <Sparkles className="h-4 w-4" />
        Generar análisis
      </button>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          SofLIA está analizando tu progreso…
        </p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Esto puede tomar unos segundos.
        </p>
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message?: string | null; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <AlertTriangle className="h-7 w-7 text-red-400" />
      <p className="text-sm text-red-500 dark:text-red-400">
        {message ?? 'No se pudo generar el análisis. Intenta de nuevo.'}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="text-xs font-semibold underline text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        Reintentar
      </button>
    </div>
  )
}
