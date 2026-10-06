import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PackagesSection } from '../PackagesSection'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key === 'packages.items'
      ? [
          { id: 'diagnosis', name: 'Diagnóstico', scope: 'Inicio', description: 'Diagnóstico del equipo' },
          { id: 'pilot', name: 'Piloto', scope: 'Práctica', description: 'Prueba enfocada' },
          { id: 'enterprise', name: 'Enterprise', scope: 'Escala', description: 'Evolución continua' },
        ]
      : key,
  }),
}))

const scrollIntoView = vi.fn()
const scrollRail = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    matches: query === '(max-width: 1199px)',
    media: query,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })))
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    configurable: true, value: scrollIntoView,
  })
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true, value: scrollRail,
  })
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('mobile package navigation', () => {
  it('does not scroll the page down to the packages on initial render', () => {
    render(<PackagesSection />)

    expect(screen.getByRole('tab', { name: /Diagnóstico/ })).toHaveAttribute('aria-selected', 'true')
    expect(scrollIntoView).not.toHaveBeenCalled()
    expect(window.scrollTo).not.toHaveBeenCalled()
    expect(scrollRail).toHaveBeenCalledWith({ left: expect.any(Number), behavior: 'smooth' })
    expect(scrollRail.mock.instances[0]).toBe(screen.getByRole('tablist'))
  })

  it('keeps rail navigation horizontal when another package is selected', () => {
    render(<PackagesSection />)
    fireEvent.click(screen.getByRole('tab', { name: /Enterprise/ }))

    expect(screen.getByRole('tab', { name: /Enterprise/ })).toHaveAttribute('aria-selected', 'true')
    expect(scrollIntoView).not.toHaveBeenCalled()
    expect(window.scrollTo).not.toHaveBeenCalled()
    expect(scrollRail.mock.instances.every((instance) => instance === screen.getByRole('tablist'))).toBe(true)
  })

  it('moves keyboard focus without moving the document', () => {
    render(<PackagesSection />)
    const nextTab = screen.getByRole('tab', { name: /Piloto/ })
    const focus = vi.spyOn(nextTab, 'focus')

    fireEvent.keyDown(screen.getByRole('tab', { name: /Diagnóstico/ }), { key: 'ArrowRight' })

    expect(nextTab).toHaveAttribute('aria-selected', 'true')
    expect(nextTab).toHaveFocus()
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
    expect(scrollIntoView).not.toHaveBeenCalled()
    expect(window.scrollTo).not.toHaveBeenCalled()
  })
})
