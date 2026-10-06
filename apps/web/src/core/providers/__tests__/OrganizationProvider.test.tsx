import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SWRConfig } from 'swr'
import { OrganizationProvider } from '../OrganizationProvider'
import { useOrganizationStore } from '@/core/stores/organizationStore'
import SelectOrganizationPage from '@/app/auth/select-organization/page'

const { router } = vi.hoisted(() => ({ router: { push: vi.fn(), replace: vi.fn() } }))
const { push, replace } = router
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => '/auth/select-organization',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock('@/features/auth/components/AuthExperience', () => ({
  AuthExperience: ({ children }: { children: React.ReactNode }) => children,
  authExperienceStyles: {},
}))

describe('organization selection during deferred loading', () => {
  let idleCallback: IdleRequestCallback
  let resolveFetch: (response: Response) => void
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useOrganizationStore.persist.setOptions({
      storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    })
    useOrganizationStore.setState({
      currentOrganization: null, userOrganizations: [], isHydrated: true, isLoading: false,
    })
    vi.stubGlobal('requestIdleCallback', vi.fn((callback: IdleRequestCallback) => { idleCallback = callback; return 1 }))
    vi.stubGlobal('cancelIdleCallback', vi.fn())
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockImplementation(() => new Promise<Response>(resolve => { resolveFetch = resolve }))
  })

  afterEach(() => { cleanup(); vi.unstubAllGlobals() })

  function renderSelector() {
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <OrganizationProvider><SelectOrganizationPage /></OrganizationProvider>
      </SWRConfig>,
    )
  }

  async function startRequest() {
    await act(async () => { idleCallback({ didTimeout: false, timeRemaining: () => 50 }) })
    expect(fetchMock).toHaveBeenCalledWith('/api/users/organizations', expect.objectContaining({ cache: 'no-store' }))
  }

  it('waits before and during the fetch, then displays multiple organizations without redirecting', async () => {
    renderSelector()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(replace).not.toHaveBeenCalled()
    expect(useOrganizationStore.getState().isLoading).toBe(true)
    await startRequest()
    expect(replace).not.toHaveBeenCalled()
    await act(async () => resolveFetch(new Response(JSON.stringify({ success: true, organizations: [
      { id: 'org-1', name: 'Acme', slug: 'acme', role: 'member' },
      { id: 'org-2', name: 'Second company', slug: 'second', role: 'owner' },
    ] }))))
    await waitFor(() => expect(screen.getByText('Acme')).toBeInTheDocument())
    expect(screen.getByText('Second company')).toBeInTheDocument()
    expect(replace).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
  })

  it('redirects to onboarding only after the server confirms an empty list', async () => {
    renderSelector()
    await startRequest()
    expect(replace).not.toHaveBeenCalled()
    await act(async () => resolveFetch(new Response(JSON.stringify({ success: true, organizations: [] }))))
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'))
  })

  it('routes a single member to their organization’s employee dashboard after loading', async () => {
    renderSelector()
    await startRequest()
    await act(async () => resolveFetch(new Response(JSON.stringify({ success: true, organizations: [
      { id: 'org-1', name: 'Acme', slug: 'acme', role: 'member' },
    ] }))))
    await waitFor(() => expect(push).toHaveBeenCalledWith('/acme/business-user/dashboard'))
    expect(replace).not.toHaveBeenCalled()
  })
})
