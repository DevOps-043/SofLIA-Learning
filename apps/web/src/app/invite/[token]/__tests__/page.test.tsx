import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refreshUser: vi.fn(async () => null),
}))

vi.mock('next/navigation', () => ({
  useParams: () => ({ token: 'valid-bulk-invite-token-1234567890' }),
  useRouter: () => ({ push: mocks.push }),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('@/core/providers/I18nProvider', () => ({
  useLanguage: () => ({ language: 'en' }),
}))

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    loading: false,
    refreshUser: mocks.refreshUser,
    user: {
      display_name: 'Current user',
      email: 'user@example.com',
      id: 'user-1',
    },
  }),
}))

vi.mock('@/features/auth/components/AuthExperience', () => ({
  AuthExperience: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  authExperienceStyles: new Proxy({}, { get: () => '' }),
}))

vi.mock(
  '@/features/auth/components/SocialLoginButtons/SocialLoginButtons',
  () => ({ SocialLoginButtons: () => null }),
)

import InvitePage from '../page'

describe('InvitePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps a valid invite available when accepting discovers a stale session', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({
          invite: {
            expiresAt: '2099-01-01T00:00:00.000Z',
            id: 'link-1',
            name: 'Sales team',
            remainingUses: 5,
            role: 'member',
          },
          organization: {
            accentColor: null,
            googleLoginEnabled: false,
            id: 'org-1',
            logoUrl: null,
            microsoftLoginEnabled: false,
            name: 'Ditia',
            primaryColor: null,
            slug: 'ditia',
          },
          success: true,
          valid: true,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          { error: 'No autenticado. Por favor inicia sesión.', success: false },
          401,
        ),
      )

    render(<InvitePage />)

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'auth.invitation.acceptAndJoin',
      }),
    )

    await waitFor(() => expect(mocks.refreshUser).toHaveBeenCalledOnce())
    expect(screen.getByRole('alert')).toHaveTextContent(
      'auth.invitation.errors.unauthenticated',
    )
    expect(
      screen.queryByText('auth.invitation.unavailableTitle'),
    ).not.toBeInTheDocument()
  })
})

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
    status,
  })
}
