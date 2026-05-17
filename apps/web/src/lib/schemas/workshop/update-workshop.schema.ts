import { z } from 'zod'

export const UpdateWorkshopSchema = z.object({
  title: z.string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres')
    .trim()
    .optional(),
  description: z.union([
    z.string()
      .min(20, 'La descripción debe tener al menos 20 caracteres')
      .max(2000, 'La descripción no puede exceder 2000 caracteres')
      .trim(),
    z.literal(''),
    z.null(),
  ]).optional(),
  category: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  duration_total_minutes: z.number()
    .int('La duración debe ser un número entero')
    .min(0, 'La duración no puede ser negativa')
    .optional(),
  instructor_id: z.string()
    .uuid('ID de instructor inválido')
    .optional()
    .nullable(),
  is_active: z.boolean().optional(),
  thumbnail_url: z.union([
    z.string()
      .url('URL de imagen inválida')
      .max(500, 'La URL no puede exceder 500 caracteres'),
    z.literal(''),
    z.null(),
  ]).optional(),
  slug: z.union([
    z.string()
      .min(3, 'El slug debe tener al menos 3 caracteres')
      .max(100, 'El slug no puede exceder 100 caracteres')
      .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
    z.literal(''),
  ]).optional(),
  price: z.number()
    .min(0, 'El precio no puede ser negativo')
    .optional()
    .nullable(),
  learning_objectives: z.any().optional().nullable(),
  approval_status: z.enum(['pending', 'approved', 'rejected']).optional(),
  rejection_reason: z.string()
    .max(1000, 'La razón de rechazo no puede exceder 1000 caracteres')
    .optional()
    .nullable(),
}).partial()

export type UpdateWorkshopInput = z.infer<typeof UpdateWorkshopSchema>
