import { render, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { parseMarkdownContent } from '../markdown-content'

const noopLink = vi.fn()

describe('parseMarkdownContent', () => {
  it('NO subraya "24/7" como si fuera un enlace de ruta (regresion)', () => {
    const { container } = render(
      <div>{parseMarkdownContent('cobertura 24/7 con turnos', noopLink, '#00f')}</div>,
    )

    // No debe haber ningun enlace ni boton: es texto corrido.
    expect(container.querySelector('a')).toBeNull()
    expect(container.querySelector('button')).toBeNull()
    expect(container.textContent).toContain('24/7')
  })

  it('renderiza [mm:ss] como boton clicable que salta al segundo correcto', () => {
    const onTimestampClick = vi.fn()
    const { container } = render(
      <div>
        {parseMarkdownContent('Desde el [1:58], se explica', noopLink, '#00f', onTimestampClick)}
      </div>,
    )

    const button = container.querySelector('button')
    expect(button).not.toBeNull()
    expect(button?.textContent).toBe('[1:58]')
    fireEvent.click(button as HTMLButtonElement)
    expect(onTimestampClick).toHaveBeenCalledWith(118)
  })

  it('reconoce el timestamp en negrita (**0:35**) como el modelo lo escribe a veces', () => {
    const onTimestampClick = vi.fn()
    const { container } = render(
      <div>
        {parseMarkdownContent('En el **0:35** se explica', noopLink, '#00f', onTimestampClick)}
      </div>,
    )

    const button = container.querySelector('button')
    expect(button?.textContent).toBe('[0:35]')
    fireEvent.click(button as HTMLButtonElement)
    expect(onTimestampClick).toHaveBeenCalledWith(35)
  })

  it('reconoce el timestamp suelto (mm:ss sin envolver)', () => {
    const onTimestampClick = vi.fn()
    const { container } = render(
      <div>
        {parseMarkdownContent('minuto 3:43 del video', noopLink, '#00f', onTimestampClick)}
      </div>,
    )

    const button = container.querySelector('button')
    expect(button?.textContent).toBe('[3:43]')
    fireEvent.click(button as HTMLButtonElement)
    expect(onTimestampClick).toHaveBeenCalledWith(223)
  })

  it('muestra [mm:ss] como texto (no boton) cuando no hay reproductor', () => {
    const { container } = render(
      <div>{parseMarkdownContent('Desde el [1:58], se explica', noopLink, '#00f')}</div>,
    )

    expect(container.querySelector('button')).toBeNull()
    expect(container.textContent).toContain('[1:58]')
  })

  it('sigue reconociendo rutas internas reales como enlaces', () => {
    const onLinkClick = vi.fn()
    const { container } = render(
      <div>{parseMarkdownContent('ve a /dashboard ahora', onLinkClick, '#00f')}</div>,
    )

    const link = container.querySelector('a')
    expect(link?.textContent).toBe('/dashboard')
  })

  it('sigue renderizando negrita', () => {
    const { container } = render(
      <div>{parseMarkdownContent('esto es **importante**', noopLink, '#00f')}</div>,
    )

    expect(container.querySelector('strong')?.textContent).toBe('importante')
  })
})
