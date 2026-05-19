import { z } from 'zod'

const videoProviderEnum = z.enum(['youtube', 'vimeo', 'direct', 'custom'])

export const createLessonSchema = z.object({
  lesson_title: z.string().min(1).max(300),
  lesson_description: z.string().max(5_000).optional(),
  video_provider_id: z.string().min(1).max(500),
  video_provider: videoProviderEnum,
  duration_seconds: z.number().int().min(1).max(60 * 60 * 24),
  transcript_content: z.string().max(200_000).optional(),
  summary_content: z.string().max(50_000).optional(),
  is_published: z.boolean().optional(),
  instructor_id: z.string().uuid(),
})

export type CreateLessonBody = z.infer<typeof createLessonSchema>

export const updateLessonSchema = z.object({
  lesson_title: z.string().min(1).max(300).optional(),
  lesson_description: z.string().max(5_000).optional(),
  video_provider_id: z.string().min(1).max(500).optional(),
  video_provider: videoProviderEnum.optional(),
  duration_seconds: z.number().int().min(1).max(60 * 60 * 24).optional(),
  transcript_content: z.string().max(200_000).optional(),
  summary_content: z.string().max(50_000).optional(),
  is_published: z.boolean().optional(),
  instructor_id: z.string().uuid().optional(),
})

export type UpdateLessonBody = z.infer<typeof updateLessonSchema>

export const reorderLessonsSchema = z.object({
  lessons: z
    .array(
      z.object({
        lesson_id: z.string().uuid(),
        lesson_order_index: z.number().int().min(0).max(10_000),
      }),
    )
    .min(1)
    .max(1_000),
})

export type ReorderLessonsBody = z.infer<typeof reorderLessonsSchema>
