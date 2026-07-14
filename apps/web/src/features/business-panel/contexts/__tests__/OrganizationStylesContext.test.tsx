import { render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  OrganizationStylesProvider,
  useOrganizationStylesContext,
} from '../OrganizationStylesContext'

const mockPathname = vi.hoisted(() => ({ value: '/valora-it/business-panel/dashboard' }))
const mockUser = vi.hoisted(() => ({
  value: {
    platform_role: 'Administrador',
    organization_id: null,
  },
}))

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname.value,
}))

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser.value }),
}))

vi.mock('@/core/stores/themeStore', () => ({
  useThemeStore: (selector?: (state: { resolvedTheme: 'dark' }) => unknown) => {
    const state = { resolvedTheme: 'dark' as const }
    return selector ? selector(state) : state
  },
}))

function ContextProbe() {
  const { loading } = useOrganizationStylesContext()
  return <span data-testid="loading">{String(loading)}</span>
}

describe('OrganizationStylesProvider', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        styles: {
          panel: {
            background_type: 'color',
            background_value: '#000000',
            primary_button_color: '#000000',
            secondary_button_color: '#8ed1fc',
            accent_color: '#8ed1fc',
            sidebar_background: '#000000',
            card_background: '#111111',
          },
          userDashboard: null,
          login: null,
          selectedTheme: 'branding-personalizado',
          supportsDualMode: true,
        },
      }),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('loads org-scoped styles by orgSlug for global admins without organization_id', async () => {
    render(
      <OrganizationStylesProvider orgSlug="valora-it">
        <ContextProbe />
      </OrganizationStylesProvider>,
    )

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/valora-it/business/styles', {
        credentials: 'include',
      })
    })
  })
})
