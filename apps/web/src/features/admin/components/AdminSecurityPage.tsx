'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react'

type SecurityAuditEvent = {
  id: number
  occurred_at: string
  actor_id: string | null
  actor_role: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  org_id: string | null
  result: 'success' | 'denied' | 'error'
  metadata: Record<string, unknown> | null
}

type SecurityAlert = {
  code: string
  group: string
  observed: number
  severity: 'medium' | 'high' | 'critical'
  threshold: number
  windowMinutes: number
}

type SecurityAuditResponse = {
  alerts: SecurityAlert[]
  events: SecurityAuditEvent[]
  summary: Record<string, number>
}

const RESULT_BADGES: Record<SecurityAuditEvent['result'], string> = {
  denied: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200',
  error: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-200',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200',
}

const SEVERITY_BADGES: Record<SecurityAlert['severity'], string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-100',
}

export function AdminSecurityPage() {
  const { t } = useTranslation('admin')
  const [data, setData] = useState<SecurityAuditResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadAuditLog = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/security/audit-log?limit=100', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('load_failed')
      }

      setData(await response.json() as SecurityAuditResponse)
    } catch {
      setError(t('security.errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadAuditLog()
  }, [loadAuditLog])

  const summaryCards = useMemo(
    () => [
      { key: 'success', value: data?.summary.success ?? 0 },
      { key: 'denied', value: data?.summary.denied ?? 0 },
      { key: 'error', value: data?.summary.error ?? 0 },
      { key: 'alerts', value: data?.alerts.length ?? 0 },
    ],
    [data],
  )

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70">
            <ShieldCheck className="h-4 w-4 text-accent" />
            {t('security.eyebrow')}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('security.title')}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-white/60">
            {t('security.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadAuditLog()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {t('security.refresh')}
        </button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.key}
            className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]"
          >
            <p className="text-sm text-gray-500 dark:text-white/55">
              {t(`security.summary.${card.key}`)}
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {card.value}
            </p>
          </div>
        ))}
      </section>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-100">
          {error}
        </div>
      ) : null}

      {data?.alerts.length ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
            <AlertTriangle className="h-4 w-4" />
            {t('security.alertsTitle')}
          </div>
          <div className="grid gap-2">
            {data.alerts.map((alert) => (
              <div
                key={`${alert.code}-${alert.group}`}
                className="flex flex-col gap-2 rounded-lg bg-white p-3 text-sm dark:bg-gray-900/60 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {t(`security.alertCodes.${alert.code}`, { defaultValue: alert.code })}
                  </p>
                  <p className="text-gray-500 dark:text-white/55">
                    {t('security.alertDescription', {
                      group: alert.group,
                      observed: alert.observed,
                      threshold: alert.threshold,
                      window: alert.windowMinutes,
                    })}
                  </p>
                </div>
                <span className={`w-fit rounded-full px-2 py-1 text-xs font-semibold ${SEVERITY_BADGES[alert.severity]}`}>
                  {t(`security.severity.${alert.severity}`)}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.04]">
        <div className="border-b border-gray-200 p-4 dark:border-white/10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('security.eventsTitle')}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-white/[0.03] dark:text-white/50">
              <tr>
                <th className="px-4 py-3">{t('security.table.time')}</th>
                <th className="px-4 py-3">{t('security.table.action')}</th>
                <th className="px-4 py-3">{t('security.table.result')}</th>
                <th className="px-4 py-3">{t('security.table.actor')}</th>
                <th className="px-4 py-3">{t('security.table.resource')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {(data?.events ?? []).map((event) => (
                <tr key={event.id} className="text-gray-700 dark:text-white/75">
                  <td className="px-4 py-3">{formatDate(event.occurred_at)}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {event.action}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${RESULT_BADGES[event.result]}`}>
                      {t(`security.result.${event.result}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{event.actor_role ?? event.actor_id ?? '-'}</td>
                  <td className="px-4 py-3">
                    {event.resource_type
                      ? `${event.resource_type}${event.resource_id ? `:${event.resource_id}` : ''}`
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !data?.events.length ? (
          <div className="p-8 text-center text-sm text-gray-500 dark:text-white/55">
            {t('security.empty')}
          </div>
        ) : null}
      </section>
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}
