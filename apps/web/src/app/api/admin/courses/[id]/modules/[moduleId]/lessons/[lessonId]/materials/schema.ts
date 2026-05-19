import { z } from 'zod'

const materialTypeEnum = z.enum([
  'pdf',
  'link',
  'document',
  'quiz',
  'exercise',
  'reading',
])

const contentDataSchema = z.record(z.unknown())

export const createMaterialSchema = z.object({
  material_title: z.string().min(1).max(300),
  material_description: z.string().max(5_000).optional(),
  material_type: materialTypeEnum,
  file_url: z.string().url().max(2_000).optional(),
  external_url: z.string().url().max(2_000).optional(),
  content_data: contentDataSchema.optional(),
  is_downloadable: z.boolean().optional(),
  estimated_time_minutes: z.number().int().min(0).max(10_000).optional(),
})

export type CreateMaterialBody = z.infer<typeof createMaterialSchema>

export const updateMaterialSchema = z.object({
  material_title: z.string().min(1).max(300).optional(),
  material_description: z.string().max(5_000).optional(),
  material_type: materialTypeEnum.optional(),
  file_url: z.string().url().max(2_000).optional(),
  external_url: z.string().url().max(2_000).optional(),
  content_data: contentDataSchema.optional(),
  is_downloadable: z.boolean().optional(),
  estimated_time_minutes: z.number().int().min(0).max(10_000).optional(),
})

export type UpdateMaterialBody = z.infer<typeof updateMaterialSchema>
