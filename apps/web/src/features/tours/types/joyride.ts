import type { CSSProperties } from 'react'
import type {
  EventData,
  EventHandler,
  FloatingOptions,
  Options,
  Props as JoyrideProps,
  SpotlightPadding,
  Step,
  Styles,
} from 'react-joyride'

export type SofliaJoyrideEvent = EventData
export type SofliaJoyrideEventHandler = (data: SofliaJoyrideEvent) => void | Promise<void>

export interface SofliaLegacyFloaterProps {
  disableAnimation?: boolean
  hideArrow?: boolean
  offset?: number
  styles?: {
    floater?: CSSProperties
  }
}

export type SofliaLegacyStyleBlock = Record<string, unknown>

export type SofliaLegacySpotlightStyles = SofliaLegacyStyleBlock & {
  borderRadius?: number | string
}

export type SofliaLegacyStyleOptions = Partial<
  Pick<
    Options,
    | 'arrowColor'
    | 'backgroundColor'
    | 'overlayColor'
    | 'primaryColor'
    | 'textColor'
    | 'width'
    | 'zIndex'
  >
>

export type SofliaLegacyStyles = Partial<
  Record<Exclude<keyof Styles, 'spotlight'>, SofliaLegacyStyleBlock>
> & {
  options?: SofliaLegacyStyleOptions
  spotlight?: SofliaLegacySpotlightStyles
}

export type SofliaJoyrideStep = Omit<Step, 'styles'> & {
  disableBeacon?: boolean
  disableScrolling?: boolean
  floaterProps?: SofliaLegacyFloaterProps
  spotlightClicks?: boolean
  styles?: SofliaLegacyStyles
}

export type SofliaJoyrideProps = Omit<
  JoyrideProps,
  'onEvent' | 'options' | 'steps' | 'styles'
> & {
  callback?: SofliaJoyrideEventHandler
  disableCloseOnEsc?: boolean
  disableFocus?: boolean
  disableOverlay?: boolean
  disableOverlayClose?: boolean
  disableScrollParentFix?: boolean
  disableScrolling?: boolean
  floaterProps?: SofliaLegacyFloaterProps
  onEvent?: EventHandler
  options?: Partial<Options>
  scrollOffset?: number
  showProgress?: boolean
  showSkipButton?: boolean
  hideCloseButton?: boolean
  spotlightClicks?: boolean
  spotlightPadding?: number | SpotlightPadding
  spotlightRadius?: number
  steps: SofliaJoyrideStep[]
  styles?: SofliaLegacyStyles
}

export type {
  EventHandler as SofliaJoyrideNativeEventHandler,
  FloatingOptions as SofliaJoyrideFloatingOptions,
}
