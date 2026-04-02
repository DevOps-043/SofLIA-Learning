import { describe, expect, it, vi } from 'vitest'
import {
  buildContextualVoiceGuideStorageKey,
  hasSeenContextualVoiceGuideTour,
  markContextualVoiceGuideTourAsSeen,
  shouldAutoOpenContextualVoiceGuide,
} from '../services/contextual-voice-guide-storage.service'

describe('contextual-voice-guide-storage.service', () => {
  it('builds a stable storage key per tour', () => {
    expect(buildContextualVoiceGuideStorageKey('courses-tour')).toBe('has-seen-tour-courses-tour')
  })

  it('marks and detects viewed tours', () => {
    const storage = {
      getItem: vi.fn().mockReturnValueOnce(null).mockReturnValueOnce('true'),
      setItem: vi.fn(),
    } as unknown as Storage

    expect(hasSeenContextualVoiceGuideTour('tour-key', storage)).toBe(false)

    markContextualVoiceGuideTourAsSeen('tour-key', storage)
    expect(storage.setItem).toHaveBeenCalledWith('tour-key', 'true')
    expect(hasSeenContextualVoiceGuideTour('tour-key', storage)).toBe(true)
  })

  it('opens automatically only on matching trigger paths', () => {
    expect(shouldAutoOpenContextualVoiceGuide('/courses/intro', ['/courses'])).toBe(true)
    expect(shouldAutoOpenContextualVoiceGuide('/profile', ['/courses'])).toBe(false)
    expect(shouldAutoOpenContextualVoiceGuide(undefined, ['/courses'])).toBe(false)
  })
})
