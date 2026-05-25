'use client'

import { useEffect, useState } from 'react'
import type { BusinessPageContent } from '@aprende-y-aplica/shared'
import { ContentService } from '@/core/services/contentService'
import type { LoadingParticle } from './types'

function createLoadingParticles(): LoadingParticle[] {
  return Array.from({ length: 6 }, () => ({
    left: Math.random() * 100,
    top: Math.random() * 100,
    xOffset: Math.random() * 20 - 10,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
  }))
}

export function useBusinessHomeContent() {
  const [content, setContent] = useState<BusinessPageContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [particles, setParticles] = useState<LoadingParticle[]>([])

  useEffect(() => {
    async function loadContent() {
      try {
        setLoading(true)
        const result = await ContentService.getBusinessPageContent()
        if (result.error) setError(result.error)
        else if (result.data) setContent(result.data)
      } catch {
        setError('Error al cargar el contenido')
      } finally {
        setLoading(false)
      }
    }
    loadContent()
  }, [])

  useEffect(() => {
    setParticles(createLoadingParticles())
  }, [])

  return { content, loading, error, particles }
}
