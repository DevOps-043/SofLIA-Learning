import { describe, expect, it, vi } from 'vitest'

vi.mock('@/core/stores/themeStore', () => ({
  useThemeStore: (selector: (state: { resolvedTheme: 'dark' }) => unknown) =>
    selector({ resolvedTheme: 'dark' }),
}))

import { getNotificationActionUrl } from '../notification-ui'

describe('notification-ui', () => {
  it('normalizes internal notification action URLs', () => {
    expect(
      getNotificationActionUrl({
        metadata: { action_url: ' /dashboard/notifications ' },
      }),
    ).toBe('/dashboard/notifications')
  })

  it('rejects absolute and protocol-relative notification action URLs', () => {
    expect(
      getNotificationActionUrl({
        metadata: { action_url: 'https://example.com/phishing' },
      }),
    ).toBeNull()

    expect(
      getNotificationActionUrl({
        metadata: { actionUrl: '//example.com/phishing' },
      }),
    ).toBeNull()
  })
})
