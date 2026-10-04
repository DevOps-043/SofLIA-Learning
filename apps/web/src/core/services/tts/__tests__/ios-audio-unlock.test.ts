import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'

const audio = {
  src: '', preload: '', currentTime: 0,
  setAttribute: vi.fn(),
  play: vi.fn(() => Promise.resolve()),
  pause: vi.fn(),
}
const createObjectURL = vi.fn<typeof URL.createObjectURL>(() => 'blob:audio-unlock')
const revokeObjectURL = vi.fn()
let listeners: MockInstance<typeof window.addEventListener>

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  audio.play.mockReset().mockResolvedValue(undefined)
  audio.src = ''
  listeners = vi.spyOn(window, 'addEventListener')
  vi.stubGlobal('Audio', vi.fn(function AudioMock() { return audio }))
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = createObjectURL
    static revokeObjectURL = revokeObjectURL
  })
})

afterEach(() => {
  for (const [event, listener, options] of listeners.mock.calls) {
    window.removeEventListener(event, listener, options)
  }
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('iOS audio unlock under the enforced media CSP', () => {
  it('plays a blob WAV, releases it and detaches gesture listeners after unlocking', async () => {
    const { getSharedAudioElement, isAudioUnlocked } = await import('../client/ios-audio-unlock')
    expect(getSharedAudioElement()).toBe(audio)

    window.dispatchEvent(new Event('pointerdown'))
    expect(audio.src).toBe('blob:audio-unlock')
    const wav = createObjectURL.mock.calls[0][0] as Blob
    expect(wav.type).toBe('audio/wav')
    expect(wav.size).toBe(60)
    await vi.waitFor(() => expect(isAudioUnlocked()).toBe(true))
    expect(audio.pause).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:audio-unlock')

    window.dispatchEvent(new Event('pointerdown'))
    expect(audio.play).toHaveBeenCalledOnce()
  })

  it('does not start overlapping unlock attempts for a touch gesture', async () => {
    let finish = () => {}
    audio.play.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve }))
    const { getSharedAudioElement, isAudioUnlocked } = await import('../client/ios-audio-unlock')
    getSharedAudioElement()

    window.dispatchEvent(new Event('pointerdown'))
    window.dispatchEvent(new Event('touchend'))
    window.dispatchEvent(new Event('mousedown'))
    expect(audio.play).toHaveBeenCalledOnce()
    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(isAudioUnlocked()).toBe(false)

    finish()
    await vi.waitFor(() => expect(isAudioUnlocked()).toBe(true))
  })

  it('reuses the clip and retries on the next gesture after playback is rejected', async () => {
    audio.play.mockRejectedValueOnce(new DOMException('Blocked', 'NotAllowedError'))
    const { getSharedAudioElement, isAudioUnlocked } = await import('../client/ios-audio-unlock')
    getSharedAudioElement()

    window.dispatchEvent(new Event('pointerdown'))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(isAudioUnlocked()).toBe(false)
    expect(revokeObjectURL).not.toHaveBeenCalled()

    window.dispatchEvent(new Event('keydown'))
    await vi.waitFor(() => expect(isAudioUnlocked()).toBe(true))
    expect(audio.play).toHaveBeenCalledTimes(2)
    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledOnce()
  })
})
