'use client'

import { useCallback, useState } from 'react'
import useSWR from 'swr'
import { getAdminApiErrorMessage } from '../services/admin-api-errors'
import type { AdminCompany, CompanyCreatePayload, CompanyStats } from '../types/admin-companies.types'

interface AdminCompaniesResponse {
  success?: boolean
  companies?: AdminCompany[]
  stats?: CompanyStats | null
  error?: string
  message?: string
  details?: unknown
}

interface UseAdminCompaniesReturn {
  companies: AdminCompany[]
  stats: CompanyStats | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  updatingId: string | null
  updateCompany: (companyId: string, payload: Partial<Pick<AdminCompany, 'is_active' | 'subscription_plan' | 'subscription_status' | 'max_users'>>) => Promise<void>
  createCompany: (payload: CompanyCreatePayload) => Promise<void>
  actionError: string | null
}

async function fetchAdminCompanies(url: string): Promise<AdminCompaniesResponse> {
  const response = await fetch(url, { credentials: 'include' })
  const data = (await response.json().catch(() => null)) as AdminCompaniesResponse | null

  if (!response.ok || !data?.success) {
    throw new Error(getAdminApiErrorMessage(data, 'Error al obtener empresas'))
  }

  return data
}

export function useAdminCompanies(): UseAdminCompaniesReturn {
  const [actionError, setActionError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<AdminCompaniesResponse>('/api/admin/companies', fetchAdminCompanies, {
    dedupingInterval: 60000,
    errorRetryCount: 1,
    keepPreviousData: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  })

  const fetchCompanies = useCallback(async () => {
    await mutate()
  }, [mutate])

  const updateCompany = useCallback(
    async (companyId: string, payload: Partial<Pick<AdminCompany, 'is_active' | 'subscription_plan' | 'subscription_status' | 'max_users'>>) => {
      try {
        setUpdatingId(companyId)
        setActionError(null)
        const response = await fetch(`/api/admin/companies/${companyId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(getAdminApiErrorMessage(errorData, 'Error al actualizar la empresa'))
        }

        await mutate()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        setActionError(message)
        throw err
      } finally {
        setUpdatingId(null)
      }
    },
    [mutate]
  )

  const createCompany = useCallback(
    async (payload: CompanyCreatePayload) => {
      try {
        setActionError(null)
        const response = await fetch('/api/admin/companies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(getAdminApiErrorMessage(errorData, 'Error al crear la empresa'))
        }

        await mutate()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        setActionError(message)
        throw err
      }
    },
    [mutate]
  )

  return {
    companies: data?.companies || [],
    stats: data?.stats || null,
    isLoading: isLoading && !data,
    error: error instanceof Error ? error.message : null,
    refetch: fetchCompanies,
    updatingId,
    updateCompany,
    createCompany,
    actionError
  }
}
