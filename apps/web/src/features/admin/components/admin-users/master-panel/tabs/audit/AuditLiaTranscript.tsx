'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  formatForensicTimestamp,
  type ForensicTimeZone,
} from '@/shared/utils/forensic-timestamp'
import type { ForensicLiaTranscript } from '@/features/admin/services/user-forensics/user-forensics.types'

interface AuditLiaTranscriptProps {
  userId: string
  conversationId: string
  zone: ForensicTimeZone
}

export function AuditLiaTranscript({ userId, conversationId, zone }: AuditLiaTranscriptProps) {
  const { t } = useTranslation('admin')
  const [transcript, setTranscript] = useState<ForensicLiaTranscript | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)
    fetch(`/api/admin/users/${userId}/forensics/lia/${conversationId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('load-failed')
        return (await response.json()) as ForensicLiaTranscript
      })
      .then((data) => {
        if (!cancelled) setTranscript(data)
      })
      .catch(() => {
        if (!cancelled) setError(t('users.masterPanel.audit.lia.error'))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId, conversationId, t])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
      </div>
    )
  }

  if (error || !transcript) {
    return <p className="py-2 text-xs text-red-500">{error ?? t('users.masterPanel.audit.lia.error')}</p>
  }

  if (transcript.messages.length === 0) {
    return <p className="py-2 text-xs text-gray-400">{t('users.masterPanel.audit.lia.empty')}</p>
  }

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50/50 p-3 dark:border-white/10 dark:bg-white/5">
      {transcript.messages.map((message) => (
        <div
          key={message.id}
          className={`rounded-lg px-3 py-2 text-xs ${
            message.role === 'assistant'
              ? 'bg-sky-500/10 text-gray-800 dark:text-gray-100'
              : message.role === 'system'
                ? 'bg-gray-200/60 italic text-gray-500 dark:bg-white/5'
                : 'bg-blue-500/10 text-gray-800 dark:text-gray-100'
          }`}
        >
          <div className="mb-0.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            <span>
              {message.role === 'assistant'
                ? t('users.masterPanel.audit.lia.assistant')
                : message.role === 'system'
                  ? t('users.masterPanel.audit.lia.system')
                  : t('users.masterPanel.audit.lia.student')}
              {message.isOffTopic ? ` · ${t('users.masterPanel.audit.lia.offTopic')}` : ''}
            </span>
            <span>{formatForensicTimestamp(message.createdAtUtc, zone)}</span>
          </div>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      ))}
    </div>
  )
}
