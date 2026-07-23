import { describe, expect, it } from 'vitest'

import { parseTimecodeToSeconds } from '../timecode'

describe('parseTimecodeToSeconds', () => {
  it('convierte mm:ss', () => {
    expect(parseTimecodeToSeconds('0:23')).toBe(23)
    expect(parseTimecodeToSeconds('1:58')).toBe(118)
    expect(parseTimecodeToSeconds('3:43')).toBe(223)
  })

  it('convierte h:mm:ss', () => {
    expect(parseTimecodeToSeconds('1:02:05')).toBe(3725)
  })

  it('rechaza formatos invalidos sin saltar a una posicion inventada', () => {
    expect(parseTimecodeToSeconds('12')).toBeNull()
    expect(parseTimecodeToSeconds('abc')).toBeNull()
    expect(parseTimecodeToSeconds('1:2:3:4')).toBeNull()
    expect(parseTimecodeToSeconds('-1:00')).toBeNull()
  })
})
