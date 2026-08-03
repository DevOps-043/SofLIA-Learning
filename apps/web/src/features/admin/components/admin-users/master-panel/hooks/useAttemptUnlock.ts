'use client'

import { useCallback, useState } from 'react'

import type { ForensicAttemptLock } from '@/features/admin/services/user-forensics/user-forensics.types'

/**
 * Devuelve intentos a un alumno bloqueado desde el panel forense.
 *
 * Sigue el patrón fetch+estado del resto del master-panel (no SWR). Tras conceder el
 * desbloqueo se recarga la auditoría para que la sección de bloqueos y la línea de
 * tiempo reflejen el nuevo estado sin recargar la página.
 */
export function useAttemptUnlock(userId: string, onGranted: () => Promise<void> | void) {
  const [pendingLockId, setPendingLockId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const unlock = useCallback(
    async (lock: ForensicAttemptLock, reason: string) => {
      setPendingLockId(lock.id)
      setError(null)
      try {
        const response = await fetch(`/api/admin/users/${userId}/attempt-unlocks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scope: lock.scope,
            lessonId: lock.target.lessonId,
            materialId: lock.target.materialId,
            activityId: lock.target.activityId,
            enrollmentId: lock.target.enrollmentId,
            reason: reason.trim() ? reason.trim() : null,
          }),
        })

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null
          throw new Error(body?.error ?? 'No se pudo devolver los intentos al usuario')
        }

        await onGranted()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al desbloquear los intentos')
        return false
      } finally {
        setPendingLockId(null)
      }
    },
    [onGranted, userId],
  )

  return { unlock, pendingLockId, error, clearError: () => setError(null) }
}
