'use client'

import { Component, isValidElement } from 'react'
import type { ComponentType, ErrorInfo, ReactNode } from 'react'
import dynamic from 'next/dynamic'
import type { Props as JoyrideProps, Step } from 'react-joyride'

type JoyrideModuleShape = {
  Component?: unknown
  Joyride?: unknown
  default?: unknown
}

function isJoyrideComponent(value: unknown): value is ComponentType<JoyrideProps> {
  return typeof value === 'function'
}

function resolveJoyrideModule(moduleValue: unknown): ComponentType<JoyrideProps> {
  if (isJoyrideComponent(moduleValue)) {
    return moduleValue
  }

  const moduleObject = moduleValue as JoyrideModuleShape | null
  const candidates = [
    moduleObject?.default,
    (moduleObject?.default as JoyrideModuleShape | null)?.default,
    moduleObject?.Joyride,
    moduleObject?.Component,
  ]

  for (const candidate of candidates) {
    if (isJoyrideComponent(candidate)) {
      return candidate
    }
  }

  const availableExports =
    typeof moduleValue === 'object' && moduleValue !== null
      ? Object.keys(moduleValue).join(', ')
      : typeof moduleValue

  throw new Error(
    `react-joyride component export could not be resolved. Available exports: ${availableExports}`,
  )
}

// Canonical next/dynamic pattern: native ESM import() so webpack/SWC
// produce a stable chunk in production builds. Using require() inside a
// Promise.resolve wrapper was returning a different CommonJS interop shape
// in production than in development, which caused step props (notably
// disableBeacon) to be silently dropped by the resolved component.
const DynamicJoyride = dynamic<JoyrideProps>(
  () => import('react-joyride').then((mod) => resolveJoyrideModule(mod)),
  {
    loading: () => null,
    ssr: false,
  },
)

type JoyrideErrorBoundaryProps = {
  children: ReactNode
}

type JoyrideErrorBoundaryState = {
  hasError: boolean
}

// Joyride mounts a portal to document.body. A render error inside the
// portal can leave the page covered by a transparent overlay (`<body>`
// scroll-locked, pointer-events absorbed by joyride's spotlight). The
// boundary contains the failure to the tour subtree so the rest of the
// page stays interactive. The error is reported to the server-side
// console — surface it in your Netlify function logs if it triggers.
class JoyrideErrorBoundary extends Component<
  JoyrideErrorBoundaryProps,
  JoyrideErrorBoundaryState
> {
  state: JoyrideErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): JoyrideErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[JoyrideClient] render failure suppressed:', error, info)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

export function JoyrideClient(props: JoyrideProps) {
  const steps = normalizeJoyrideSteps(props.steps)
  const run = Boolean(props.run && steps.length > 0)

  return (
    <JoyrideErrorBoundary>
      <DynamicJoyride {...props} run={run} steps={steps} />
    </JoyrideErrorBoundary>
  )
}

export function isRenderableJoyrideIcon(icon: unknown): boolean {
  return isValidElement(icon)
}

function normalizeJoyrideSteps(steps: JoyrideProps['steps']): Step[] {
  if (!Array.isArray(steps)) {
    return []
  }

  return steps.map((step) => ({
    ...step,
    disableBeacon: true,
  }))
}
