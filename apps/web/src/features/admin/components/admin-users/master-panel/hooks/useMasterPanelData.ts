'use client'

import { useCallback, useEffect, useState } from 'react'
import { getMasterPanelData, hasFreshMasterPanelData } from '../master-panel-api'
import type { UserMasterPanelData } from '../types'

const EMPTY_DATA: UserMasterPanelData = {
  memberships: [],
  courseAssignments: [],
  learningPathAssignments: [],
}

/**
 * Carga el estado agregado del usuario al abrir el panel y lo resetea al cerrar.
 * Si el agregado ya está en cache (prefetch por hover o reapertura reciente) no
 * se muestra skeleton. `refetchSilent` refresca tras mutaciones sin parpadeos.
 */
export function useMasterPanelData(userId: string, isOpen: boolean) {
  const [data, setData] = useState<UserMasterPanelData>(EMPTY_DATA)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setData(EMPTY_DATA)
      setError(null)
      return
    }
    let cancelled = false
    // Con cache fresca la promesa resuelve en el mismo tick: sin spinner.
    if (!hasFreshMasterPanelData(userId)) setIsLoading(true)
    getMasterPanelData(userId)
      .then((result) => {
        if (cancelled) return
        setData(result)
        setError(null)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, userId])

  const refetchSilent = useCallback(async () => {
    try {
      const result = await getMasterPanelData(userId, { bypassCache: true })
      setData(result)
      setError(null)
    } catch {
      // Silencioso: la mutación ya reportó su resultado vía toast; el estado
      // local optimista se mantiene y el próximo open recarga fresco.
    }
  }, [userId])

  return { data, isLoading, error, refetchSilent }
}
