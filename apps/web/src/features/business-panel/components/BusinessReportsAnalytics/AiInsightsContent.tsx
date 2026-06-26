'use client'

import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Lightbulb,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import type {
  ReportsAnalyticsAiInsightSection,
  ReportsAnalyticsAiInsights,
  ReportsAnalyticsAiUrgentAction,
} from '../../types/reports-analytics.types'
import type { ReportsAnalyticsT, ThemeTokens } from './types'

function SectionCard({ title, icon: Icon, children, theme, accentColor }: {
  title: string
  icon: typeof Sparkles
  children: React.ReactNode
  theme: ThemeTokens
  accentColor?: string
}) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: theme.borderColor, backgroundColor: theme.inputBg }}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color: accentColor ?? theme.actionColor }} />
        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

function UrgentActionCard({ action, theme, t }: { action: ReportsAnalyticsAiUrgentAction; theme: ThemeTokens; t: ReportsAnalyticsT }) {
  const isHigh = action.priority === 'high'
  const badgeColor = isHigh ? '#ef4444' : '#f59e0b'
  const labelKey = isHigh ? 'reportsAnalytics.ai.urgentPriority' : 'reportsAnalytics.ai.mediumPriority'

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: badgeColor + '40' }}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="text-sm font-semibold leading-5" style={{ color: theme.textColor }}>{action.title}</p>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
          style={{ backgroundColor: badgeColor + '20', color: badgeColor }}
        >
          {t(labelKey)}
        </span>
      </div>
      <p className="mb-3 text-sm leading-5" style={{ color: theme.subtextColor }}>{action.description}</p>
      <div className="flex flex-wrap gap-3">
        {action.affectedUsers > 0 && (
          <span className="flex items-center gap-1 text-xs" style={{ color: theme.mutedTextColor }}>
            <Users className="h-3 w-3" />
            {action.affectedUsers} {t('reportsAnalytics.ai.affectedUsers')}
          </span>
        )}
        {action.timeline && (
          <span className="flex items-center gap-1 text-xs" style={{ color: theme.mutedTextColor }}>
            <Clock className="h-3 w-3" />
            {t('reportsAnalytics.ai.timeline')}: {action.timeline}
          </span>
        )}
      </div>
    </div>
  )
}

function BulletList({ points, theme, bulletColor }: { points: string[]; theme: ThemeTokens; bulletColor?: string }) {
  return (
    <ul className="space-y-2">
      {points.map((point, i) => (
        <li key={i} className="flex items-start gap-2 text-sm leading-5" style={{ color: theme.textColor }}>
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: bulletColor ?? theme.accentColor }} />
          {point}
        </li>
      ))}
    </ul>
  )
}

function AccordionSection({ section, theme }: { section: ReportsAnalyticsAiInsightSection; theme: ThemeTokens }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border" style={{ borderColor: theme.borderColor }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-3 text-left text-sm font-medium"
        style={{ color: theme.textColor }}
      >
        {section.title}
        {open ? <ChevronUp className="h-4 w-4 shrink-0" style={{ color: theme.mutedTextColor }} /> : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: theme.mutedTextColor }} />}
      </button>
      {open && (
        <div className="border-t px-3 pb-3 pt-2" style={{ borderColor: theme.borderColor }}>
          <BulletList points={section.points} theme={theme} />
        </div>
      )}
    </div>
  )
}

export function AiInsightsContent({
  insights,
  theme,
  t,
}: {
  insights: ReportsAnalyticsAiInsights | null
  theme: ThemeTokens
  t: ReportsAnalyticsT
}) {
  if (!insights) {
    return (
      <div className="mt-5 flex flex-col items-center justify-center rounded-lg border py-10 text-center" style={{ borderColor: theme.borderColor }}>
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: theme.hoverBg }}>
          <Sparkles className="h-5 w-5" style={{ color: theme.mutedTextColor }} />
        </div>
        <p className="text-sm font-medium" style={{ color: theme.textColor }}>
          {t('reportsAnalytics.emptyStates.generateInsightsPrompt')}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-5">
      {/* Executive summary */}
      <div className="rounded-lg border p-4" style={{ borderColor: theme.borderColor, backgroundColor: theme.hoverBg }}>
        <p className="text-sm leading-6" style={{ color: theme.textColor }}>{insights.summary}</p>
      </div>

      {/* Executive metrics */}
      {insights.executiveMetrics && insights.executiveMetrics.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {insights.executiveMetrics.map((metric) => (
            <div key={`${metric.label}-${metric.value}`} className="rounded-lg border p-3" style={{ borderColor: theme.borderColor }}>
              <p className="text-xs uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>{metric.label}</p>
              <p className="mt-1.5 text-xl font-bold" style={{ color: theme.textColor }}>{metric.value}</p>
              {metric.detail && <p className="mt-1 text-xs leading-4" style={{ color: theme.subtextColor }}>{metric.detail}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Urgent actions */}
      {insights.urgentActions && insights.urgentActions.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" style={{ color: '#ef4444' }} />
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
              {t('reportsAnalytics.ai.urgentActions')}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {insights.urgentActions.map((action, i) => (
              <UrgentActionCard key={i} action={action} theme={theme} t={t} />
            ))}
          </div>
        </div>
      )}

      {/* Findings + Risks */}
      <div className="grid gap-4 xl:grid-cols-2">
        {insights.findings.length > 0 && (
          <SectionCard title={t('reportsAnalytics.sections.aiInsights')} icon={Lightbulb} theme={theme}>
            {insights.findings.map((section) => (
              <div key={section.title} className="mb-4 last:mb-0">
                {section.title && (
                  <p className="mb-2 text-xs font-semibold" style={{ color: theme.subtextColor }}>{section.title}</p>
                )}
                <BulletList points={section.points} theme={theme} />
              </div>
            ))}
          </SectionCard>
        )}

        {insights.risks.length > 0 && (
          <SectionCard title={t('reportsAnalytics.ai.risks')} icon={AlertTriangle} theme={theme} accentColor="#ef4444">
            <BulletList points={insights.risks} theme={theme} bulletColor="#ef4444" />
          </SectionCard>
        )}
      </div>

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <SectionCard title={t('reportsAnalytics.ai.recommendations')} icon={Zap} theme={theme} accentColor={theme.successColor}>
          <div className="grid gap-2 sm:grid-cols-2">
            {insights.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-sm leading-5" style={{ color: theme.textColor }}>
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: theme.successColor }} />
                {rec}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Segment highlights */}
      {insights.segmentHighlights && insights.segmentHighlights.length > 0 && (
        <SectionCard title={t('reportsAnalytics.ai.segmentHighlights')} icon={TrendingUp} theme={theme}>
          <div className="space-y-3">
            {insights.segmentHighlights.map((item, i) => (
              <div key={i} className="rounded border p-3" style={{ borderColor: theme.dividerColor }}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: theme.actionColor }}>
                  {item.segment}
                </p>
                <p className="text-sm leading-5" style={{ color: theme.textColor }}>{item.insight}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Action plan */}
      {insights.actionPlan && insights.actionPlan.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
            {t('reportsAnalytics.ai.actionPlan')}
          </p>
          {insights.actionPlan.map((section) => (
            <AccordionSection key={section.title} section={section} theme={theme} />
          ))}
        </div>
      )}

      {/* Kudos */}
      {insights.kudos && insights.kudos.length > 0 && (
        <SectionCard title={t('reportsAnalytics.ai.kudos')} icon={Star} theme={theme} accentColor="#f59e0b">
          <div className="grid gap-3 sm:grid-cols-2">
            {insights.kudos.map((kudo, i) => (
              <div key={i} className="rounded border p-3" style={{ borderColor: '#f59e0b30' }}>
                <p className="mb-1 text-xs font-semibold" style={{ color: '#b45309' }}>{kudo.title}</p>
                <p className="text-sm leading-5" style={{ color: theme.textColor }}>{kudo.description}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  )
}
