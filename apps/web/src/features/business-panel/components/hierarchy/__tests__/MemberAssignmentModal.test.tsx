import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HierarchyService } from '../../../services/hierarchy.service'
import { MemberAssignmentModal } from '../MemberAssignmentModal'

vi.mock('next/navigation', () => ({
  useParams: () => ({ orgSlug: 'acme' }),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (typeof options?.defaultValue === 'string') {
        return options.defaultValue.replace('{{count}}', String(options.count ?? ''))
      }

      const translations: Record<string, string> = {
        'hierarchy.members': 'Miembros',
        'hierarchy.memberModal.title': 'Asignar Miembro a General',
        'hierarchy.memberModal.placeholder': 'Buscar por nombre o correo...',
        'hierarchy.memberModal.roles.member': 'Miembro',
        'hierarchy.memberModal.roles.leader': 'Líder',
        'hierarchy.memberModal.submit': 'Asignar Usuario',
        'actions.cancel': 'Cancelar',
        'actions.close': 'Cerrar',
      }
      return translations[key] || key
    },
  }),
}))

vi.mock('../../../services/hierarchy.service', () => ({
  HierarchyService: {
    getAvailableUsersForNode: vi.fn(),
    assignUserToNode: vi.fn(),
  },
}))

const users = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    first_name: 'Diana',
    last_name: 'Coto',
    email: 'diana@acme.test',
    profile_picture_url: null,
    username: 'diana',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    first_name: 'Carlos',
    last_name: 'Suárez',
    email: 'carlos@acme.test',
    profile_picture_url: null,
    username: 'carlos',
  },
]

describe('MemberAssignmentModal', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(HierarchyService.getAvailableUsersForNode).mockResolvedValue(users)
    vi.mocked(HierarchyService.assignUserToNode).mockResolvedValue({ success: true })
  })

  it('selects all visible members and assigns every selected user', async () => {
    const onClose = vi.fn()
    const onSuccess = vi.fn()

    render(
      <MemberAssignmentModal
        isOpen
        onClose={onClose}
        nodeId="00000000-0000-4000-8000-000000000010"
        nodeName="General"
        onSuccess={onSuccess}
      />,
    )

    expect(await screen.findByText('Diana Coto', {}, { timeout: 1500 })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar todos' }))

    const submitButton = screen.getByRole('button', { name: 'Asignar 2 usuarios' })
    expect(submitButton).toBeEnabled()

    await act(async () => {
      fireEvent.click(submitButton)
    })

    await waitFor(() => expect(HierarchyService.assignUserToNode).toHaveBeenCalledTimes(2))
    expect(HierarchyService.assignUserToNode).toHaveBeenNthCalledWith(
      1,
      '00000000-0000-4000-8000-000000000010',
      users[0].id,
      'member',
      false,
      'acme',
    )
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('keeps leader assignment single-select', async () => {
    render(
      <MemberAssignmentModal
        isOpen
        onClose={vi.fn()}
        nodeId="00000000-0000-4000-8000-000000000010"
        nodeName="General"
        onSuccess={vi.fn()}
      />,
    )

    expect(await screen.findByText('Diana Coto', {}, { timeout: 1500 })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Líder' }))
    expect(await screen.findByText('Diana Coto', {}, { timeout: 1500 })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Diana Coto/ }))
    fireEvent.click(screen.getByRole('button', { name: /Carlos Suárez/ }))

    expect(screen.getByRole('button', { name: /Diana Coto/ })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: /Carlos Suárez/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('button', { name: 'Seleccionar todos' })).not.toBeInTheDocument()
  })
})
