// @vitest-environment jsdom

import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  Controls,
  EventHandler,
  FloatingOptions,
  Options,
  PartialDeep,
  Step,
  Styles,
} from 'react-joyride'

import { SofliaJoyride } from '../SofliaJoyride'
import type { SofliaJoyrideEvent } from '../../types/joyride'

type CapturedJoyrideProps = {
  floatingOptions?: Partial<FloatingOptions>
  onEvent?: EventHandler
  options?: Partial<Options>
  steps: Step[]
  styles?: PartialDeep<Styles>
}

const { joyrideSpy } = vi.hoisted(() => ({
  joyrideSpy: vi.fn<(props: CapturedJoyrideProps) => JSX.Element>(),
}))

vi.mock('react-joyride', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-joyride')>()

  return {
    ...actual,
    Joyride: (props: CapturedJoyrideProps) => {
      joyrideSpy(props)
      return <div data-testid="mock-joyride" />
    },
  }
})

function getCapturedProps(): CapturedJoyrideProps {
  const props = joyrideSpy.mock.calls.at(-1)?.[0]

  if (!props) {
    throw new Error('Joyride was not rendered')
  }

  return props
}

describe('SofliaJoyride', () => {
  beforeEach(() => {
    joyrideSpy.mockClear()
  })

  it('normalizes legacy Joyride v2 props into Joyride v3 options', () => {
    const callback = vi.fn()

    render(
      <SofliaJoyride
        callback={callback}
        disableCloseOnEsc
        disableFocus
        disableOverlay
        disableOverlayClose
        floaterProps={{
          disableAnimation: true,
          hideArrow: true,
          offset: 20,
          styles: {
            floater: {
              filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3))',
            },
          },
        }}
        run
        scrollOffset={120}
        showProgress
        showSkipButton
        spotlightClicks={false}
        spotlightPadding={8}
        spotlightRadius={18}
        steps={[
          {
            content: 'Step content',
            disableBeacon: true,
            disableScrolling: true,
            floaterProps: {
              hideArrow: true,
              offset: 15,
            },
            spotlightClicks: true,
            styles: {
              options: {
                arrowColor: 'var(--color-gray-800)',
                zIndex: 10000,
              },
              overlay: {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                pointerEvents: 'none',
              },
              spotlight: {
                borderRadius: 16,
              },
            },
            target: '#target',
          },
        ]}
        styles={{
          options: {
            arrowColor: 'var(--color-gray-800)',
            zIndex: 10000,
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          },
        }}
      />,
    )

    const props = getCapturedProps()

    expect(props.options).toMatchObject({
      blockTargetInteraction: true,
      buttons: ['back', 'close', 'primary', 'skip'],
      disableFocusTrap: true,
      dismissKeyAction: false,
      hideOverlay: true,
      offset: 20,
      overlayClickAction: false,
      overlayColor: 'rgba(0, 0, 0, 0.7)',
      scrollOffset: 120,
      showProgress: true,
      spotlightPadding: 8,
      spotlightRadius: 18,
    })
    expect(props.floatingOptions).toMatchObject({ hideArrow: true })
    expect(props.styles?.floater).toMatchObject({
      filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3))',
    })
    expect(props.styles?.tooltip).toMatchObject({ transition: 'none' })

    expect(props.steps[0]).toMatchObject({
      blockTargetInteraction: false,
      offset: 15,
      skipBeacon: true,
      skipScroll: true,
      spotlightRadius: 16,
    })
    expect(props.steps[0]?.floatingOptions).toMatchObject({ hideArrow: true })
    expect(props.steps[0]?.styles?.spotlight).not.toHaveProperty('borderRadius')

    const event = { index: 0 } as SofliaJoyrideEvent
    const controls = {} as Controls
    props.onEvent?.(event, controls)

    expect(callback).toHaveBeenCalledWith(event)
  })
})
