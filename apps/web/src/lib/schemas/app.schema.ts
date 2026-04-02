import { z } from 'zod'

/**
 * Schema para crear aplicacion IA.
 */
export const CreateAppSchema = z.object({
  name: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),

  slug: z
    .string()
    .min(3, 'El slug debe tener al menos 3 caracteres')
    .max(100, 'El slug no puede exceder 100 caracteres')
    .regex(
      /^[a-z0-9-]+$/,
      'El slug solo puede contener letras minusculas, numeros y guiones',
    )
    .optional(),

  description: z
    .string()
    .min(10, 'La descripcion debe tener al menos 10 caracteres')
    .max(500, 'La descripcion no puede exceder 500 caracteres')
    .trim()
    .optional()
    .nullable(),

  long_description: z
    .string()
    .max(5000, 'La descripcion larga no puede exceder 5000 caracteres')
    .optional()
    .nullable(),

  category_id: z.string().uuid('ID de categoria invalido').optional().nullable(),

  website_url: z
    .string()
    .url('URL de sitio web invalida')
    .max(500, 'La URL no puede exceder 500 caracteres')
    .optional()
    .nullable(),

  logo_url: z
    .string()
    .url('URL de logo invalida')
    .max(500, 'La URL no puede exceder 500 caracteres')
    .optional()
    .nullable(),

  pricing_model: z
    .enum(['free', 'freemium', 'paid', 'subscription'], {
      errorMap: () => ({
        message:
          'Tipo de precio invalido. Debe ser: free, freemium, paid o subscription',
      }),
    })
    .optional()
    .nullable(),

  pricing_details: z
    .union([
      z.string().max(1000, 'Los detalles de precio no pueden exceder 1000 caracteres'),
      z.record(z.unknown()),
    ])
    .optional()
    .nullable(),

  features: z
    .array(z.string().max(200))
    .max(50, 'No se pueden agregar mas de 50 caracteristicas')
    .optional()
    .nullable(),

  use_cases: z
    .array(z.string().max(200))
    .max(30, 'No se pueden agregar mas de 30 casos de uso')
    .optional()
    .nullable(),

  advantages: z
    .array(z.string().max(300))
    .max(30, 'No se pueden agregar mas de 30 ventajas')
    .optional()
    .nullable(),

  disadvantages: z
    .array(z.string().max(300))
    .max(30, 'No se pueden agregar mas de 30 desventajas')
    .optional()
    .nullable(),

  alternatives: z
    .array(z.string().max(200))
    .max(30, 'No se pueden agregar mas de 30 alternativas')
    .optional()
    .nullable(),

  tags: z
    .array(z.string().max(50))
    .max(20, 'No se pueden agregar mas de 20 tags')
    .optional()
    .nullable(),

  supported_languages: z
    .array(z.string().max(100))
    .max(50, 'No se pueden agregar mas de 50 idiomas soportados')
    .optional()
    .nullable(),

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
})

/**
 * Schema para actualizar aplicacion IA.
 */
export const UpdateAppSchema = CreateAppSchema.partial()

/**
 * Tipos TypeScript inferidos.
 */
export type CreateAppInput = z.infer<typeof CreateAppSchema>
export type UpdateAppInput = z.infer<typeof UpdateAppSchema>
