import { z } from 'zod'

export const addLearningPathItemSchema = z
  .object({
    courseId: z.string().uuid('CourseId invalido'),
  })
  .strict()

export const learningPathParamsSchema = z.object({
  id: z.string().uuid('LearningPathId invalido'),
})

export type AddLearningPathItemBody = z.infer<typeof addLearningPathItemSchema>
