import { expect, test } from '@playwright/test'

test('denies auth API requests from an unauthorized origin', async ({ request }) => {
  const response = await request.get('/api/auth/me', {
    headers: {
      Origin: 'https://evil.example',
    },
  })

  expect(response.status()).toBe(403)
  await expect(response.json()).resolves.toEqual({
    error: 'CORS_ORIGIN_NOT_ALLOWED',
    message: 'Origin is not in the allowed list',
  })
})
