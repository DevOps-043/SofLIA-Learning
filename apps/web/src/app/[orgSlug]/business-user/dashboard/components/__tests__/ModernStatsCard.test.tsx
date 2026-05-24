import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ModernStatsCard } from '../ModernStatsCard'

vi.mock('../../../../../../core/stores/themeStore', () => ({
  useThemeStore: () => ({ resolvedTheme: 'light' }),
}))

describe('ModernStatsCard', () => {
  it('renders with the fallback icon when no icon is provided', () => {
    render(
      <ModernStatsCard
        label="Cursos asignados"
        value={7}
        color="from-blue-500 to-cyan-500"
        index={0}
      />
    )

    expect(screen.getByText('Cursos asignados')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })
})
