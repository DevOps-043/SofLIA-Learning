import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActivityModal } from '../ActivityModal'

describe('ActivityModal', () => {
  it('submits a structured interactive activity payload', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()

    render(<ActivityModal lessonId="lesson-1" onClose={onClose} onSave={onSave} />)

    fireEvent.change(screen.getByPlaceholderText('Ej: Analiza y valida esta noticia'), {
      target: { value: 'Actividad interactiva' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Contenido' }))
    fireEvent.change(
      screen.getByPlaceholderText('Instrucciones, contexto y texto rico de la actividad.'),
      {
        target: { value: 'Escribe una reflexion y pega evidencia.' },
      },
    )

    fireEvent.click(screen.getByRole('button', { name: 'Guardar actividad' }))

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))

    const payload = onSave.mock.calls[0]?.[0]
    expect(payload.activity_type).toBe('reflection')
    expect(payload.activity_config?.interactionType).toBe('long_text')
    expect(payload.activity_schema_version).toBe(1)
    expect(payload.requires_soflia_validation).toBe(false)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
