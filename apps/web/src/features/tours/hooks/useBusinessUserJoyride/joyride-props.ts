import type { CallBackProps, Step } from 'react-joyride'
import { JoyrideTooltip } from '../../components/JoyrideTooltip'

type Translate = (key: string) => string

interface BuildBusinessUserJoyridePropsParams {
  callback: (data: CallBackProps) => void
  isMobile: boolean
  run: boolean
  runnableSteps: Step[]
  stepIndex: number
  t: Translate
}

export function buildBusinessUserJoyrideProps({
  callback,
  isMobile,
  run,
  runnableSteps,
  stepIndex,
  t,
}: BuildBusinessUserJoyridePropsParams) {
  return {
    steps: runnableSteps,
    run,
    stepIndex,
    callback,
    continuous: true,
    showProgress: false,
    showSkipButton: true,
    hideCloseButton: false,
    disableOverlayClose: false,
    disableCloseOnEsc: false,
    disableScrolling: false,
    scrollToFirstStep: true,
    scrollOffset: isMobile ? 88 : 120,
    spotlightClicks: true,
    spotlightPadding: isMobile ? 12 : 8,
    tooltipComponent: JoyrideTooltip,
    styles: {
      options: { zIndex: 999999, arrowColor: '#1E2329' },
      spotlight: { borderRadius: 16, zIndex: 1000000 },
      overlay: { backgroundColor: 'rgba(0, 0, 0, 0.7)', pointerEvents: 'none' },
    },
    floaterProps: {
      disableAnimation: isMobile,
      hideArrow: false,
      offset: isMobile ? 10 : 15,
      styles: {
        floater: {
          zIndex: 1000001,
          filter: isMobile ? 'none' : 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3))',
        },
      },
    },
    locale: {
      back: t('actions.back'),
      close: t('actions.close'),
      last: t('actions.finish'),
      next: t('actions.next'),
      skip: t('actions.skip'),
    },
  }
}
