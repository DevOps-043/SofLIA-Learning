import { z } from 'zod'

export const appIdentityFields = {
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
}
