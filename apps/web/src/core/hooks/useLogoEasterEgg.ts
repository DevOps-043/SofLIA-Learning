'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function useLogoEasterEgg() {
  const [clickCount, setClickCount] = useState(0)
  const [isActivated, setIsActivated] = useState(false)
  const router = useRouter()
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null)
  const dashboardRedirectRef = useRef<NodeJS.Timeout | null>(null)
  const clickCountRef = useRef(0)

  const resetClickCount = useCallback(() => {
    clickCountRef.current = 0
    setClickCount(0)
  }, [])

  const handleLogoClick = useCallback(() => {
    // Limpiar el temporizador anterior si existe
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
    }
    
    // Cancelar redirección al dashboard si existe
    if (dashboardRedirectRef.current) {
      clearTimeout(dashboardRedirectRef.current)
      dashboardRedirectRef.current = null
    }

    const newCount = clickCountRef.current + 1
    clickCountRef.current = newCount
    setClickCount(newCount)
    
    // Mostrar feedback discreto en consola
    
    // Si llega a 5 clics consecutivos, redirigir a easteregg
    if (newCount >= 5) {
      setIsActivated(true)
      
      // Pequeño delay para el efecto visual
      setTimeout(() => {
        router.push('/easteregg')
        resetClickCount()
      }, 500)
      
      return
    }
    
    // Si es el primer clic, programar redirección a dashboard después de un delay
    // Esto permite que el usuario pueda hacer más clics antes de que se ejecute la redirección
    if (newCount === 1) {
      dashboardRedirectRef.current = setTimeout(() => {
        // Solo redirigir si el contador sigue en 1 (no se incrementó a 5)
        if (clickCountRef.current === 1) {
          router.push('/dashboard')
          resetClickCount()
        }
        dashboardRedirectRef.current = null
      }, 500) // Delay de 500ms para permitir más clics
    }
    
    // Establecer un temporizador para resetear el contador si no hay otro clic en 500ms
    clickTimerRef.current = setTimeout(() => {
      resetClickCount()
    }, 500)
  }, [resetClickCount, router])

  // Resetear estado de activación después de navegar
  useEffect(() => {
    if (isActivated) {
      const timer = setTimeout(() => {
        setIsActivated(false)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isActivated])

  // Cleanup del timer al desmontar
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current)
      }
      if (dashboardRedirectRef.current) {
        clearTimeout(dashboardRedirectRef.current)
      }
    }
  }, [])

  return {
    clickCount,
    isActivated,
    handleLogoClick
  }
}
