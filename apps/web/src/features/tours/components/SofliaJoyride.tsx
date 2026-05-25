'use client'

import { useCallback, useMemo } from 'react'
import {
  Joyride as ReactJoyride,
  type Controls,
  type EventData,
  type EventHandler,
  type FloatingOptions,
  type Options,
  type PartialDeep,
  type Step,
  type Styles,
} from 'react-joyride'

import type {
  SofliaJoyrideProps,
  SofliaJoyrideStep,
  SofliaLegacyFloaterProps,
  SofliaLegacyStyles,
} from '../types/joyride'

function resolveSpotlightRadius(
  styles: SofliaLegacyStyles | undefined,
  fallback: number | undefined,
): number | undefined {
  const borderRadius = styles?.spotlight?.borderRadius

  if (typeof borderRadius === 'number') {
    return borderRadius
  }

  if (typeof borderRadius === 'string') {
    const parsed = Number.parseFloat(borderRadius)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

function resolveOptionsFromLegacyStyles(
  styles: SofliaLegacyStyles | undefined,
): Partial<Options> {
  const options: Partial<Options> = {}
  const legacyOptions = styles?.options

  if (!legacyOptions) {
    return options
  }

  if (legacyOptions.arrowColor) options.arrowColor = legacyOptions.arrowColor
  if (legacyOptions.backgroundColor) options.backgroundColor = legacyOptions.backgroundColor
  if (legacyOptions.overlayColor) options.overlayColor = legacyOptions.overlayColor
  if (legacyOptions.primaryColor) options.primaryColor = legacyOptions.primaryColor
  if (legacyOptions.textColor) options.textColor = legacyOptions.textColor
  if (legacyOptions.width) options.width = legacyOptions.width
  if (typeof legacyOptions.zIndex === 'number') options.zIndex = legacyOptions.zIndex

  const overlayBackground = styles?.overlay?.backgroundColor
  if (typeof overlayBackground === 'string') {
    options.overlayColor = overlayBackground
  }

  return options
}

function normalizeFloatingOptions(
  floatingOptions: Partial<FloatingOptions> | undefined,
  floaterProps: SofliaLegacyFloaterProps | undefined,
): Partial<FloatingOptions> | undefined {
  if (!floaterProps?.hideArrow) {
    return floatingOptions
  }

  return {
    ...floatingOptions,
    hideArrow: true,
  }
}

function normalizeLegacyStyles(
  styles: SofliaLegacyStyles | undefined,
  floaterProps: SofliaLegacyFloaterProps | undefined,
): PartialDeep<Styles> | undefined {
  if (!styles && !floaterProps) {
    return undefined
  }

  const {
    options: _legacyOptions,
    spotlight: legacySpotlight,
    floater,
    tooltip,
    ...rest
  } = styles ?? {}

  const normalized: PartialDeep<Styles> = { ...rest }

  if (legacySpotlight) {
    const { borderRadius: _borderRadius, ...spotlight } = legacySpotlight
    normalized.spotlight = spotlight as Styles['spotlight']
  }

  if (floater || floaterProps?.styles?.floater) {
    normalized.floater = {
      ...(floater ?? {}),
      ...(floaterProps?.styles?.floater ?? {}),
    } as Styles['floater']
  }

  if (tooltip || floaterProps?.disableAnimation) {
    normalized.tooltip = {
      ...(tooltip ?? {}),
      ...(floaterProps?.disableAnimation ? { transition: 'none' } : {}),
    } as Styles['tooltip']
  }

  return normalized
}

function normalizeStep(step: SofliaJoyrideStep): Step {
  const {
    disableBeacon,
    disableScrolling,
    floatingOptions,
    floaterProps,
    spotlightClicks,
    styles,
    ...rest
  } = step

  const options: Partial<Options> = {
    ...resolveOptionsFromLegacyStyles(styles),
  }

  const spotlightRadius = resolveSpotlightRadius(styles, undefined)
  if (typeof spotlightRadius === 'number') options.spotlightRadius = spotlightRadius
  if (typeof disableBeacon === 'boolean') options.skipBeacon = disableBeacon
  if (typeof disableScrolling === 'boolean') options.skipScroll = disableScrolling
  if (typeof spotlightClicks === 'boolean') {
    options.blockTargetInteraction = !spotlightClicks
  }
  if (typeof floaterProps?.offset === 'number') {
    options.offset = floaterProps.offset
  }

  return {
    ...rest,
    ...options,
    floatingOptions: normalizeFloatingOptions(floatingOptions, floaterProps),
    styles: normalizeLegacyStyles(styles, floaterProps),
  }
}

function resolveButtons({
  hideCloseButton,
  showSkipButton,
}: Pick<SofliaJoyrideProps, 'hideCloseButton' | 'showSkipButton'>): Options['buttons'] {
  const buttons: Options['buttons'] = ['back']

  if (!hideCloseButton) {
    buttons.push('close')
  }

  buttons.push('primary')

  if (showSkipButton) {
    buttons.push('skip')
  }

  return buttons
}

export function SofliaJoyride({
  callback,
  disableCloseOnEsc,
  disableFocus,
  disableOverlay,
  disableOverlayClose,
  disableScrollParentFix: _disableScrollParentFix,
  disableScrolling,
  floaterProps,
  hideCloseButton,
  onEvent,
  options,
  scrollOffset,
  showProgress,
  showSkipButton,
  spotlightClicks,
  spotlightPadding,
  spotlightRadius,
  steps,
  styles,
  floatingOptions,
  ...props
}: SofliaJoyrideProps) {
  const normalizedSteps = useMemo(() => steps.map(normalizeStep), [steps])

  const normalizedOptions = useMemo<Partial<Options>>(() => {
    const nextOptions: Partial<Options> = {
      ...resolveOptionsFromLegacyStyles(styles),
      ...options,
    }

    if (typeof disableCloseOnEsc === 'boolean') {
      nextOptions.dismissKeyAction = disableCloseOnEsc ? false : 'close'
    }

    if (typeof disableFocus === 'boolean') {
      nextOptions.disableFocusTrap = disableFocus
    }

    if (typeof disableOverlay === 'boolean') {
      nextOptions.hideOverlay = disableOverlay
    }

    if (typeof disableOverlayClose === 'boolean') {
      nextOptions.overlayClickAction = disableOverlayClose ? false : 'close'
    }

    if (typeof disableScrolling === 'boolean') {
      nextOptions.skipScroll = disableScrolling
    }

    if (typeof floaterProps?.offset === 'number') {
      nextOptions.offset = floaterProps.offset
    }

    if (typeof scrollOffset === 'number') {
      nextOptions.scrollOffset = scrollOffset
    }

    if (typeof showProgress === 'boolean') {
      nextOptions.showProgress = showProgress
    }

    if (
      typeof showSkipButton === 'boolean' ||
      typeof hideCloseButton === 'boolean'
    ) {
      nextOptions.buttons = resolveButtons({ hideCloseButton, showSkipButton })
    }

    if (typeof spotlightClicks === 'boolean') {
      nextOptions.blockTargetInteraction = !spotlightClicks
    }

    if (typeof spotlightPadding !== 'undefined') {
      nextOptions.spotlightPadding = spotlightPadding
    }

    const resolvedSpotlightRadius = resolveSpotlightRadius(styles, spotlightRadius)
    if (typeof resolvedSpotlightRadius === 'number') {
      nextOptions.spotlightRadius = resolvedSpotlightRadius
    }

    return nextOptions
  }, [
    disableCloseOnEsc,
    disableFocus,
    disableOverlay,
    disableOverlayClose,
    disableScrolling,
    floaterProps,
    hideCloseButton,
    options,
    scrollOffset,
    showProgress,
    showSkipButton,
    spotlightClicks,
    spotlightPadding,
    spotlightRadius,
    styles,
  ])

  const normalizedStyles = useMemo(
    () => normalizeLegacyStyles(styles, floaterProps),
    [floaterProps, styles],
  )

  const normalizedFloatingOptions = useMemo(
    () => normalizeFloatingOptions(floatingOptions, floaterProps),
    [floatingOptions, floaterProps],
  )

  const handleEvent = useCallback<EventHandler>(
    (data: EventData, controls: Controls) => {
      onEvent?.(data, controls)
      void callback?.(data)
    },
    [callback, onEvent],
  )

  return (
    <ReactJoyride
      {...props}
      floatingOptions={normalizedFloatingOptions}
      onEvent={handleEvent}
      options={normalizedOptions}
      steps={normalizedSteps}
      styles={normalizedStyles}
    />
  )
}

export { SofliaJoyride as Joyride }
