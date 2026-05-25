import { z } from 'zod'

export const userCourseAssignmentSchema = z
  .object({
    userId: z.string().uuid('UserId invalido'),
    courseId: z.string().uuid('CourseId invalido'),
  })
  .strict()

export const companyUserAssignmentParamsSchema = z.object({
  id: z.string().uuid('OrganizationId invalido'),
})

export type UserCourseAssignmentBody = z.infer<typeof userCourseAssignmentSchema>
