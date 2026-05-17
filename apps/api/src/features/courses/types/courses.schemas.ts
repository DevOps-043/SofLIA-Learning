import { z } from 'zod'

import {
  nonEmptyStringSchema,
  paginationQuerySchema,
  sortDirectionSchema,
} from '@/core/validation/common.schemas'

export const courseOrderBySchema = z.enum([
  'created_at',
  'title',
  'average_rating',
  'student_count',
])

export const courseLevelSchema = z.enum(['beginner', 'intermediate', 'advanced'])

const booleanQuerySchema = z.preprocess((value) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }
  return value
}, z.boolean())

export const courseListQuerySchema = paginationQuerySchema.extend({
  category: z.string().optional(),
  level: courseLevelSchema.optional(),
  search: z.string().optional(),
  isActive: booleanQuerySchema.default(true),
  orderBy: courseOrderBySchema.default('created_at'),
  orderDirection: sortDirectionSchema.default('desc'),
})

export const courseSlugParamsSchema = z.object({ slug: nonEmptyStringSchema })
export const courseIdParamsSchema = z.object({ courseId: nonEmptyStringSchema })

export const lessonIdParamsSchema = z.object({
  courseId: nonEmptyStringSchema,
  lessonId: nonEmptyStringSchema,
})

export const updateProgressBodySchema = z.object({
  progressPercent: z.number().int().min(0).max(100),
  timeSpentSeconds: z.number().int().min(0).optional(),
  isCompleted: z.boolean().optional(),
  lastPosition: z.number().int().min(0).optional(),
})

export const enrollmentBodySchema = z.object({
  courseId: nonEmptyStringSchema,
})

export type CourseListQuery = z.infer<typeof courseListQuerySchema>
export type UpdateProgressInput = z.infer<typeof updateProgressBodySchema>
export type EnrollmentInput = z.infer<typeof enrollmentBodySchema>
