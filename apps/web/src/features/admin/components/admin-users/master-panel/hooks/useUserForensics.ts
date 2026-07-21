'use client'

import { useCallback, useEffect, useState } from 'react'
import type { UserForensicSummary } from '@/features/admin/services/user-forensics/user-forensics.types'

/**
 * Carga el resumen forense del usuario al montar la pestaña de Auditoría.
 * Sigue el patrón simple de fetch+estado del resto del master-panel (no SWR).
 */
export function useUserForensics(userId: string, enabled: boolean) {
  const [summary, setSummary] = useState<UserForensicSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/users/${userId}/forensics`, {
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? 'No se pudo cargar la auditoría')
      }
      const data = (await response.json()) as UserForensicSummary
      setSummary(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la auditoría')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!enabled) return
    void load()
  }, [enabled, load])

  return { summary, isLoading, error, reload: load }
}
