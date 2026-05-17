import { z } from 'zod'

export const appPlatformFields = {
  is_featured: z.boolean().default(false),
  is_verified: z.boolean().default(false),
  is_active: z.boolean().default(true),
  difficulty_level: z
    .enum(['beginner', 'intermediate', 'advanced'], {
      errorMap: () => ({ message: 'Nivel de dificultad invalido' }),
    })
    .optional()
    .nullable(),
  rating: z
    .number()
    .min(0, 'La calificacion minima es 0')
    .max(5, 'La calificacion maxima es 5')
    .optional()
    .nullable(),
  api_available: z.boolean().default(false),
  mobile_app: z.boolean().default(false),
  desktop_app: z.boolean().default(false),
  browser_extension: z.boolean().default(false),
  integrations: z
    .array(z.string().max(100))
    .max(30, 'No se pueden agregar mas de 30 integraciones')
    .optional()
    .nullable(),
}
