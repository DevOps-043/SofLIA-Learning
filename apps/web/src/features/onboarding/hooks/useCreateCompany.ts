'use client'

import { useState } from 'react'
import type { CreateCompanyData } from '../types'

export function useCreateCompany() {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createCompany = async (data: CreateCompanyData) => {
    setIsCreating(true)
    setError(null)

    try {
      const res = await fetch('/api/organizations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        setError(result.error || 'Error al crear la empresa')
        return false
      }

      return true
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
      return false
    } finally {
      setIsCreating(false)
    }
  }

  return { createCompany, isCreating, error }
}
