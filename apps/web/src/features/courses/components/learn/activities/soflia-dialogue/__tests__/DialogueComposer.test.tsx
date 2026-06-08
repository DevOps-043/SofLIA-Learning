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
    expect(textarea).toHaveStyle({
      caretColor: 'var(--color-gray-900)',
      color: 'var(--color-gray-900)',
      WebkitTextFillColor: 'var(--color-gray-900)',
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
    expect(textarea).toHaveStyle({
      caretColor: 'var(--color-gray-50)',
      color: 'var(--color-gray-50)',
      WebkitTextFillColor: 'var(--color-gray-50)',
    })
  })
})
