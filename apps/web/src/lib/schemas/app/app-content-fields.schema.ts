import { z } from 'zod'

export const appContentFields = {
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
}
