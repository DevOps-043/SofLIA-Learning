'use client'

import { useEffect, useState } from 'react'

import { buildPlatformIntroTeaserSourceUrl } from '@/lib/media/platform-intro-teaser'

interface IntroTeaserResponse {
  success?: boolean
  videos?: string[]
}

/**
 * Resuelve el teaser institucional que se reproduce antes del tour de
 * onboarding (panel de negocio y dashboard del usuario).
 *
 * Arranca de forma sincrona con el MP4 original como fallback, para que el
 * tour nunca se quede sin video por latencia de red. Luego pide a la API la
 * variante HLS (cuando el teaser ya fue transcodificado) y, si llega, la
 * adopta para habilitar el selector de resolucion en el reproductor. Ante
 * cualquier fallo se conserva el fallback MP4.
 */
export function usePlatformIntroTeaser(): string[] {
  const [videos, setVideos] = useState<string[]>(() => {
    const fallback = buildPlatformIntroTeaserSourceUrl(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    )
    return fallback ? [fallback] : []
  })

  useEffect(() => {
    let cancelled = false

    fetch('/api/media/intro-teaser', { credentials: 'include' })
      .then((res) => (res.ok ? (res.json() as Promise<IntroTeaserResponse>) : null))
      .then((data) => {
        if (cancelled || !data?.success) return
        if (Array.isArray(data.videos) && data.videos.length > 0) {
          setVideos(data.videos)
        }
      })
      .catch(() => {
        // Silencioso: el fallback MP4 ya esta cargado en el estado inicial.
      })

    return () => {
      cancelled = true
    }
  }, [])

  return videos
}
