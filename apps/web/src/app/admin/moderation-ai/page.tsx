'use client'

import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquare,
  ShieldAlert,
  Timer,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  AdminButton,
  AdminMetricCard,
  AdminPageShell,
  AdminSectionHeader,
  AdminStatusBadge,
  AdminSurface,
  AdminTabs,
} from '@/features/admin/components/ui'
import { useAdminTheme } from '@/features/admin/hooks/useAdminTheme'
import { createClient } from '@/lib/supabase/client'

interface PendingReview {
  log_id: string
  user_id: string
  username: string
  email: string
  content_type: string
  content_preview: string
  confidence_score: number
  categories: string[]
  reasoning: string
  created_at: string
  user_warning_count: number
}

interface Stats {
  total_analyzed: number
  total_flagged: number
  pending_review: number
  average_confidence: number
  average_processing_time_ms: number
}

interface ModerationStatsRpcClient {
  rpc: (
    fn: 'get_ai_moderation_stats',
    args: { p_days: number },
  ) => Promise<{ data: Stats | null; error: unknown }>
}

type ModerationTab = 'pending' | 'stats'

export default function AIModerationPanel() {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const [pending, setPending] = useState<PendingReview[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ModerationTab>('pending')

  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      await Promise.all([loadPending(), loadStats()])
    } finally {
      setLoading(false)
    }
  }

  async function loadPending() {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('ai_moderation_pending_review')
      .select('*')
      .order('confidence_score', { ascending: false })
      .limit(50)

    if (!error && data) {
      setPending(data)
    }
  }

  async function loadStats() {
    const supabase = createClient()

    try {
      const { data, error } = await (supabase as ModerationStatsRpcClient).rpc('get_ai_moderation_stats', {
        p_days: 30,
      })

      if (!error && data) {
        setStats(data)
      }
    } catch (error) {
      console.error('Error loading moderation stats:', error)
    }
  }

  async function handleReview(logId: string, action: 'approve' | 'reject') {
    const supabase = createClient()

    if (action === 'reject') {
      const item = pending.find((entry) => entry.log_id === logId)
      if (item) {
        const { registerWarning } = await import('@/lib/moderation')
        try {
          await registerWarning(item.user_id, item.content_preview, item.content_type as 'post' | 'comment', supabase)
        } catch (error) {
          console.error('Error registering moderation warning:', error)
        }
      }
    }

    const { error } = await supabase
      .from('ai_moderation_logs')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_at: new Date().toISOString(),
      })
      .eq('log_id', logId)

    if (!error) {
      setPending((previous) => previous.filter((entry) => entry.log_id !== logId))
      void loadStats()
    }
  }

  const tabs = [
    {
      value: 'pending' as const,
      label: (
        <span className="inline-flex items-center gap-2">
          {t('moderationAi.tabs.pending')}
          {pending.length > 0 ? <AdminStatusBadge tone="danger">{pending.length}</AdminStatusBadge> : null}
        </span>
      ),
      icon: ShieldAlert,
    },
    { value: 'stats' as const, label: t('moderationAi.tabs.stats'), icon: BarChart3 },
  ]

  if (loading) {
    return (
      <AdminPageShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div
              className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: theme.action, borderTopColor: 'transparent' }}
            />
            <p className="text-sm font-medium" style={{ color: theme.textMuted }}>
              {t('moderationAi.loading')}
            </p>
          </div>
        </div>
      </AdminPageShell>
    )
  }

  return (
    <AdminPageShell maxWidth="wide">
      <AdminSectionHeader
        size="page"
        icon={ShieldAlert}
        kicker={t('moderationAi.kicker')}
        title={t('moderationAi.title')}
        description={t('moderationAi.description')}
        actions={
          <AdminButton variant="secondary" icon={Timer} onClick={() => void loadData()}>
            {t('moderationAi.refresh')}
          </AdminButton>
        }
      />

      <AdminSurface className="p-4 sm:p-5">
        <AdminTabs<ModerationTab> value={activeTab} onChange={setActiveTab} tabs={tabs} />

        <div className="mt-6">
          {activeTab === 'pending' ? (
            pending.length === 0 ? (
              <AdminSurface className="flex min-h-[260px] flex-col items-center justify-center p-8 text-center" style={{ boxShadow: 'none' }}>
                <CheckCircle2 className="mb-4 h-12 w-12" style={{ color: theme.action }} />
                <h3 className="text-xl font-bold" style={{ color: theme.text }}>
                  {t('moderationAi.emptyTitle')}
                </h3>
                <p className="mt-2 max-w-xl text-sm" style={{ color: theme.textMuted }}>
                  {t('moderationAi.emptyDescription')}
                </p>
              </AdminSurface>
            ) : (
              <div className="space-y-4">
                {pending.map((item) => (
                  <ReviewCard key={item.log_id} item={item} onReview={handleReview} />
                ))}
              </div>
            )
          ) : (
            <StatsPanel stats={stats} />
          )}
        </div>
      </AdminSurface>
    </AdminPageShell>
  )
}

function ReviewCard({
  item,
  onReview,
}: {
  item: PendingReview
  onReview: (logId: string, action: 'approve' | 'reject') => Promise<void>
}) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const isPost = item.content_type === 'post'

  return (
    <AdminSurface className="p-5" style={{ boxShadow: 'none' }}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold" style={{ color: theme.text }}>
              {item.username}
            </span>
            <span className="text-xs" style={{ color: theme.textMuted }}>
              {item.email}
            </span>
            <AdminStatusBadge tone={isPost ? 'info' : 'neutral'}>
              {isPost ? t('moderationAi.contentType.post') : t('moderationAi.contentType.comment')}
            </AdminStatusBadge>
          </div>
          <p className="text-xs" style={{ color: theme.textMuted }}>
            {t('moderationAi.warningCount', { count: item.user_warning_count })}
          </p>
        </div>

        <div className="shrink-0 text-left lg:text-right">
          <div className="text-2xl font-black" style={{ color: theme.danger }}>
            {(item.confidence_score * 100).toFixed(1)}%
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>
            {t('moderationAi.confidenceLabel')}
          </div>
        </div>
      </div>

      <AdminSurface className="mt-4 p-4" style={{ backgroundColor: theme.surfaceSubtle, boxShadow: 'none' }}>
        <p className="text-sm leading-6" style={{ color: theme.text }}>
          {item.content_preview}
          {item.content_preview.length >= 100 ? '...' : ''}
        </p>
      </AdminSurface>

      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>
            {t('moderationAi.categories')}
          </span>
          {item.categories && item.categories.length > 0 ? (
            item.categories.map((category) => (
              <AdminStatusBadge key={category} tone="danger">
                {category}
              </AdminStatusBadge>
            ))
          ) : (
            <span className="text-xs" style={{ color: theme.textMuted }}>
              {t('moderationAi.noCategories')}
            </span>
          )}
        </div>
        <p className="text-xs leading-5" style={{ color: theme.textMuted }}>
          <span className="font-bold" style={{ color: theme.text }}>
            {t('moderationAi.analysis')}
          </span>{' '}
          {item.reasoning}
        </p>
        <p className="text-xs" style={{ color: theme.textSubtle }}>
          {new Date(item.created_at).toLocaleString(undefined)}
        </p>
      </div>

      <div className="mt-5 grid gap-2 border-t pt-4 sm:grid-cols-2" style={{ borderColor: theme.divider }}>
        <AdminButton variant="primary" icon={CheckCircle2} onClick={() => void onReview(item.log_id, 'approve')}>
          {t('moderationAi.approve')}
        </AdminButton>
        <AdminButton variant="danger" icon={AlertTriangle} onClick={() => void onReview(item.log_id, 'reject')}>
          {t('moderationAi.reject')}
        </AdminButton>
      </div>
    </AdminSurface>
  )
}

function StatsPanel({ stats }: { stats: Stats | null }) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const detectionRate = stats && stats.total_analyzed > 0
    ? `${((stats.total_flagged / stats.total_analyzed) * 100).toFixed(1)}%`
    : t('moderationAi.unavailable')

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title={t('moderationAi.statsTitle')}
        description={t('moderationAi.statsDescription')}
        size="section"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          icon={FileText}
          label={t('moderationAi.stats.totalAnalyzed')}
          value={stats?.total_analyzed ?? 0}
          tone="info"
        />
        <AdminMetricCard
          icon={AlertTriangle}
          label={t('moderationAi.stats.totalFlagged')}
          value={stats?.total_flagged ?? 0}
          tone="danger"
        />
        <AdminMetricCard
          icon={ShieldAlert}
          label={t('moderationAi.stats.pending')}
          value={stats?.pending_review ?? 0}
          tone="warning"
        />
        <AdminMetricCard
          icon={BarChart3}
          label={t('moderationAi.stats.avgConfidence')}
          value={`${stats?.average_confidence ? (stats.average_confidence * 100).toFixed(1) : '0'}%`}
          tone="primary"
        />
      </div>

      <AdminSurface className="p-5" style={{ boxShadow: 'none' }}>
        <h4 className="mb-4 flex items-center gap-2 text-base font-bold" style={{ color: theme.text }}>
          <Timer className="h-4 w-4" style={{ color: theme.action }} />
          {t('moderationAi.systemPerformance')}
        </h4>
        <div className="space-y-3">
          <StatRow
            icon={Clock3}
            label={t('moderationAi.avgProcessingTime')}
            value={stats?.average_processing_time_ms ? `${stats.average_processing_time_ms.toFixed(0)}ms` : t('moderationAi.unavailable')}
          />
          <StatRow
            icon={MessageSquare}
            label={t('moderationAi.detectionRate')}
            value={detectionRate}
          />
        </div>
      </AdminSurface>
    </div>
  )
}

function StatRow({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  const theme = useAdminTheme()

  return (
    <div className="flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: theme.border }}>
      <span className="flex items-center gap-2 text-sm" style={{ color: theme.textMuted }}>
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className="text-sm font-bold" style={{ color: theme.text }}>
        {value}
      </span>
    </div>
  )
}
