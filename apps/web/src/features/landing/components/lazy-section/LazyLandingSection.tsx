'use client'

import {
  type ComponentType,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'

interface LazyLandingSectionProps {
  anchorId?: string
  children: ReactNode
  className?: string
  minHeightClassName?: string
  rootMargin?: string
}

interface LazyLandingModuleProps {
  anchorId?: string
  className?: string
  load: () => Promise<ComponentType>
  minHeightClassName?: string
  rootMargin?: string
}

export function LandingSectionFallback({
  minHeightClassName = 'min-h-[360px]',
}: {
  minHeightClassName?: string
}) {
  return <div aria-hidden className={minHeightClassName} />
}

function useLazyActivation(rootMargin: string) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (shouldRender) {
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    if (!('IntersectionObserver' in window)) {
      const fallbackTimer = globalThis.setTimeout(() => setShouldRender(true), 1)
      return () => globalThis.clearTimeout(fallbackTimer)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return
        }

        setShouldRender(true)
        observer.disconnect()
      },
      { rootMargin },
    )

    const currentSection = sectionRef.current
    if (currentSection) {
      observer.observe(currentSection)
    }

    return () => observer.disconnect()
  }, [rootMargin, shouldRender])

  return { sectionRef, shouldRender }
}

export function LazyLandingSection({
  anchorId,
  children,
  className,
  minHeightClassName = 'min-h-[360px]',
  rootMargin = '900px 0px',
}: LazyLandingSectionProps) {
  const { sectionRef, shouldRender } = useLazyActivation(rootMargin)

  return (
    <div
      ref={sectionRef}
      id={shouldRender ? undefined : anchorId}
      className={className}
    >
      {shouldRender ? (
        children
      ) : (
        <LandingSectionFallback minHeightClassName={minHeightClassName} />
      )}
    </div>
  )
}

export function LazyLandingModule({
  anchorId,
  className,
  load,
  minHeightClassName = 'min-h-[360px]',
  rootMargin = '900px 0px',
}: LazyLandingModuleProps) {
  const { sectionRef, shouldRender } = useLazyActivation(rootMargin)
  const [LoadedComponent, setLoadedComponent] = useState<ComponentType | null>(null)

  useEffect(() => {
    if (!shouldRender || LoadedComponent) {
      return
    }

    let isCancelled = false

    load().then((Component) => {
      if (!isCancelled) {
        setLoadedComponent(() => Component)
      }
    })

    return () => {
      isCancelled = true
    }
  }, [LoadedComponent, load, shouldRender])

  return (
    <div
      ref={sectionRef}
      id={LoadedComponent ? undefined : anchorId}
      className={className}
    >
      {LoadedComponent ? (
        <LoadedComponent />
      ) : (
        <LandingSectionFallback minHeightClassName={minHeightClassName} />
      )}
    </div>
  )
}
