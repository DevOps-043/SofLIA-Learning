import { z } from 'zod'

const LEARNING_PATH_TITLE_MAX_LENGTH = 180
const LEARNING_PATH_SLUG_MAX_LENGTH = 160
const LEARNING_PATH_DESCRIPTION_MAX_LENGTH = 2000

export const learningPathCreateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'El titulo de la ruta es requerido')
      .max(LEARNING_PATH_TITLE_MAX_LENGTH),
    slug: z.string().trim().max(LEARNING_PATH_SLUG_MAX_LENGTH).optional().nullable(),
    description: z
      .string()
      .trim()
      .max(LEARNING_PATH_DESCRIPTION_MAX_LENGTH)
      .optional()
      .nullable(),
    is_active: z.boolean().optional(),
  })
  .strict()

export type LearningPathCreateBody = z.infer<typeof learningPathCreateSchema>
