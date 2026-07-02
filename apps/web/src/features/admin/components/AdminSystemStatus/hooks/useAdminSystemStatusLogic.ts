'use client'

import { useCallback, useState } from 'react'
import useSWR from 'swr'

import type { StatusComponentKey } from '@aprende-y-aplica/shared'

import type { ToastType } from '@/core/components/ToastNotification/ToastNotification'
import type { AdminStatusResponse } from '../types'

const REFRESH_INTERVAL_MS = 60_000

async function fetchAdminStatus(url: string): Promise<AdminStatusResponse> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('ADMIN_STATUS_FETCH_FAILED')
  }
  return response.json()
}

export function useAdminSystemStatusLogic() {
  const { data, error, isLoading, mutate } = useSWR<AdminStatusResponse>(
    '/api/admin/status',
    fetchAdminStatus,
    { refreshInterval: REFRESH_INTERVAL_MS, revalidateOnFocus: false },
  )

  const [runningComponent, setRunningComponent] = useState<StatusComponentKey | null>(null)
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({
    isOpen: false,
    message: '',
    type: 'success',
  })

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ isOpen: true, message, type })
  }, [])

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isOpen: false }))
  }, [])

  const runCheck = useCallback(
    async (componentKey: StatusComponentKey): Promise<{ ok: boolean }> => {
      setRunningComponent(componentKey)
      try {
        const response = await fetch('/api/admin/status/run-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ componentKey }),
        })

        if (!response.ok) {
          return { ok: false }
        }

        await mutate()
        return { ok: true }
      } catch {
        return { ok: false }
      } finally {
        setRunningComponent(null)
      }
    },
    [mutate],
  )

  return {
    checks: data?.checks ?? [],
    circuitBreakers: data?.circuitBreakers ?? [],
    generatedAt: data?.generatedAt ?? null,
    error,
    isLoading,
    runningComponent,
    runCheck,
    toast,
    showToast,
    hideToast,
  }
}
