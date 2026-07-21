'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  formatForensicTimestamp,
  type ForensicTimeZone,
} from '@/shared/utils/forensic-timestamp'
import type { ForensicDialogueTranscript } from '@/features/admin/services/user-forensics/user-forensics.types'

interface AuditDialogueTranscriptProps {
  userId: string
  sessionId: string
  zone: ForensicTimeZone
}

export function AuditDialogueTranscript({ userId, sessionId, zone }: AuditDialogueTranscriptProps) {
  const { t } = useTranslation('admin')
  const [transcript, setTranscript] = useState<ForensicDialogueTranscript | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)
    fetch(`/api/admin/users/${userId}/forensics/dialogue/${sessionId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('load-failed')
        return (await response.json()) as ForensicDialogueTranscript
      })
      .then((data) => {
        if (!cancelled) setTranscript(data)
      })
      .catch(() => {
        if (!cancelled) setError(t('users.masterPanel.audit.dialogue.error'))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId, sessionId, t])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
      </div>
    )
  }

  if (error || !transcript) {
    return <p className="py-2 text-xs text-red-500">{error ?? t('users.masterPanel.audit.dialogue.error')}</p>
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/50 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400">
        <span>{t('users.masterPanel.audit.dialogue.state', { state: transcript.state ?? '—' })}</span>
        <span>{t('users.masterPanel.audit.dialogue.attempt', { n: transcript.attemptNumber ?? 1 })}</span>
        <span>{t('users.masterPanel.audit.dialogue.turns', { n: transcript.turnsCount ?? transcript.turns.length })}</span>
        <span>{t('users.masterPanel.audit.dialogue.activeSeconds', { n: transcript.activeSeconds ?? 0 })}</span>
      </div>

      <div className="space-y-2">
        {transcript.turns.map((turn) => (
          <div
            key={turn.id}
            className={`rounded-lg px-3 py-2 text-xs ${
              turn.role === 'assistant'
                ? 'bg-teal-500/10 text-gray-800 dark:text-gray-100'
                : turn.role === 'system'
                  ? 'bg-gray-200/60 italic text-gray-500 dark:bg-white/5'
                  : 'bg-blue-500/10 text-gray-800 dark:text-gray-100'
            }`}
          >
            <div className="mb-0.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              <span>
                {turn.role === 'assistant'
                  ? t('users.masterPanel.audit.dialogue.soflia')
                  : turn.role === 'system'
                    ? t('users.masterPanel.audit.dialogue.system')
                    : t('users.masterPanel.audit.dialogue.student')}
              </span>
              <span>{formatForensicTimestamp(turn.createdAtUtc, zone)}</span>
            </div>
            <p className="whitespace-pre-wrap">{turn.content}</p>
          </div>
        ))}
      </div>

      {transcript.evaluations.length > 0 ? (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            {t('users.masterPanel.audit.dialogue.evaluations')}
          </p>
          {transcript.evaluations.map((evaluation) => (
            <div
              key={evaluation.id}
              className="rounded-md border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-[11px] text-gray-700 dark:text-gray-200"
            >
              <span className="font-semibold">{evaluation.overallScore ?? 0}</span>
              {' · '}
              {evaluation.decision ?? '—'}
              {evaluation.feedbackForTutor ? ` · ${evaluation.feedbackForTutor}` : ''}
            </div>
          ))}
        </div>
      ) : null}

      {transcript.result ? (
        <div className="rounded-md border border-teal-500/30 bg-teal-500/10 px-2.5 py-1.5 text-[11px] text-gray-700 dark:text-gray-200">
          <span className="font-semibold">
            {t('users.masterPanel.audit.dialogue.result')}: {transcript.result.activityResult ?? '—'}
          </span>
          {' · '}
          {t('users.masterPanel.audit.dialogue.score', { n: transcript.result.score ?? 0 })}
          {transcript.result.studentFeedback ? (
            <p className="mt-1 whitespace-pre-wrap text-gray-600 dark:text-gray-300">
              {transcript.result.studentFeedback}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
