'use client'

import { useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  formatForensicTimestamp,
  type ForensicTimeZone,
} from '@/shared/utils/forensic-timestamp'
import type {
  ForensicEvent,
  ForensicEventType,
  ForensicEventTypeCount,
} from '@/features/admin/services/user-forensics/user-forensics.types'
import {
  FORENSIC_EVENT_TYPE_META,
  forensicEventTypeLabelKey,
} from './forensic-event-meta'
import { AuditDialogueTranscript } from './AuditDialogueTranscript'
import { AuditLiaTranscript } from './AuditLiaTranscript'

interface AuditTimelineProps {
  userId: string
  events: ForensicEvent[]
  eventTypeCounts: ForensicEventTypeCount[]
  zone: ForensicTimeZone
}

type TypeFilter = ForensicEventType | 'all'

export function AuditTimeline({ userId, events, eventTypeCounts, zone }: AuditTimelineProps) {
  const { t } = useTranslation('admin')
  const [filter, setFilter] = useState<TypeFilter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(
    () => (filter === 'all' ? events : events.filter((event) => event.type === filter)),
    [events, filter],
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        <FilterChip
          label={t('users.masterPanel.audit.timeline.all', { n: events.length })}
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        {eventTypeCounts.map((entry) => (
          <FilterChip
            key={entry.type}
            label={`${t(forensicEventTypeLabelKey(entry.type))} (${entry.count})`}
            active={filter === entry.type}
            dotClass={FORENSIC_EVENT_TYPE_META[entry.type]?.dotClass}
            onClick={() => setFilter(entry.type)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-4 text-center text-xs text-gray-400 dark:border-white/10 dark:bg-white/5">
          {t('users.masterPanel.audit.timeline.empty')}
        </p>
      ) : (
        <ol className="space-y-1.5">
          {filtered.map((event) => {
            const sessionId = event.refIds?.sessionId
            const conversationId = event.refIds?.conversationId
            const expandKind: 'dialogue' | 'lia' | null =
              event.type === 'dialogue_started' && sessionId
                ? 'dialogue'
                : event.type === 'lia_conversation' && conversationId
                  ? 'lia'
                  : null
            const isExpandable = expandKind !== null
            const isExpanded = expandedId === event.id
            return (
              <li
                key={event.id}
                className="rounded-lg border border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.02]"
              >
                <button
                  type="button"
                  onClick={() => (isExpandable ? setExpandedId(isExpanded ? null : event.id) : undefined)}
                  className={`flex w-full items-start gap-3 px-3 py-2 text-left ${
                    isExpandable ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                      FORENSIC_EVENT_TYPE_META[event.type]?.dotClass ?? 'bg-gray-400'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{event.title}</p>
                      <span className="whitespace-nowrap font-mono text-[11px] text-gray-400">
                        {formatForensicTimestamp(event.atUtc, zone)}
                      </span>
                    </div>
                    {event.detail ? (
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{event.detail}</p>
                    ) : null}
                  </div>
                  {isExpandable ? (
                    <ChevronRight
                      className={`mt-1 h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  ) : null}
                </button>
                {isExpanded && expandKind === 'dialogue' ? (
                  <div className="px-3 pb-3">
                    <AuditDialogueTranscript userId={userId} sessionId={sessionId as string} zone={zone} />
                  </div>
                ) : null}
                {isExpanded && expandKind === 'lia' ? (
                  <div className="px-3 pb-3">
                    <AuditLiaTranscript userId={userId} conversationId={conversationId as string} zone={zone} />
                  </div>
                ) : null}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

function FilterChip({
  label,
  active,
  dotClass,
  onClick,
}: {
  label: string
  active: boolean
  dotClass?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
        active
          ? 'border-accent bg-accent/10 text-accent'
          : 'border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5'
      }`}
    >
      {dotClass ? <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} /> : null}
      {label}
    </button>
  )
}
