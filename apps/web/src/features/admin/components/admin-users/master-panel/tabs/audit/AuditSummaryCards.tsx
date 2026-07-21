'use client'

import { Activity, CalendarDays, Clock, Fingerprint, ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  formatForensicTimestamp,
  type ForensicTimeZone,
} from '@/shared/utils/forensic-timestamp'
import type { UserForensicSummary } from '@/features/admin/services/user-forensics/user-forensics.types'

interface AuditSummaryCardsProps {
  summary: UserForensicSummary
  zone: ForensicTimeZone
}

export function AuditSummaryCards({ summary, zone }: AuditSummaryCardsProps) {
  const { t } = useTranslation('admin')
  const { identity } = summary

  const cards: Array<{ label: string; value: string; icon: React.ReactNode; highlight?: boolean }> = [
    {
      label: t('users.masterPanel.audit.summary.realLastActivity'),
      value: formatForensicTimestamp(summary.derivedLastActivityAtUtc, zone),
      icon: <Activity className="h-4 w-4 text-emerald-500" />,
      highlight: true,
    },
    {
      label: t('users.masterPanel.audit.summary.firstActivity'),
      value: formatForensicTimestamp(summary.firstActivityAtUtc, zone),
      icon: <CalendarDays className="h-4 w-4 text-accent" />,
    },
    {
      label: t('users.masterPanel.audit.summary.lastLogin'),
      value: formatForensicTimestamp(identity.lastLoginAtUtc, zone),
      icon: <Clock className="h-4 w-4 text-blue-500" />,
    },
    {
      label: t('users.masterPanel.audit.summary.storedLastActivity'),
      value: formatForensicTimestamp(identity.lastActivityAtUtc, zone),
      icon: <Fingerprint className="h-4 w-4 text-gray-400" />,
    },
  ]

  return (
    <div className="space-y-3">
      {identity.isBanned ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-500">
          <ShieldAlert className="h-4 w-4" />
          {t('users.masterPanel.audit.summary.banned', {
            date: formatForensicTimestamp(identity.bannedAtUtc, zone),
          })}
          {identity.banReason ? ` · ${identity.banReason}` : ''}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border px-3.5 py-3 ${
              card.highlight
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-gray-200 bg-gray-50/70 dark:border-white/10 dark:bg-white/5'
            }`}
          >
            <div className="mb-1 flex items-center gap-2">
              {card.icon}
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {card.label}
              </p>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-gray-400 dark:text-gray-500">
        {t('users.masterPanel.audit.summary.note')}
      </p>
    </div>
  )
}
