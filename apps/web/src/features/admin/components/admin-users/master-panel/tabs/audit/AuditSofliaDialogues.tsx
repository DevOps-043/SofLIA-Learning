'use client'

import { useState } from 'react'
import { ChevronRight, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  formatForensicTimestamp,
  type ForensicTimeZone,
} from '@/shared/utils/forensic-timestamp'
import type { ForensicEvent } from '@/features/admin/services/user-forensics/user-forensics.types'
import { AuditDialogueTranscript } from './AuditDialogueTranscript'

interface AuditSofliaDialoguesProps {
  userId: string
  /** Eventos `dialogue_started` (cada uno es una sesión de diálogo con SofLIA). */
  events: ForensicEvent[]
  zone: ForensicTimeZone
}

/**
 * Sección dedicada y visible de las interacciones con SofLIA: lista cada diálogo y lo
 * expande a la transcripción completa (qué dijo SofLIA y qué respondió el alumno).
 */
export function AuditSofliaDialogues({ userId, events, zone }: AuditSofliaDialoguesProps) {
  const { t } = useTranslation('admin')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (events.length === 0) {
    return (
      <p className="rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-4 text-center text-xs text-gray-400 dark:border-white/10 dark:bg-white/5">
        {t('users.masterPanel.audit.soflia.empty')}
      </p>
    )
  }

  return (
    <div className="max-h-[560px] space-y-1.5 overflow-y-auto pr-1">
      {events.map((event) => {
        const sessionId = event.refIds?.sessionId
        if (!sessionId) return null
        const isExpanded = expandedId === event.id
        return (
          <div
            key={event.id}
            className="rounded-lg border border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.02]"
          >
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : event.id)}
              className="flex w-full items-start gap-2 px-3 py-2 text-left"
            >
              <ChevronRight
                className={`mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              />
              <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-500" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {t('users.masterPanel.audit.soflia.session')}
                    {typeof event.score === 'number' ? ` · ${event.score}` : ''}
                  </p>
                  <span className="whitespace-nowrap font-mono text-[11px] text-gray-400">
                    {formatForensicTimestamp(event.atUtc, zone)}
                  </span>
                </div>
                {event.detail ? (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{event.detail}</p>
                ) : null}
              </div>
            </button>
            {isExpanded ? (
              <div className="border-t border-gray-100 px-3 pb-3 pt-2 dark:border-white/5">
                <AuditDialogueTranscript userId={userId} sessionId={sessionId} zone={zone} />
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
