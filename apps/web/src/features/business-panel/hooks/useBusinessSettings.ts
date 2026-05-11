import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'

export interface OrganizationData {
  id: string
  name: string
  description?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  website_url?: string | null
  logo_url?: string | null
  brand_logo_url?: string | null
  brand_favicon_url?: string | null
  favicon_url?: string | null
  slug?: string | null
  subscription_plan?: string
  subscription_status?: string
  subscription_start_date?: string | null
  subscription_end_date?: string | null
  billing_cycle?: 'monthly' | 'yearly' | null
  max_users?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
  google_login_enabled?: boolean
  microsoft_login_enabled?: boolean
  show_navbar_name?: boolean
  industry?: string | null
  company_size?: string | null
  company_type?: string | null
  company_mission?: string | null
  company_country?: string | null
}

export interface SubscriptionData {
  plan: string
  status: string
  start_date?: string | null
  end_date?: string | null
  is_expired: boolean
  days_until_expiration?: number | null
  is_expiring_soon: boolean
  user_subscriptions: Record<string, unknown>[]
}

export interface BusinessSettingsData {
  organization: OrganizationData | null
  subscription: SubscriptionData | null
  userRole?: 'owner' | 'admin' | 'member' | null
}

/**
 * Hook para obtener y actualizar la configuración de la organización.
 *
 * IMPORTANTE: Este hook usa el orgSlug de la URL para asegurar
 * que se obtengan los datos de la organización correcta cuando
 * un usuario pertenece a múltiples organizaciones.
 */
export function useBusinessSettings() {
  const params = useParams()
  const orgSlug = params?.orgSlug as string | undefined

  const [data, setData] = useState<BusinessSettingsData>({
    organization: null,
    subscription: null,
    userRole: null
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    // Si no hay orgSlug, no podemos obtener datos org-scoped
    if (!orgSlug) {
      setError('No se pudo determinar la organización')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Usar la API org-scoped para obtener datos de la organización correcta
      const response = await fetch(`/api/${orgSlug}/business/settings`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        setData({
          organization: result.organization,
          subscription: result.subscription || null,
          userRole: result.userRole || null
        })
      } else {
        throw new Error(result.error || 'Error al obtener datos de configuración')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar configuración'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [orgSlug])

  const updateOrganization = useCallback(async (updateData: Partial<OrganizationData>): Promise<boolean> => {
    if (!orgSlug) {
      setError('No se pudo determinar la organización')
      return false
    }

    try {
      setError(null)

      // Usar la API org-scoped para actualizar
      const response = await fetch(`/api/${orgSlug}/business/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || `Error ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.organization) {
        setData(prev => ({
          ...prev,
          organization: result.organization
        }))
        return true
      } else {
        throw new Error(result.error || 'Error al actualizar la organización')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar la organización'
      setError(errorMessage)
      return false
    }
  }, [orgSlug])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    data,
    isLoading,
    error,
    refetch: fetchSettings,
    updateOrganization,
    orgSlug
  }
}

