import { z } from 'zod'

export const appPricingFields = {
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
}
