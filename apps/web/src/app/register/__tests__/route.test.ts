import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { GET } from '../route'

describe('GET /register', () => {
  it('redirects legacy invite URLs to the canonical invite landing page', () => {
    const token = 'Y2x-TE2zMXrP2DtuIAGK_n-RXuRs254Y'
    const response = GET(
      new NextRequest(`https://soflia.ai/register?invite=${token}`),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      `https://soflia.ai/invite/${token}`,
    )
  })

  it('does not redirect malformed tokens', async () => {
    const response = GET(
      new NextRequest('https://soflia.ai/register?invite=../dashboard'),
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toMatchObject({ success: false })
  })
})
