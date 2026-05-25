const DISABLED_VALUES = new Set(['0', 'false', 'no', 'off', 'disabled'])

export function isLegacySessionFallbackEnabled() {
  const value = process.env.AUTH_LEGACY_SESSION_FALLBACK_ENABLED
  if (!value) {
    return true
  }

  return !DISABLED_VALUES.has(value.trim().toLowerCase())
}
