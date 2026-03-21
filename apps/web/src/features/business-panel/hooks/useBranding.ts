import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useOrganizationStore } from '@/core/stores/organizationStore'
import { detectColorsFromImage } from '../utils/colorDetection'

export interface BrandingData {
  logo_url: string | null
  favicon_url: string | null
  banner_url: string | null
  color_primary: string
  color_secondary: string
  color_accent: string
  font_family: string
}

export interface UseBrandingReturn {
  branding: BrandingData | null
  isLoading: boolean
  error: string | null
  updateBranding: (data: Partial<BrandingData>) => Promise<boolean>
  detectColors: (imageUrl: string) => Promise<{ color_primary: string; color_secondary: string; color_accent: string } | null>
  refetch: () => Promise<void>
}

/**
 * Hook para obtener y actualizar la configuración de branding.
 *
 * IMPORTANTE: Este hook usa el orgSlug de la URL para asegurar
 * que se obtengan los datos de la organización correcta.
 * Fallback: Si no hay orgSlug en la URL, usa el de la organización actual del store.
 */
export function useBranding(): UseBrandingReturn {
  const params = useParams()
  const urlOrgSlug = params?.orgSlug as string | undefined
  const currentOrgSlug = useOrganizationStore(state => state.currentOrganization?.slug)
  const orgSlug = urlOrgSlug || currentOrgSlug

  const [branding, setBranding] = useState<BrandingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBranding = useCallback(async () => {
    if (!orgSlug) {
      setError('No se pudo determinar la organización')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Usar la API org-scoped
      const response = await fetch(`/api/${orgSlug}/business/branding`, {
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al obtener configuración de branding')
      }

      setBranding(data.branding)
    } catch (err: any) {
      setError(err.message || 'Error al cargar branding')
      setBranding(null)
    } finally {
      setIsLoading(false)
    }
  }, [orgSlug])

  const updateBranding = useCallback(async (data: Partial<BrandingData>): Promise<boolean> => {
    if (!orgSlug) {
      setError('No se pudo determinar la organización')
      return false
    }

    try {
      setError(null)

      // Usar la API org-scoped
      const response = await fetch(`/api/${orgSlug}/business/branding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al actualizar branding')
      }

      setBranding(result.branding)
      return true
    } catch (err: any) {
      setError(err.message || 'Error al actualizar branding')
      return false
    }
  }, [orgSlug])

  const detectColors = async (imageUrl: string): Promise<{ color_primary: string; color_secondary: string; color_accent: string } | null> => {
    try {
      setError(null)

      // Validar que la URL sea válida
      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error('URL de imagen inválida')
      }

      // Validar que sea una URL válida
      try {
        new URL(imageUrl)
      } catch {
        throw new Error('La URL de la imagen no es válida')
      }

      // Usar detección de colores en el cliente usando Canvas API
      const colors = await detectColorsFromImage(imageUrl)

      if (!colors) {
        throw new Error('No se pudieron detectar colores de la imagen')
      }

      return colors
    } catch (err: any) {
      const errorMessage = err.message || 'Error al detectar colores de la imagen'
      setError(errorMessage)
      console.error('Error detectando colores:', err)
      return null
    }
  }

  useEffect(() => {
    fetchBranding()
  }, [fetchBranding])

  return {
    branding,
    isLoading,
    error,
    updateBranding,
    detectColors,
    refetch: fetchBranding
  }
}

