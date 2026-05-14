import { describe, expect, it } from 'vitest'

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
