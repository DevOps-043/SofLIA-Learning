export const CONTEXTUAL_VOICE_GUIDE_STORAGE_PREFIX = 'has-seen-tour-'

export function buildContextualVoiceGuideStorageKey(tourId: string): string {
  return `${CONTEXTUAL_VOICE_GUIDE_STORAGE_PREFIX}${tourId}`
}

export function hasSeenContextualVoiceGuideTour(
  storageKey: string,
  storage: Storage | null | undefined = typeof window !== 'undefined' ? window.localStorage : undefined
): boolean {
  if (!storage) {
    return false
  }

  return storage.getItem(storageKey) !== null
}

export function markContextualVoiceGuideTourAsSeen(
  storageKey: string,
  storage: Storage | null | undefined = typeof window !== 'undefined' ? window.localStorage : undefined
) {
  storage?.setItem(storageKey, 'true')
}

export function shouldAutoOpenContextualVoiceGuide(
  pathname: string | null | undefined,
  triggerPaths: string[]
): boolean {
  if (!pathname) {
    return false
  }

  return triggerPaths.some((path) => pathname === path || pathname.startsWith(path))
}
