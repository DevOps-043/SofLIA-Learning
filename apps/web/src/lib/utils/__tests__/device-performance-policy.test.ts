import { describe, expect, it } from 'vitest'
import { resolveDevicePerformancePolicy } from '../device-performance-policy'

describe('device-performance-policy', () => {
  it('keeps desktop interfaces fast and prefetch enabled on healthy devices', () => {
    const policy = resolveDevicePerformancePolicy({
      hardwareConcurrency: 8,
      deviceMemory: 8,
      platform: 'Win32',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120',
      viewportWidth: 1440,
    })

    expect(policy.interfaceMotionMode).toBe('fast')
    expect(policy.interfaceTransitionMs).toBe(140)
    expect(policy.interfaceStaggerMs).toBe(20)
    expect(policy.disableHeavyEffects).toBe(false)
    expect(policy.deferPrefetch).toBe(false)
  })

  it('uses minimal interface motion on mobile devices', () => {
    const policy = resolveDevicePerformancePolicy({
      hardwareConcurrency: 8,
      deviceMemory: 8,
      isCoarsePointer: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      viewportWidth: 390,
    })

    expect(policy.interfaceMotionMode).toBe('minimal')
    expect(policy.interfaceTransitionMs).toBe(80)
    expect(policy.interfaceStaggerMs).toBe(0)
    expect(policy.disableHeavyEffects).toBe(true)
    expect(policy.disablePageExitAnimations).toBe(true)
  })

  it('removes interface motion when the user requests reduced motion', () => {
    const policy = resolveDevicePerformancePolicy({
      prefersReducedMotion: true,
      platform: 'Win32',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120',
      viewportWidth: 1440,
    })

    expect(policy.interfaceMotionMode).toBe('minimal')
    expect(policy.interfaceTransitionMs).toBe(0)
    expect(policy.disableHeavyEffects).toBe(true)
  })

  it('conserves resources on low-memory or constrained-network devices', () => {
    const lowMemoryPolicy = resolveDevicePerformancePolicy({
      deviceMemory: 2,
      hardwareConcurrency: 8,
      viewportWidth: 1366,
    })
    const slowNetworkPolicy = resolveDevicePerformancePolicy({
      effectiveType: '3g',
      hardwareConcurrency: 8,
      viewportWidth: 1366,
    })

    expect(lowMemoryPolicy.interfaceMotionMode).toBe('minimal')
    expect(slowNetworkPolicy.interfaceMotionMode).toBe('minimal')
    expect(lowMemoryPolicy.reducePolling).toBe(true)
    expect(slowNetworkPolicy.deferPrefetch).toBe(true)
  })
})
