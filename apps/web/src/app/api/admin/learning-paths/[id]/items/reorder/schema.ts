import { z } from 'zod'

const MAX_REORDERED_ITEMS = 500

export const reorderLearningPathItemsSchema = z
  .object({
    orderedItemIds: z
      .array(z.string().uuid('ItemId invalido'))
      .min(1)
      .max(MAX_REORDERED_ITEMS),
  })
  .strict()

export const learningPathParamsSchema = z.object({
  id: z.string().uuid('LearningPathId invalido'),
})

export type ReorderLearningPathItemsBody = z.infer<
  typeof reorderLearningPathItemsSchema
>
