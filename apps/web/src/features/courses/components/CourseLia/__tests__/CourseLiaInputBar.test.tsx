// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { CourseLiaInputBar } from '../components/CourseLiaInputBar'
import type { CourseLiaThemeColors } from '../types'

const themeColors: CourseLiaThemeColors = {
  accentColor: 'var(--color-accent)',
  assistantLinkColor: 'var(--color-accent)',
  borderColor: 'var(--color-gray-200)',
  headerBg: 'transparent',
  inputBg: 'var(--color-bg-light)',
  inputBorder: 'var(--color-gray-200)',
  messageBubbleAssistant: 'transparent',
  messageBubbleUser: 'transparent',
  panelBg: 'transparent',
  primaryAction: 'var(--color-accent)',
  textPrimary: 'var(--color-gray-900)',
  textSecondary: 'var(--color-gray-500)',
}

function renderInputBar(overrides: Partial<React.ComponentProps<typeof CourseLiaInputBar>> = {}) {
  const onInputChange = vi.fn()

  render(
    <CourseLiaInputBar
      inputRef={createRef<HTMLTextAreaElement>()}
      inputValue="Texto visible"
      isInteractionBlocked={false}
      isLightTheme
      isListening={false}
      isMobile={false}
      onInputChange={onInputChange}
      onKeyDown={vi.fn()}
      onPrimaryAction={vi.fn()}
      placeholder="Escribe tu respuesta"
      primaryActionLabel="Enviar"
      primaryActionMode="send"
      themeColors={themeColors}
      {...overrides}
    />,
  )

  return { onInputChange }
}

describe('CourseLiaInputBar', () => {
  it('renders custom input selectors and keeps controlled input changes', () => {
    const { onInputChange } = renderInputBar({
      inputClassName: 'lia-input-reset soflia-dialogue-input',
      inputId: 'soflia-dialogue-composer-input',
    })

    const textarea = screen.getByPlaceholderText('Escribe tu respuesta')

    expect(textarea).toHaveAttribute('id', 'soflia-dialogue-composer-input')
    expect(textarea).toHaveClass('lia-input-reset')
    expect(textarea).toHaveClass('soflia-dialogue-input')
    expect(textarea).not.toHaveClass('lia-chat-input')
    expect(textarea).toHaveValue('Texto visible')

    fireEvent.change(textarea, { target: { value: 'Nueva respuesta' } })

    expect(onInputChange).toHaveBeenCalledWith('Nueva respuesta')
  })
})
