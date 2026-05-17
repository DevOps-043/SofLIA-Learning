import { z } from 'zod'

export const CreateWorkshopSchema = z.object({
  title: z.string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres')
    .trim(),
  description: z.string()
    .min(20, 'La descripción debe tener al menos 20 caracteres')
    .max(2000, 'La descripción no puede exceder 2000 caracteres')
    .trim(),
  instructor_id: z.string().uuid('ID de instructor inválido'),
  community_id: z.string()
    .uuid('ID de comunidad inválido')
    .optional()
    .nullable(),
  date: z.string()
    .datetime('Fecha inválida, debe ser ISO 8601')
    .or(z.date()),
  duration_minutes: z.number()
    .int('La duración debe ser un número entero')
    .min(15, 'La duración mínima es 15 minutos')
    .max(480, 'La duración máxima es 480 minutos (8 horas)'),
  max_participants: z.number()
    .int('El máximo de participantes debe ser un número entero')
    .min(1, 'Debe permitir al menos 1 participante')
    .max(1000, 'El máximo de participantes no puede exceder 1000')
    .optional()
    .nullable(),
  is_online: z.boolean().default(true),
  meeting_url: z.string()
    .url('URL de reunión inválida')
    .max(500, 'La URL no puede exceder 500 caracteres')
    .optional()
    .nullable(),
  location: z.string()
    .max(200, 'La ubicacion no puede exceder 200 caracteres')
    .optional()
    .nullable(),
  tags: z.array(z.string())
    .max(10, 'No se pueden agregar más de 10 tags')
    .optional(),
  resources: z.array(z.object({
    title: z.string().max(100),
    url: z.string().url(),
    type: z.enum(['document', 'video', 'link', 'other']).optional(),
  }))
    .max(20, 'No se pueden agregar más de 20 recursos')
    .optional(),
})

export type CreateWorkshopInput = z.infer<typeof CreateWorkshopSchema>
