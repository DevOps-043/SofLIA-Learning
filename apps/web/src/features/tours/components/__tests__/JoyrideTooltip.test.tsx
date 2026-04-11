// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TooltipRenderProps } from 'react-joyride'

import { JoyrideTooltip } from '../JoyrideTooltip'

afterEach(() => {
  cleanup()
})

function makeTooltipProps(
  overrides: Partial<TooltipRenderProps> = {},
): TooltipRenderProps {
  return {
    backProps: {
      'aria-label': 'Anterior',
      onClick: vi.fn(),
      role: 'button',
      title: 'Anterior',
    },
    closeProps: {
      'aria-label': 'Cerrar',
      onClick: vi.fn(),
      role: 'button',
      title: 'Cerrar',
    },
    continuous: true,
    index: 0,
    isLastStep: false,
    primaryProps: {
      'aria-label': 'Siguiente',
      onClick: vi.fn(),
      role: 'button',
      title: 'Siguiente',
    },
    skipProps: {
      'aria-label': 'Saltar',
      onClick: vi.fn(),
      role: 'button',
      title: 'Saltar',
    },
    size: 6,
    step: {
      target: 'body',
      title: 'Paso de prueba',
      content: 'Contenido de prueba',
      data: {},
    },
    tooltipProps: {
      'aria-modal': true,
      className: 'joyride-tooltip-shell',
      ref: vi.fn(),
      role: 'dialog',
      style: {
        pointerEvents: 'auto',
      },
    },
    ...overrides,
  } as TooltipRenderProps
}

describe('JoyrideTooltip', () => {
  it('preserves the tooltip wrapper styles required by Joyride', () => {
    render(<JoyrideTooltip {...makeTooltipProps()} />)

    const dialog = screen.getByRole('dialog')

    expect(dialog.style.pointerEvents).toBe('auto')
    expect(dialog.className).toContain('joyride-tooltip-shell')
  })

  it('delegates the primary action click to Joyride', () => {
    const onNext = vi.fn()

    render(
      <JoyrideTooltip
        {...makeTooltipProps({
          primaryProps: {
            'aria-label': 'Siguiente',
            onClick: onNext,
            role: 'button',
            title: 'Siguiente',
          },
        })}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('docks the video step tooltip to the left side of the viewport', () => {
    const target = document.createElement('div')
    target.id = 'video-step-target'
    target.getBoundingClientRect = vi.fn(() => ({
      bottom: 540,
      height: 320,
      left: 320,
      right: 1200,
      toJSON: () => '',
      top: 220,
      width: 880,
      x: 320,
      y: 220,
    }))
    document.body.appendChild(target)

    render(
      <JoyrideTooltip
        {...makeTooltipProps({
          step: {
            target: '#video-step-target',
            title: 'Paso de video',
            content: 'Contenido de video',
            data: {
              tooltipDock: 'fixed-left',
              tooltipWidth: 'compact',
            },
          },
        })}
      />,
    )

    const dialog = screen.getByRole('dialog')

    expect(dialog.style.position).toBe('fixed')
    expect(dialog.style.left).toBe('24px')
    expect(dialog.style.top).toBe('244px')

    target.remove()
  })
})
