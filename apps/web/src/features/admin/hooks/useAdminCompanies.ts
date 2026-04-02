'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AdminCompany, CompanyCreatePayload, CompanyStats } from '../types/admin-companies.types'

interface UseAdminCompaniesReturn {
  companies: AdminCompany[]
  stats: CompanyStats | null
  isLoading: boolean
  error: string | null
  refetch: () => void
  updatingId: string | null
  updateCompany: (companyId: string, payload: Partial<Pick<AdminCompany, 'is_active' | 'subscription_plan' | 'subscription_status' | 'max_users'>>) => Promise<void>
  createCompany: (payload: CompanyCreatePayload) => Promise<void>
  actionError: string | null
}

export function useAdminCompanies(): UseAdminCompaniesReturn {
  const [companies, setCompanies] = useState<AdminCompany[]>([])
  const [stats, setStats] = useState<CompanyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchCompanies = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/admin/companies')

      if (!response.ok) {
        throw new Error('Error al obtener empresas')
      }

      const data = await response.json()
      setCompanies(data.companies || [])
      setStats(data.stats || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }, [])

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
          throw new Error(errorData.error || 'Error al actualizar la empresa')
        }

        await fetchCompanies()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        setActionError(message)
        throw err
      } finally {
        setUpdatingId(null)
      }
    },
    [fetchCompanies]
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
          throw new Error(errorData.error || 'Error al crear la empresa')
        }

        await fetchCompanies()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        setActionError(message)
        throw err
      }
    },
    [fetchCompanies]
  )

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  return {
    companies,
    stats,
    isLoading,
    error,
    refetch: fetchCompanies,
    updatingId,
    updateCompany,
    createCompany,
    actionError
  }
}
