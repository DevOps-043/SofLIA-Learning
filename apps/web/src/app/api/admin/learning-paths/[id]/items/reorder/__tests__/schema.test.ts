import { describe, expect, it } from 'vitest'
import { reorderLearningPathItemsSchema } from '../schema'

const FIRST_ITEM_ID = '00000000-0000-4000-8000-000000000001'
const SECOND_ITEM_ID = '00000000-0000-4000-8000-000000000002'

describe('reorderLearningPathItemsSchema', () => {
  it('accepts a valid ordered item list', () => {
    const result = reorderLearningPathItemsSchema.safeParse({
      orderedItemIds: [FIRST_ITEM_ID, SECOND_ITEM_ID],
    })

    expect(result.success).toBe(true)
  })

  it('rejects empty item lists', () => {
    const result = reorderLearningPathItemsSchema.safeParse({
      orderedItemIds: [],
    })

    expect(result.success).toBe(false)
  })

  it('rejects invalid item ids', () => {
    const result = reorderLearningPathItemsSchema.safeParse({
      orderedItemIds: [FIRST_ITEM_ID, 'item-2'],
    })

    expect(result.success).toBe(false)
  })
})
