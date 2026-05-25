import { describe, expect, it } from 'vitest'
import {
  UnsafeFetchUrlError,
  validateSafeFetchUrl,
} from '../safe-fetch'

describe('validateSafeFetchUrl', () => {
  it('rejects the cloud metadata endpoint', async () => {
    await expect(
      validateSafeFetchUrl('https://169.254.169.254/latest/meta-data', {
        allowedHosts: ['169.254.169.254'],
      }),
    ).rejects.toBeInstanceOf(UnsafeFetchUrlError)
  })

  it('rejects non-https URLs before DNS resolution', async () => {
    await expect(
      validateSafeFetchUrl('http://example.com/video.mp4', {
        requireHostAllowlist: false,
      }),
    ).rejects.toThrow('Only https URLs are allowed')
  })

  it('rejects hosts outside the allowlist', async () => {
    await expect(
      validateSafeFetchUrl('https://evil.example/video.mp4', {
        allowedHosts: ['cdn.soflia.com'],
        resolveHostname: async () => ['8.8.8.8'],
      }),
    ).rejects.toThrow('allowlist')
  })

  it('accepts an allowed public host', async () => {
    const url = await validateSafeFetchUrl('https://cdn.soflia.com/video.mp4', {
      allowedHosts: ['cdn.soflia.com'],
      resolveHostname: async () => ['8.8.8.8'],
    })

    expect(url.hostname).toBe('cdn.soflia.com')
  })
})
