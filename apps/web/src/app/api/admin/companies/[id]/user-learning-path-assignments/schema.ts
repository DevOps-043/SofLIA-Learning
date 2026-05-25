import { z } from 'zod'

export const assignUserLearningPathSchema = z
  .object({
    userId: z.string().uuid('UserId invalido'),
    learningPathId: z.string().uuid('LearningPathId invalido'),
  })
  .strict()

export const companyLearningPathParamsSchema = z.object({
  id: z.string().uuid('OrganizationId invalido'),
})

export type AssignUserLearningPathBody = z.infer<
  typeof assignUserLearningPathSchema
>
