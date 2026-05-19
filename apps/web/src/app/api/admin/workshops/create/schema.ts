import { z } from 'zod'

export const createWorkshopAdminSchema = z.object({
  title: z
    .string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres'),
  description: z
    .string()
    .min(20, 'La descripción debe tener al menos 20 caracteres')
    .max(2000, 'La descripción no puede exceder 2000 caracteres'),
  category: z.string().min(1, 'La categoría es requerida').max(120),
  level: z.string().min(1, 'El nivel es requerido').max(120),
  duration_total_minutes: z
    .number()
    .int('La duración debe ser un número entero')
    .min(1, 'La duración debe ser mayor a 0')
    .max(60 * 24 * 30),
  instructor_id: z.string().uuid('ID de instructor inválido'),
  is_active: z.boolean().optional().default(false),
  thumbnail_url: z
    .union([z.string().url('URL de imagen inválida'), z.literal(''), z.null()])
    .optional(),
  slug: z.string().min(1, 'El slug es requerido').max(160),
  price: z
    .number()
    .min(0, 'El precio no puede ser negativo')
    .max(1_000_000)
    .optional()
    .default(0),
  learning_objectives: z.array(z.unknown()).max(50).optional().default([]),
})

export type CreateWorkshopAdminBody = z.infer<typeof createWorkshopAdminSchema>
