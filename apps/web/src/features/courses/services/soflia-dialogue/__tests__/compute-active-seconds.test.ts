import { describe, expect, it } from 'vitest'

import { computeDialogueActiveSeconds } from '../dialogue-session/compute-active-seconds'

const turnAt = (seconds: number) => ({
  created_at: new Date(seconds * 1000).toISOString(),
})

describe('computeDialogueActiveSeconds', () => {
  it('sums inter-turn gaps and caps any gap above the threshold', () => {
    const turns = [turnAt(0), turnAt(30), turnAt(90), turnAt(400), turnAt(430)]

    // Gaps: 30, 60, 310 (capped to 300), 30 => 30 + 60 + 300 + 30 = 420
    expect(computeDialogueActiveSeconds(turns, 300)).toBe(420)
  })

  it('returns 0 for zero or one turns', () => {
    expect(computeDialogueActiveSeconds([], 300)).toBe(0)
    expect(computeDialogueActiveSeconds([turnAt(0)], 300)).toBe(0)
  })

  it('sums gaps without capping when none exceed the threshold', () => {
    const turns = [turnAt(0), turnAt(10), turnAt(25), turnAt(45)]

    expect(computeDialogueActiveSeconds(turns, 300)).toBe(45)
  })

  it('sorts unordered input before computing gaps', () => {
    const ordered = [turnAt(0), turnAt(30), turnAt(90)]
    const shuffled = [ordered[2], ordered[0], ordered[1]]

    expect(computeDialogueActiveSeconds(shuffled, 300)).toBe(
      computeDialogueActiveSeconds(ordered, 300),
    )
  })

  it('uses the default 300s threshold when none is provided', () => {
    const turns = [turnAt(0), turnAt(500)]

    expect(computeDialogueActiveSeconds(turns)).toBe(300)
  })
})
