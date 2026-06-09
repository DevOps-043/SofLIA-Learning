// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DialogueComposer } from '../DialogueComposer'

let resolvedTheme: 'light' | 'dark' = 'light'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/core/providers/I18nProvider', () => ({
  useLanguage: () => ({ language: 'es' }),
}))

vi.mock('@/core/stores/themeStore', () => ({
  useThemeStore: () => ({ resolvedTheme }),
}))

vi.mock('@/features/courses/components/CourseLia/hooks/useCourseLiaSpeechInput', () => ({
  useCourseLiaSpeechInput: () => ({
    isListening: false,
    setVoiceError: vi.fn(),
    toggleListening: vi.fn(),
    voiceError: null,
  }),
}))

describe('DialogueComposer', () => {
  beforeEach(() => {
    resolvedTheme = 'light'
  })

  it('keeps typed text visible without inheriting course chat global selectors', () => {
    const onDraftMessageChange = vi.fn()

    render(
      <DialogueComposer
        canSendMessage
        draftMessage="Mi respuesta sobre productividad"
        isTerminal={false}
        onDraftMessageChange={onDraftMessageChange}
        onSendMessage={vi.fn()}
        sending={false}
      />,
    )

    const textarea = screen.getByPlaceholderText('activities.dialogue.placeholder')

    expect(textarea).toHaveAttribute('id', 'soflia-dialogue-composer-input')
    expect(textarea).toHaveClass('soflia-dialogue-input')
    expect(textarea).not.toHaveClass('lia-chat-input')
    expect(textarea).toHaveValue('Mi respuesta sobre productividad')
    // En modo claro el texto usa `--color-contrast` (token de texto estable de la
    // app: oscuro sobre fondo claro), no la paleta gris invertida que podia
    // resolver a blanco y dejar el texto invisible sobre el input blanco.
    expect(textarea).toHaveStyle({
      caretColor: 'var(--color-contrast)',
      color: 'var(--color-contrast)',
      WebkitTextFillColor: 'var(--color-contrast)',
    })

    fireEvent.change(textarea, {
      target: { value: 'Respuesta actualizada' },
    })

    expect(onDraftMessageChange).toHaveBeenCalledWith('Respuesta actualizada')
  })

  it('uses a dark composer surface in dark mode', () => {
    resolvedTheme = 'dark'

    render(
      <DialogueComposer
        canSendMessage
        draftMessage=""
        isTerminal={false}
        onDraftMessageChange={vi.fn()}
        onSendMessage={vi.fn()}
        sending={false}
      />,
    )

    const textarea = screen.getByPlaceholderText('activities.dialogue.placeholder')
    expect(textarea.parentElement).toHaveStyle({
      backgroundColor: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.14)',
    })
    // En modo oscuro el texto usa `--color-bg-light` (blanco en ambos modos),
    // garantizando contraste sobre la superficie oscura del input.
    expect(textarea).toHaveStyle({
      caretColor: 'var(--color-bg-light)',
      color: 'var(--color-bg-light)',
      WebkitTextFillColor: 'var(--color-bg-light)',
    })
  })
})
