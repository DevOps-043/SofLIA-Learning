'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ComponentProps, useCallback } from 'react'

interface PrefetchLinkProps extends ComponentProps<typeof Link> {
  /**
   * Estrategia de prefetch
   * - 'hover': Prefetch al hacer hover (por defecto)
   * - 'immediate': Prefetch inmediato
   * - 'viewport': Prefetch cuando entra en el viewport
   */
  prefetchStrategy?: 'hover' | 'immediate' | 'viewport'
}

/**
 * Link mejorado con prefetch inteligente
 * Mejora la navegación precargando rutas estratégicamente
 */
export function PrefetchLink({ 
  prefetchStrategy = 'hover',
  children,
  href,
  onFocus,
  onMouseEnter,
  ...props 
}: PrefetchLinkProps) {
  const router = useRouter()
  
  const handleMouseEnter = useCallback<NonNullable<PrefetchLinkProps['onMouseEnter']>>((event) => {
    onMouseEnter?.(event)
    if (prefetchStrategy === 'hover' && typeof href === 'string') {
      router.prefetch(href)
    }
  }, [prefetchStrategy, href, onMouseEnter, router])

  const handleFocus = useCallback<NonNullable<PrefetchLinkProps['onFocus']>>((event) => {
    onFocus?.(event)
    if (prefetchStrategy === 'hover' && typeof href === 'string') {
      router.prefetch(href)
    }
  }, [prefetchStrategy, href, onFocus, router])

  return (
    <Link 
      href={href}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      {...props}
    >
      {children}
    </Link>
  )
}
