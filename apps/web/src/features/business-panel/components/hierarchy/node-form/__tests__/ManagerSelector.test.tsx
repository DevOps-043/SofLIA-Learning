import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ManagerSelector } from '../ManagerSelector'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => options?.defaultValue || key,
  }),
}))

describe('ManagerSelector', () => {
  it('shows organization users as soon as the search field receives focus', () => {
    render(
      <ManagerSelector
        selectedManager={null}
        managerSearch=""
        managerResults={[{
          id: '00000000-0000-4000-8000-000000000001',
          first_name: 'Diana',
          last_name: 'Coto',
          email: 'diana@acme.test',
          profile_picture_url: null,
          username: 'diana',
        }]}
        isSearchingManager={false}
        onSearchChange={vi.fn()}
        onSelectManager={vi.fn()}
        onClearManager={vi.fn()}
      />,
    )

    expect(screen.queryByText('Diana Coto')).not.toBeInTheDocument()
    fireEvent.focus(screen.getByRole('searchbox'))
    expect(screen.getByText('Diana Coto')).toBeInTheDocument()
  })
})
