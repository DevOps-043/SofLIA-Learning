'use client'

import { useState } from 'react'
import { AlertTriangle, Clock, Loader2, Lock, LockOpen, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  formatForensicTimestamp,
  type ForensicTimeZone,
} from '@/shared/utils/forensic-timestamp'
import type {
  ForensicAttemptLock,
  ForensicLockStatus,
} from '@/features/admin/services/user-forensics/user-forensics.types'

import { useAttemptUnlock } from '../../hooks/useAttemptUnlock'
import { ContentBreadcrumb } from './ContentBreadcrumb'

interface AuditLocksProps {
  userId: string
  locks: ForensicAttemptLock[]
  zone: ForensicTimeZone
  /** Recarga la auditoría tras conceder un desbloqueo. */
  onUnlocked: () => Promise<void> | void
}

const STATUS_STYLES: Record<ForensicLockStatus, { box: string; badge: string; icon: React.ReactNode }> = {
  locked: {
    box: 'border-red-500/30 bg-red-500/5',
    badge: 'bg-red-500/10 text-red-600 dark:text-red-400',
    icon: <Lock className="h-4 w-4" />,
  },
  cooldown: {
    box: 'border-amber-500/30 bg-amber-500/5',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    icon: <Clock className="h-4 w-4" />,
  },
  at_risk: {
    box: 'border-gray-200 dark:border-white/10',
    badge: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  cleared: {
    box: 'border-emerald-500/30 bg-emerald-500/5',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    icon: <ShieldCheck className="h-4 w-4" />,
  },
}

/**
 * Bloqueos por tope de intentos: dónde quedó detenido el alumno dentro del curso y
 * acción para devolverle intentos sin borrar su historial de auditoría.
 */
export function AuditLocks({ userId, locks, zone, onUnlocked }: AuditLocksProps) {
  const { t } = useTranslation('admin')
  const { unlock, pendingLockId, error } = useAttemptUnlock(userId, onUnlocked)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  if (locks.length === 0) {
    return (
      <p className="rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-4 text-center text-xs text-gray-400 dark:border-white/10 dark:bg-white/5">
        {t('users.masterPanel.audit.locks.empty')}
      </p>
    )
  }

  const startConfirm = (lockId: string) => {
    setConfirmingId(lockId)
    setReason('')
  }

  const submit = async (lock: ForensicAttemptLock) => {
    const granted = await unlock(lock, reason)
    if (granted) {
      setConfirmingId(null)
      setReason('')
    }
  }

  return (
    <div className="space-y-2">
      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      ) : null}

      {locks.map((lock) => {
        const style = STATUS_STYLES[lock.status]
        const isConfirming = confirmingId === lock.id
        const isPending = pendingLockId === lock.id
        const canUnlock = lock.status === 'locked' || lock.status === 'cooldown'

        return (
          <div key={lock.id} className={`rounded-lg border px-3 py-2.5 ${style.box}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.badge}`}>
                    {style.icon}
                    {t(`users.masterPanel.audit.locks.status.${lock.status}`)}
                  </span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {t(`users.masterPanel.audit.locks.scope.${lock.scope}`)}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-white/10 dark:text-gray-400">
                    {t('users.masterPanel.audit.locks.attempts', {
                      used: lock.attemptsUsed,
                      max: lock.maxAttempts,
                    })}
                  </span>
                  {/* Con ventana deslizante, el cupo consumido "ahora" oculta la
                      insistencia acumulada: el auditor necesita ver ambas cifras. */}
                  {lock.attemptsSinceUnlock > lock.attemptsUsed ? (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-white/10 dark:text-gray-400">
                      {t('users.masterPanel.audit.locks.attemptsSinceUnlock', {
                        count: lock.attemptsSinceUnlock,
                      })}
                    </span>
                  ) : null}
                </div>

                <ContentBreadcrumb context={lock.context} />

                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  {lock.lastAttemptAtUtc
                    ? t('users.masterPanel.audit.locks.lastAttempt', {
                        date: formatForensicTimestamp(lock.lastAttemptAtUtc, zone),
                      })
                    : null}
                  {lock.retryAvailableAtUtc
                    ? ` · ${t('users.masterPanel.audit.locks.retryAt', {
                        date: formatForensicTimestamp(lock.retryAvailableAtUtc, zone),
                      })}`
                    : null}
                </p>

                {lock.unlock ? (
                  <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                    {t('users.masterPanel.audit.locks.grantedBy', {
                      email: lock.unlock.grantedByEmail ?? '—',
                      date: formatForensicTimestamp(lock.unlock.effectiveFromUtc, zone),
                    })}
                    {lock.unlock.reason ? ` — “${lock.unlock.reason}”` : ''}
                  </p>
                ) : null}
              </div>

              {canUnlock && !isConfirming ? (
                <button
                  type="button"
                  onClick={() => startConfirm(lock.id)}
                  className="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  <LockOpen className="h-3.5 w-3.5" />
                  {t('users.masterPanel.audit.locks.unlock')}
                </button>
              ) : null}
            </div>

            {isConfirming ? (
              <div className="mt-2.5 space-y-2 rounded-lg border border-gray-200 bg-white p-2.5 dark:border-white/10 dark:bg-white/[0.02]">
                <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-300">
                  {t('users.masterPanel.audit.locks.reasonLabel')}
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder={t('users.masterPanel.audit.locks.reasonPlaceholder')}
                  maxLength={500}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-accent dark:border-white/10 dark:bg-transparent dark:text-white"
                />
                <p className="text-[11px] text-gray-400">
                  {t('users.masterPanel.audit.locks.auditNote')}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isPending || reason.trim().length < 3}
                    onClick={() => void submit(lock)}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <LockOpen className="h-3.5 w-3.5" />
                    )}
                    {t('users.masterPanel.audit.locks.confirmUnlock')}
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setConfirmingId(null)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    {t('users.masterPanel.audit.locks.cancel')}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
