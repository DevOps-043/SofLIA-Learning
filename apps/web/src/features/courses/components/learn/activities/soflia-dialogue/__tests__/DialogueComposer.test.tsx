// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DialogueComposer } from '../DialogueComposer'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/core/providers/I18nProvider', () => ({
  useLanguage: () => ({ language: 'es' }),
}))

vi.mock('@/core/stores/themeStore', () => ({
  useThemeStore: () => ({ resolvedTheme: 'light' }),
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
      caretColor: 'var(--color-legacy-0f172a)',
      color: 'var(--color-legacy-0f172a)',
      WebkitTextFillColor: 'var(--color-legacy-0f172a)',
    })

    fireEvent.change(textarea, {
      target: { value: 'Respuesta actualizada' },
    })

    expect(onDraftMessageChange).toHaveBeenCalledWith('Respuesta actualizada')
  })
})
