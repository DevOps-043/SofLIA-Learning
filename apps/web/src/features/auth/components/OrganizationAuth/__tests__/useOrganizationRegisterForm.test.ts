// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { pushMock, registerActionMock } = vi.hoisted(() => {
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      }),
      writable: true,
    });
  }

  return {
    pushMock: vi.fn(),
    registerActionMock: vi.fn(),
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/core/stores/themeStore', () => ({
  useThemeStore: (selector: (state: { resolvedTheme: string }) => unknown) =>
    selector({ resolvedTheme: 'light' }),
}));

vi.mock('../../../actions/register', () => ({
  registerAction: registerActionMock,
}));

import { useOrganizationRegisterForm } from '../organization-register-form/useOrganizationRegisterForm';

function createJsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

describe('useOrganizationRegisterForm', () => {
  const originalFetch = global.fetch;
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue(
      createJsonResponse({
        success: true,
        styles: {
          login: {
            primary_button_color: 'var(--color-legacy-112233)',
            card_background: 'var(--color-bg-light)',
            text_color: 'var(--color-legacy-111827)',
          },
        },
      })
    ) as typeof fetch;
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = originalFetch;
    window.matchMedia = originalMatchMedia;
  });

  it('submits the register action and redirects after a successful response', async () => {
    registerActionMock.mockResolvedValue({
      success: true,
      message: 'Cuenta creada exitosamente',
    });

    const { result } = renderHook(() =>
      useOrganizationRegisterForm({
        organizationId: 'org-1',
        organizationSlug: 'soflia',
        invitedEmail: 'invite@test.com',
      })
    );

    await vi.waitFor(() => {
      expect(result.current.palette.primaryColor).toBe('var(--color-legacy-112233)');
    });

    await act(async () => {
      await result.current.onSubmit({
        firstName: 'Ada',
        lastName: 'Lovelace',
        username: 'ada',
        countryCode: 'MX',
        phoneNumber: '5512345678',
        email: 'invite@test.com',
        confirmEmail: 'invite@test.com',
        password: 'Secret12345!',
        confirmPassword: 'Secret12345!',
        acceptTerms: true,
      });
    });

    await vi.waitFor(() => {
      expect(result.current.success).toBe('Cuenta creada exitosamente');
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(pushMock).toHaveBeenCalledWith('/auth/soflia');
  });
});
