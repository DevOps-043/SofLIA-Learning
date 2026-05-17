import { z } from 'zod'

export const ActivitySchema = z.object({
  activity_config: z.unknown().optional(),
  activity_schema_version: z.number().int().positive().optional(),
  data: z.record(z.unknown()),
  estimated_time_minutes: z.number().int().positive().optional(),
  is_required: z.boolean().optional(),
  title: z.string(),
  type: z.enum(['quiz', 'lia_script', 'puzzle', 'reflection']),
})

export const NewMaterialSchema = z.object({
  data: z.record(z.unknown()).optional(),
  description: z.string().optional(),
  title: z.string(),
  type: z.enum(['link', 'download', 'pdf', 'document', 'quiz']),
  url: z.string().optional(),
})

export const ContentBlockSchema = z.object({
  content: z.string(),
  order: z.number(),
  title: z.string(),
  type: z.string(),
})

export const NewLessonSchema = z.object({
  activities: z.array(ActivitySchema).optional().default([]),
  content_blocks: z.array(ContentBlockSchema).optional().default([]),
  duration: z.number().optional(),
  materials: z.array(NewMaterialSchema).optional().default([]),
  order_index: z.number(),
  summary: z.string().optional(),
  title: z.string(),
  transcription: z.string().optional(),
  video_url: z.string().optional(),
})

export const NewModuleSchema = z.object({
  description: z.string().optional(),
  lessons: z.array(NewLessonSchema),
  order_index: z.number(),
  title: z.string(),
})

export const CourseImportPayloadSchema = z.object({
  course: z.object({
    category: z.string().default('General'),
    description: z.string(),
    instructor_email: z.string().email().optional(),
    is_published: z.boolean().optional(),
    level: z.string().default('beginner'),
    slug: z.string().optional(),
    thumbnail_url: z.string().nullable().optional(),
    title: z.string(),
  }),
  modules: z.array(NewModuleSchema),
  source: z.object({
    artifact_id: z.string(),
    platform: z.string(),
    version: z.string(),
  }),
})

export type CourseImportPayload = z.infer<typeof CourseImportPayloadSchema>
export type CourseImportModule = CourseImportPayload['modules'][number]
export type CourseImportLesson = CourseImportModule['lessons'][number]
export type CourseImportMaterial = CourseImportLesson['materials'][number]
export type CourseImportActivity = CourseImportLesson['activities'][number]
