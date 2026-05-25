import { z } from 'zod'
import { supportedExternalToolKeys } from '@/features/courses/types/activity-config'

export const activityTypeSchema = z.enum([
  'reflection',
  'exercise',
  'quiz',
  'discussion',
  'ai_chat',
  'reading',
])

export const externalToolKeySchema = z.enum(supportedExternalToolKeys).nullable()

export const baseActivityPayloadSchema = z.object({
  activity_title: z.string().trim().min(1).max(200),
  activity_description: z.string().trim().max(4000).optional(),
  activity_type: activityTypeSchema,
  activity_content: z.string().max(50000),
  activity_config: z.unknown().nullable().optional(),
  activity_schema_version: z.number().int().min(1).max(50).optional(),
  ai_prompts: z.string().max(20000).nullable().optional(),
  external_tool_key: externalToolKeySchema.optional(),
  is_required: z.boolean().optional(),
  estimated_time_minutes: z.number().int().min(1).max(480).optional(),
  requires_soflia_validation: z.boolean().optional(),
})

export const createActivityPayloadSchema = baseActivityPayloadSchema

export const updateActivityPayloadSchema = baseActivityPayloadSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar la actividad.',
  })
