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

// El formulario de materiales envía siempre file_url/external_url, incluso vacíos
// para tipos que no usan URL (quiz, exercise, reading). Tratamos '' y null como
// "sin URL" (undefined); el servicio decide el null final según el material_type.
const optionalUrl = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.string().url().max(2_000).optional(),
)

export const createMaterialSchema = z.object({
  material_title: z.string().min(1).max(300),
  material_description: z.string().max(5_000).optional(),
  material_type: materialTypeEnum,
  file_url: optionalUrl,
  external_url: optionalUrl,
  content_data: contentDataSchema.optional(),
  is_downloadable: z.boolean().optional(),
  estimated_time_minutes: z.number().int().min(0).max(10_000).optional(),
})

export type CreateMaterialBody = z.infer<typeof createMaterialSchema>

export const updateMaterialSchema = z.object({
  material_title: z.string().min(1).max(300).optional(),
  material_description: z.string().max(5_000).optional(),
  material_type: materialTypeEnum.optional(),
  file_url: optionalUrl,
  external_url: optionalUrl,
  content_data: contentDataSchema.optional(),
  is_downloadable: z.boolean().optional(),
  estimated_time_minutes: z.number().int().min(0).max(10_000).optional(),
})

export type UpdateMaterialBody = z.infer<typeof updateMaterialSchema>
