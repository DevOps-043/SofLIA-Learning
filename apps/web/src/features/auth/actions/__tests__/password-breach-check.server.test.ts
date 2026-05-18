import { describe, expect, it, vi } from 'vitest'

import { checkPasswordAgainstHibp } from '../password-breach-check.server'

describe('checkPasswordAgainstHibp', () => {
  it('detects a password suffix returned by the k-anonymity API', async () => {
    const fetcher = vi.fn(async () =>
      new Response('1E4C9B93F3F0682250B6CF8331B7EE68FD8:3303003\r\nABCDEF:1'),
    ) as unknown as typeof fetch

    const result = await checkPasswordAgainstHibp('password', fetcher)

    expect(fetcher).toHaveBeenCalledWith(
      'https://api.pwnedpasswords.com/range/5BAA6',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Add-Padding': 'true' }),
      }),
    )
    expect(result).toEqual({
      breachCount: 3303003,
      isBreached: true,
      skipped: false,
    })
  })

  it('fails open when the HIBP API is unavailable', async () => {
    const fetcher = vi.fn(async () => new Response('', { status: 503 })) as unknown as typeof fetch

    await expect(checkPasswordAgainstHibp('UniquePassword123!', fetcher)).resolves.toEqual({
      isBreached: false,
      skipped: true,
    })
  })
})
