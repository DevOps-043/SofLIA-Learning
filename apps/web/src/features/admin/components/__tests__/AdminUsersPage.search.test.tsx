import type { ReactNode } from 'react'
import { SWRConfig } from 'swr'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminUsersPage } from '../AdminUsersPage'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/admin/users',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('next/dynamic', () => ({ default: () => () => null }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock('@/core/providers/I18nProvider', () => ({ useLanguage: () => ({ language: 'es' }) }))
vi.mock('../../hooks/useAdminUserStatsFilters', () => ({
  useAdminUserStatsFilters: () => ({ companies: [], courses: [], learningPaths: [] }),
}))
vi.mock('../admin-users/admin-users-api', () => ({ createAdminUser: vi.fn(), deleteAdminUser: vi.fn() }))
vi.mock('../admin-users/master-panel/master-panel-api', () => ({ prefetchMasterPanelData: vi.fn() }))

// Keep the real page, state, debounce and SWR hook; replace visual-only children.
vi.mock('../admin-users', async () => {
  const { useAdminUsersPageState } = await import('../admin-users/useAdminUsersPageState')
  return {
    useAdminUsersPageState,
    AdminUsersLoadingState: () => <div>Initial loader</div>,
    AdminUsersErrorState: () => <div>Initial error</div>,
    AdminUsersHero: () => <h1>Usuarios</h1>,
    AdminUsersStatsGrid: () => <div>Estadísticas</div>,
    AdminUsersModals: () => null,
    AdminUsersFilterBar: ({ searchTerm, onSearchChange }: { searchTerm: string; onSearchChange: (v: string) => void }) => (
      <input aria-label="Buscar usuarios" value={searchTerm} onChange={e => onSearchChange(e.target.value)} />
    ),
    AdminUsersResults: ({ users }: { users: { id: string; display_name: string }[] }) => (
      <div>{users.length ? users.map(user => <p key={user.id}>{user.display_name}</p>) : 'Sin resultados'}</div>
    ),
    AdminUsersPagination: ({ onPageChange, isBusy }: { onPageChange: (page: number) => void; isBusy: boolean }) => (
      <button disabled={isBusy} onClick={() => onPageChange(2)}>Página 2</button>
    ),
  }
})

function deferredResponse() {
  let resolve!: (value: Response) => void
  const promise = new Promise<Response>(done => { resolve = done })
  return { promise, resolve }
}
function response(name?: string, page = 1) {
  return new Response(JSON.stringify({
    users: name ? [{ id: name, display_name: name }] : [],
    stats: { total: 55 }, total: name ? 1 : 0, page, totalPages: 2,
  }), { status: 200 })
}
function mount() {
  function Wrapper({ children }: { children: ReactNode }) {
    return <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>
  }
  return render(<AdminUsersPage />, { wrapper: Wrapper })
}
const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock) })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('AdminUsersPage search', () => {
  it('keeps the same focused input, header, stats and previous records during a debounced search', async () => {
    const pending = deferredResponse()
    fetchMock.mockResolvedValueOnce(response('Anterior')).mockReturnValueOnce(pending.promise)
    mount()
    expect(screen.getByText('Initial loader')).toBeInTheDocument()
    await screen.findByText('Anterior')
    const input = screen.getByRole('textbox')
    input.focus()
    fireEvent.change(input, { target: { value: 's' } })
    fireEvent.change(input, { target: { value: 'so' } })
    fireEvent.change(input, { target: { value: 'sofia' } })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(String(fetchMock.mock.calls[1][0])).toContain('search=sofia')
    expect(screen.getByRole('textbox')).toBe(input)
    expect(input).toHaveFocus()
    expect(screen.getByText('Estadísticas')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Usuarios' })).toBeInTheDocument()
    expect(screen.getByText('Anterior')).toBeInTheDocument()
    expect(screen.queryByText('Initial loader')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
    await act(async () => pending.resolve(response('Sofia')))
    await screen.findByText('Sofia')
    expect(screen.queryByText('Anterior')).not.toBeInTheDocument()
    expect(input).toHaveFocus()
  })

  it('preserves the search controls after empty results and a failed search, and recovers with a new query', async () => {
    const failed = deferredResponse()
    fetchMock.mockResolvedValueOnce(response()).mockReturnValueOnce(failed.promise).mockResolvedValueOnce(response('Recuperado'))
    mount()
    await screen.findByText('Sin resultados')
    const input = screen.getByRole('textbox')
    input.focus()
    fireEvent.change(input, { target: { value: 'error' } })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(screen.queryByText('Initial loader')).not.toBeInTheDocument()
    await act(async () => failed.resolve(new Response('{}', { status: 500 })))
    await screen.findByRole('alert')
    expect(screen.queryByText('Initial error')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBe(input)
    expect(input).toHaveFocus()
    fireEvent.change(input, { target: { value: 'nueva' } })
    await screen.findByText('Recuperado')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('keeps controls mounted during pagination and searches from page one', async () => {
    fetchMock.mockResolvedValueOnce(response('Primera')).mockResolvedValueOnce(response('Segunda', 2)).mockResolvedValue(response('Filtrado'))
    mount()
    await screen.findByText('Primera')
    const input = screen.getByRole('textbox')
    fireEvent.click(screen.getByRole('button', { name: 'Página 2' }))
    await screen.findByText('Segunda')
    expect(screen.getByRole('textbox')).toBe(input)
    fireEvent.change(input, { target: { value: 'filtro' } })
    await screen.findByText('Filtrado')
    await waitFor(() => expect(String(fetchMock.mock.calls.at(-1)?.[0])).toContain('page=1'))
    expect(screen.getByRole('textbox')).toBe(input)
  })
})
