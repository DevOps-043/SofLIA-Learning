import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseMarkdownContent } from '../markdown'

describe('parseMarkdownContent', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders safe markdown links', () => {
    render(<div>{parseMarkdownContent('[SofLIA](https://soflia.com)', vi.fn())}</div>)

    expect(screen.getByRole('link', { name: 'SofLIA' })).toHaveAttribute(
      'href',
      'https://soflia.com',
    )
  })

  it('does not render javascript links from markdown input', () => {
    render(<div>{parseMarkdownContent('[Click](javascript:alert)', vi.fn())}</div>)

    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('Click')).toBeInTheDocument()
  })
})
