import { z } from 'zod'

export const companyCourseAssignmentSchema = z
  .object({
    courseId: z.string().uuid('CourseId invalido'),
  })
  .strict()

export const companyCourseParamsSchema = z.object({
  id: z.string().uuid('OrganizationId invalido'),
})

export type CompanyCourseAssignmentBody = z.infer<
  typeof companyCourseAssignmentSchema
>
