import { describe, expect, it, vi } from 'vitest'
import { fromLoose } from '../looseQuery'

describe('fromLoose', () => {
  it('delegates the relation lookup to the provided client', () => {
    const table = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }
    const from = vi.fn().mockReturnValue(table)

    expect(fromLoose({ from }, 'organization_users')).toBe(table)
    expect(from).toHaveBeenCalledWith('organization_users')
  })
})
