import type { LoadProfile, LoadProfileName } from './types'

export function resolveProfile(
  name: LoadProfileName,
  targetVus: number,
): LoadProfile {
  const profileTarget = Math.max(1, Math.floor(targetVus))

  switch (name) {
    case 'smoke':
      return buildProfile(name, 20, [
        { name: 'ramp-to-20', durationSec: 60, targetVus: 20 },
        { name: 'hold-20', durationSec: 240, targetVus: 20 },
      ])
    case 'load':
      return buildProfile(name, profileTarget, [
        { name: `ramp-to-${profileTarget}`, durationSec: 900, targetVus: profileTarget },
        { name: `hold-${profileTarget}`, durationSec: 1800, targetVus: profileTarget },
        { name: 'recovery', durationSec: 300, targetVus: 0 },
      ])
    case 'stress':
      return buildProfile(name, 1100, [
        { name: 'ramp-to-700', durationSec: 300, targetVus: 700 },
        { name: 'hold-700', durationSec: 600, targetVus: 700 },
        { name: 'hold-900', durationSec: 600, targetVus: 900 },
        { name: 'hold-1100', durationSec: 600, targetVus: 1100 },
        { name: 'recovery', durationSec: 300, targetVus: 0 },
      ])
    case 'spike':
      return buildProfile(name, profileTarget, [
        { name: `spike-to-${profileTarget}`, durationSec: 120, targetVus: profileTarget },
        { name: `hold-${profileTarget}`, durationSec: 600, targetVus: profileTarget },
        { name: 'recovery', durationSec: 120, targetVus: 0 },
      ])
    case 'soak':
      return buildProfile(name, profileTarget, [
        { name: 'ramp-to-350', durationSec: 300, targetVus: Math.min(350, profileTarget) },
        { name: `soak-to-${profileTarget}`, durationSec: 7200, targetVus: profileTarget },
        { name: 'recovery', durationSec: 300, targetVus: 0 },
      ])
  }
}

export function parseProfileName(raw: string | undefined): LoadProfileName {
  const value = raw || 'smoke'
  if (!['smoke', 'load', 'stress', 'spike', 'soak'].includes(value)) {
    throw new Error(
      `Unknown load profile "${value}". Expected smoke, load, stress, spike, or soak.`,
    )
  }

  return value as LoadProfileName
}

function buildProfile(
  name: LoadProfileName,
  maxVus: number,
  stages: LoadProfile['stages'],
): LoadProfile {
  return { name, maxVus, stages }
}
