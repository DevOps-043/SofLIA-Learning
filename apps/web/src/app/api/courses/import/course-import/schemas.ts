import { z } from 'zod'

export const ActivitySchema = z.object({
  title: z.string(),
  type: z.enum(['quiz', 'lia_script', 'puzzle', 'reflection']),
  data: z.record(z.unknown()),
})

export const NewMaterialSchema = z.object({
  title: z.string(),
  url: z.string().optional(),
  type: z.enum(['link', 'download', 'pdf', 'document', 'quiz']),
  description: z.string().optional(),
  data: z.record(z.unknown()).optional(),
})

export const ContentBlockSchema = z.object({
  title: z.string(),
  type: z.string(),
  content: z.string(),
  order: z.number(),
})

export const NewLessonSchema = z.object({
  title: z.string(),
  order_index: z.number(),
  summary: z.string().optional(),
  transcription: z.string().optional(),
  video_url: z.string().optional(),
  duration: z.number().optional(),
  materials: z.array(NewMaterialSchema).optional().default([]),
  activities: z.array(ActivitySchema).optional().default([]),
  content_blocks: z.array(ContentBlockSchema).optional().default([]),
})

export const NewModuleSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  order_index: z.number(),
  lessons: z.array(NewLessonSchema),
})

export const CourseImportPayloadSchema = z.object({
  source: z.object({
    platform: z.string(),
    version: z.string(),
    artifact_id: z.string(),
  }),
  course: z.object({
    title: z.string(),
    description: z.string(),
    is_published: z.boolean().optional(),
    category: z.string().default('General'),
    level: z.string().default('beginner'),
    instructor_email: z.string().email().optional(),
    thumbnail_url: z.string().nullable().optional(),
    slug: z.string().optional(),
  }),
  modules: z.array(NewModuleSchema),
})
