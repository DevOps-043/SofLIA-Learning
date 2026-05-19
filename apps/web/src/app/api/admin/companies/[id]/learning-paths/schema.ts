import { z } from 'zod'

export const assignLearningPathSchema = z
  .object({
    learningPathId: z.string().uuid('LearningPathId invalido'),
  })
  .strict()

export const companyLearningPathParamsSchema = z.object({
  id: z.string().uuid('OrganizationId invalido'),
})

export type AssignLearningPathBody = z.infer<typeof assignLearningPathSchema>
