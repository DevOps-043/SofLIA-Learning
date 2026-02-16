'use client'

import { useState } from 'react'
import type { JoinCompanyData } from '../types'

export function useJoinCompany() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitJoinRequest = async (data: JoinCompanyData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/organizations/join-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        setError(result.error || 'Error al enviar la solicitud')
        return false
      }

      return true
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return { submitJoinRequest, isSubmitting, error }
}
