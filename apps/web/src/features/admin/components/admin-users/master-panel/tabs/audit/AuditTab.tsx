'use client'

import { useState } from 'react'
import { AlertTriangle, ChevronDown, Download, FileText, Loader2, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AdminUser } from '../../../../../services/adminUsers.service'
import {
  forensicTimeZoneLabel,
  type ForensicTimeZone,
} from '@/shared/utils/forensic-timestamp'
import { getMasterPanelDisplayName } from '../../profile-form.service'
import { useUserForensics } from '../../hooks/useUserForensics'
import { useForensicReport } from '../../hooks/useForensicReport'
import { AuditSummaryCards } from './AuditSummaryCards'
import { AuditSessionsTable } from './AuditSessionsTable'
import { AuditTimeline } from './AuditTimeline'
import { AuditFlags } from './AuditFlags'
import { AuditLocks } from './AuditLocks'
import { AuditAggregates } from './AuditAggregates'
import { AuditNotes } from './AuditNotes'
import { AuditSofliaDialogues } from './AuditSofliaDialogues'

interface AuditTabProps {
  user: AdminUser
  /** Solo se carga cuando la pestaña ha sido visitada (montaje perezoso). */
  active: boolean
}

export function AuditTab({ user, active }: AuditTabProps) {
  const { t } = useTranslation('admin')
  const [zone, setZone] = useState<ForensicTimeZone>('utc')
  const { summary, isLoading, error, reload } = useUserForensics(user.id, active)
  const report = useForensicReport(user.id, getMasterPanelDisplayName(user), user.email ?? null)

  if (isLoading && !summary) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    )
  }

  if (error && !summary) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-sm text-red-500">
        <AlertTriangle className="h-6 w-6" />
        {error}
        <button
          type="button"
          onClick={() => void reload()}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 dark:border-white/10 dark:text-gray-300"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t('users.masterPanel.audit.retry')}
        </button>
      </div>
    )
  }

  if (!summary) return null

  const dialogueEvents = summary.timeline.filter((event) => event.type === 'dialogue_started')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {t('users.masterPanel.audit.title')}
          </h3>
          <p className="text-xs text-gray-400">
            {t('users.masterPanel.audit.subtitle', { total: summary.totalEvents })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-gray-200 text-[11px] dark:border-white/10">
            <ZoneButton
              label="UTC"
              active={zone === 'utc'}
              onClick={() => setZone('utc')}
            />
            <ZoneButton
              label={forensicTimeZoneLabel('local')}
              active={zone === 'local'}
              onClick={() => setZone('local')}
            />
          </div>
          <a
            href={`/api/admin/users/${user.id}/forensics/export`}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <Download className="h-3.5 w-3.5" />
            {t('users.masterPanel.audit.export')}
          </a>
          <button
            type="button"
            onClick={() => void report.generate()}
            disabled={report.isGenerating}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {report.isGenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
            {report.isGenerating
              ? t('users.masterPanel.audit.report.generating')
              : t('users.masterPanel.audit.report.generate')}
          </button>
        </div>
      </div>

      {report.error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
          <AlertTriangle className="h-4 w-4" />
          {report.error}
        </div>
      ) : null}

      {summary.truncated ? (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          {t('users.masterPanel.audit.truncated')}
        </div>
      ) : null}

      <AuditFlags flags={summary.flags} />

      <AuditSummaryCards summary={summary} zone={zone} />

      <AuditSection
        title={t('users.masterPanel.audit.locks.title')}
        count={summary.locks.length}
        defaultOpen={summary.locks.some(
          (lock) => lock.status === 'locked' || lock.status === 'cooldown',
        )}
      >
        <AuditLocks
          userId={user.id}
          locks={summary.locks}
          zone={zone}
          onUnlocked={reload}
        />
      </AuditSection>

      <AuditSection title={t('users.masterPanel.audit.agg.title')} defaultOpen>
        <AuditAggregates aggregates={summary.aggregates} />
      </AuditSection>

      <AuditSection
        title={t('users.masterPanel.audit.soflia.title')}
        count={dialogueEvents.length}
        defaultOpen
      >
        <AuditSofliaDialogues userId={user.id} events={dialogueEvents} zone={zone} />
      </AuditSection>

      <AuditSection
        title={t('users.masterPanel.audit.sessions.title')}
        count={summary.sessions.length}
      >
        <AuditSessionsTable
          sessions={summary.sessions}
          ipAddresses={summary.aggregates.access.ipAddresses}
          zone={zone}
        />
      </AuditSection>

      <AuditSection
        title={t('users.masterPanel.audit.notes.title')}
        count={summary.notes.length}
      >
        <AuditNotes notes={summary.notes} zone={zone} />
      </AuditSection>

      <AuditSection
        title={t('users.masterPanel.audit.timeline.title')}
        count={summary.totalEvents}
        defaultOpen
      >
        <div className="max-h-[560px] overflow-y-auto pr-1">
          <AuditTimeline
            userId={user.id}
            events={summary.timeline}
            eventTypeCounts={summary.eventTypeCounts}
            zone={zone}
          />
        </div>
      </AuditSection>
    </div>
  )
}

function AuditSection({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string
  count?: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="rounded-xl border border-gray-200 dark:border-white/10">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
          {title}
          {typeof count === 'number' ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-white/10 dark:text-gray-400">
              {count}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open ? <div className="border-t border-gray-100 p-3 dark:border-white/5">{children}</div> : null}
    </section>
  )
}

function ZoneButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1.5 font-medium transition-colors ${
        active ? 'bg-accent/10 text-accent' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'
      }`}
    >
      {label}
    </button>
  )
}
