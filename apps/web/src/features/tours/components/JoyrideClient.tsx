'use client'

import { Component, isValidElement, useEffect, useState } from 'react'
import type { ComponentType, CSSProperties, ErrorInfo, ReactNode } from 'react'
import type {
  EventData,
  FloatingOptions,
  Options,
  Props as JoyrideProps,
  Step,
  Styles,
} from 'react-joyride'

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

type LegacyJoyrideStyles = Partial<Styles> & {
  options?: {
    arrowColor?: string
    primaryColor?: string
    zIndex?: number
  }
}

export type JoyrideClientProps = Omit<
  JoyrideProps,
  'onEvent' | 'options' | 'styles'
> & {
  callback?: (data: EventData) => void
  disableCloseOnEsc?: boolean
  disableOverlay?: boolean
  disableOverlayClose?: boolean
  disableScrolling?: boolean
  floatingOptions?: Partial<FloatingOptions>
  floaterProps?: {
    hideArrow?: boolean
    offset?: number
    styles?: {
      floater?: CSSProperties
    }
  }
  hideCloseButton?: boolean
  scrollOffset?: number
  showProgress?: boolean
  showSkipButton?: boolean
  spotlightClicks?: boolean
  spotlightPadding?: Step['spotlightPadding']
  styles?: LegacyJoyrideStyles
}

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

export function JoyrideClient(props: JoyrideClientProps) {
  const [JoyrideComponent, setJoyrideComponent] =
    useState<ComponentType<JoyrideProps> | null>(null)
  const steps = normalizeJoyrideSteps(props.steps)
  const run = Boolean(props.run && steps.length > 0)
  const joyrideProps = toJoyrideV3Props(props, run, steps)

  useEffect(() => {
    let cancelled = false

    import('react-joyride')
      .then((mod) => {
        if (!cancelled) {
          setJoyrideComponent(() => resolveJoyrideModule(mod))
        }
      })
      .catch((error) => {
        console.error('[JoyrideClient] react-joyride import failed:', error)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!JoyrideComponent) {
    return null
  }

  return (
    <JoyrideErrorBoundary>
      <JoyrideComponent {...joyrideProps} />
    </JoyrideErrorBoundary>
  )
}

export function isRenderableJoyrideIcon(icon: unknown): boolean {
  return isValidElement(icon)
}

export function normalizeJoyrideSteps(steps: JoyrideProps['steps']): Step[] {
  if (!Array.isArray(steps)) {
    return []
  }

  return steps.map((step: Step & { disableBeacon?: boolean }) => {
    const { disableBeacon: _disableBeacon, styles, ...rest } = step
    const sanitizedStyles = sanitizeJoyrideStepStyles(styles)

    return omitUndefinedValues({
      ...rest,
      styles: sanitizedStyles,
      skipBeacon: step.skipBeacon ?? step.disableBeacon ?? true,
    }) as Step
  })
}

function sanitizeJoyrideStepStyles(styles: Step['styles']): Step['styles'] {
  if (!styles) {
    return undefined
  }

  const {
    borderRadius: _legacySpotlightBorderRadius,
    zIndex: _legacySpotlightZIndex,
    ...spotlightStyles
  } = styles.spotlight ?? {}

  return omitUndefinedValues({
    ...styles,
    spotlight: Object.keys(spotlightStyles).length > 0 ? spotlightStyles : undefined,
  }) as Step['styles']
}

export function toJoyrideV3Props(
  props: JoyrideClientProps,
  run: boolean,
  steps: Step[],
): JoyrideProps {
  const {
    callback,
    disableCloseOnEsc,
    disableOverlay,
    disableOverlayClose,
    disableScrolling,
    floaterProps,
    hideCloseButton,
    scrollOffset,
    showProgress,
    showSkipButton,
    spotlightPadding,
    styles,
    ...rest
  } = props

  const legacyOptions = styles?.options ?? {}
  const { options: _legacyStyleOptions, ...joyrideStyles } = styles ?? {}
  const {
    borderRadius: _legacySpotlightBorderRadius,
    zIndex: _legacySpotlightZIndex,
    ...spotlightStyles
  } = joyrideStyles.spotlight ?? {}
  const buttons = ['back', 'primary'] as NonNullable<Step['buttons']>

  if (!hideCloseButton) {
    buttons.push('close')
  }

  if (showSkipButton) {
    buttons.push('skip')
  }

  const baseZIndex = legacyOptions.zIndex ?? 10000
  const options = omitUndefinedValues<Partial<Options>>({
    arrowColor: legacyOptions.arrowColor,
    blockTargetInteraction: props.spotlightClicks === false,
    buttons,
    closeButtonAction: 'skip',
    dismissKeyAction: disableCloseOnEsc ? false : 'close',
    hideOverlay: disableOverlay,
    offset: floaterProps?.offset,
    overlayClickAction: disableOverlayClose ? false : 'close',
    primaryColor: legacyOptions.primaryColor,
    scrollOffset,
    showProgress,
    skipScroll: disableScrolling,
    spotlightPadding,
    spotlightRadius:
      typeof styles?.spotlight?.borderRadius === 'number'
        ? styles.spotlight.borderRadius
        : 16,
    targetWaitTimeout: 1600,
    zIndex: baseZIndex,
  })

  return {
    ...rest,
    floatingOptions: {
      hideArrow: floaterProps?.hideArrow,
      ...props.floatingOptions,
    },
    onEvent: callback,
    options,
    run,
    steps,
    styles: {
      ...joyrideStyles,
      floater: {
        zIndex: baseZIndex + 2,
        ...(styles?.floater ?? {}),
        ...(floaterProps?.styles?.floater ?? {}),
      },
      tooltip: {
        zIndex: baseZIndex + 2,
        ...(styles?.tooltip ?? {}),
      },
      spotlight: spotlightStyles,
    },
  }
}

function omitUndefinedValues<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter((entry) => entry[1] !== undefined),
  ) as T
}
