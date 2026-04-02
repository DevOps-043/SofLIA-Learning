import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  FormattedContentRenderer,
  PromptsRenderer,
  ReadingContentRenderer,
} from '@/features/courses/components/learn'
import { normalizeContentForRenderer } from '@/lib/course-content'

const mockedLearnPageLogic = {
  currentCourseId: 'course-1',
}

vi.mock('../CourseLearnPageShell', () => ({
  CourseLearnPageShell: ({ logic }: { logic: unknown }) => (
    <div
      data-has-logic={logic ? 'true' : 'false'}
      data-testid="course-learn-page-shell"
    />
  ),
}))

vi.mock('../../../../../features/courses/hooks/useLearnPageLogic', () => ({
  useLearnPageLogic: () => mockedLearnPageLogic,
}))

describe('Course learn page smoke', () => {
  it('exports CourseLearnPage as the default page component', async () => {
    const { default: CourseLearnPage } = await import('../page')

    expect(CourseLearnPage.name).toBe('CourseLearnPage')

    render(<CourseLearnPage />)

    expect(screen.getByTestId('course-learn-page-shell')).toHaveAttribute(
      'data-has-logic',
      'true'
    )
  })

  it('imports extracted content renderers without errors', () => {
    expect(FormattedContentRenderer).toBeTypeOf('function')
    expect(PromptsRenderer).toBeTypeOf('function')
    expect(ReadingContentRenderer).toBeTypeOf('function')
  })

  it('normalizes common renderer inputs into strings', () => {
    expect(normalizeContentForRenderer('Texto plano')).toBe('Texto plano')
    expect(
      normalizeContentForRenderer({ content: 'Contenido estructurado' })
    ).toBe('Contenido estructurado')
    expect(normalizeContentForRenderer(['uno', 'dos'])).toContain('uno')
    expect(normalizeContentForRenderer(['uno', 'dos'])).toContain('dos')
    expect(normalizeContentForRenderer(null)).toBe('')
  })
})
